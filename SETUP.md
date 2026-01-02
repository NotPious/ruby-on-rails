# Setup Guide - GLP-1 E-Commerce Platform
## Windows 11 Edition (Hybrid Development)

This guide uses a **hybrid approach**: Docker runs infrastructure services (PostgreSQL, Redis, MinIO) while Rails and React run natively on Windows for the best development experience.

---

## Prerequisites

### Required Software

#### 1. Docker Desktop (Required for Infrastructure)
Docker Desktop runs PostgreSQL, Redis, and MinIO so you don't need to install them natively.

**Installation:**
1. Download from: https://www.docker.com/products/docker-desktop/
2. Run the installer and enable WSL 2 backend when prompted
3. Restart your computer when installation completes
4. Launch Docker Desktop and wait for it to fully start
5. Verify: `docker --version` and `docker ps`

**Troubleshooting:**
- If Docker won't start: `wsl --install` then restart
- Enable "Virtual Machine Platform" and "Windows Subsystem for Linux" in Windows Features
- Check BIOS virtualization is enabled

#### 2. Git for Windows (Includes Git Bash)
**Installation:**
1. Download from: https://git-scm.com/download/win
2. Install with default options
3. Verify: `git --version`

#### 3. Node.js (Required for React)
**Installation:**
Download from: https://nodejs.org/ (LTS version 18+)

**Verify:**
```bash
node --version    # Should be 18+
npm --version
```

#### 4. Ruby with DevKit (Required for Rails)
**Installation:**
1. Download from: https://rubyinstaller.org/downloads/
2. Choose **Ruby+Devkit 3.2.x (x64)** - the "+Devkit" part is critical!
3. Run installer:
   - ✅ Add Ruby to PATH
   - ✅ Install MSYS2 and development toolchain
4. At the end of installation, a console window appears
5. **Important:** Choose option **3** (MSYS2 and MINGW development toolchain)
6. Wait for installation to complete

**If you missed the MSYS2 installation:**
```bash
ridk install
# Choose option 3
```

**Verify:**
```bash
ruby --version    # Should be 3.2+
gem --version
ridk version      # Should show MSYS2 is installed
```

#### 5. Visual Studio Code (Recommended)
**Installation:**
Download from: https://code.visualstudio.com/

**Required Extensions:**
```bash
code --install-extension ms-azuretools.vscode-docker
code --install-extension rebornix.Ruby
code --install-extension Shopify.ruby-lsp
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension GraphQL.vscode-graphql
```

#### 6. Rails
```bash
gem install rails -v 7.1.0
rails --version
```

---

## Project Setup

### Step 1: Create Project Structure

Open Git Bash:

```bash
cd ~/Repos
mkdir ruby-on-rails
cd ruby-on-rails
```

### Step 2: Create Docker Infrastructure

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: glp1-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: glp1_ecommerce_development
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: glp1-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: glp1-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  minio_data:

networks:
  default:
    name: glp1-network
```

### Step 3: Start Infrastructure Services

```bash
# Start only the infrastructure (not backend/frontend)
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs if needed
docker-compose logs -f
```

You should see:
- ✅ glp1-postgres (healthy)
- ✅ glp1-redis (healthy)
- ✅ glp1-minio (healthy)

---

## Backend Setup (Rails)

### Step 1: Create Rails Application

```bash
# Create Rails API application
rails new backend --api --database=postgresql --skip-test

cd backend
```

### Step 2: Configure Gemfile

Edit `backend/Gemfile` and add:

```ruby
# GraphQL
gem 'graphql'
gem 'graphiql-rails', group: :development

# CORS
gem 'rack-cors'

# Background Jobs
gem 'sidekiq'
gem 'redis'

# AWS Services (optional)
gem 'aws-sdk-s3'
gem 'aws-sdk-sqs'

# Payment Processing
gem 'stripe'

# Development/Testing
group :development, :test do
  gem 'pry-rails'
  gem 'faker'
end
```

### Step 3: Install Dependencies

```bash
bundle install
```

**If you get MSYS2 errors:**
```bash
ridk install
# Choose option 3
bundle install
```

### Step 4: Configure Database

Edit `backend/config/database.yml`:

```yaml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  host: <%= ENV.fetch("DB_HOST") { "localhost" } %>
  username: <%= ENV.fetch("DB_USERNAME") { "postgres" } %>
  password: <%= ENV.fetch("DB_PASSWORD") { "password" } %>

development:
  <<: *default
  database: glp1_ecommerce_development

test:
  <<: *default
  database: glp1_ecommerce_test

production:
  <<: *default
  database: glp1_ecommerce_production
  url: <%= ENV['DATABASE_URL'] %>
```

### Step 5: Configure CORS

Edit `backend/config/initializers/cors.rb`:

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'localhost:3001', '127.0.0.1:3001'

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
```

### Step 6: Configure Sidekiq

Create `backend/config/initializers/sidekiq.rb`:

```ruby
Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
end
```

Edit `backend/config/routes.rb`:

```ruby
require 'sidekiq/web'

Rails.application.routes.draw do
  mount Sidekiq::Web => '/sidekiq' if Rails.env.development?
  post "/graphql", to: "graphql#execute"
  
  if Rails.env.development?
    mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql"
  end
end
```

### Step 7: Generate GraphQL Setup

```bash
rails generate graphql:install
```

This creates:
- `app/graphql/types/`
- `app/graphql/mutations/`
- `app/graphql/queries/`
- Updates `config/routes.rb`

### Step 8: Create Database

```bash
# Create the database (connects to Docker PostgreSQL)
rails db:create

# Verify connection
rails db:migrate
```

### Step 9: Generate Models

```bash
# Product model
rails generate model Product \
  name:string \
  description:text \
  price:decimal{10,2} \
  category:string \
  inventory_count:integer \
  glp1_stage:string \
  educational_content:text

# Order model
rails generate model Order \
  user_email:string \
  status:string \
  total_amount:decimal{10,2} \
  payment_status:string

# OrderItem model
rails generate model OrderItem \
  order:references \
  product:references \
  quantity:integer \
  price:decimal{10,2}

# Cart model
rails generate model Cart \
  session_id:string

# CartItem model
rails generate model CartItem \
  cart:references \
  product:references \
  quantity:integer

# Run migrations
rails db:migrate
```

### Step 10: Add Model Associations

Edit `backend/app/models/order.rb`:

```ruby
class Order < ApplicationRecord
  has_many :order_items, dependent: :destroy
  has_many :products, through: :order_items
  
  validates :user_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, presence: true
  validates :total_amount, presence: true, numericality: { greater_than: 0 }
end
```

Edit `backend/app/models/cart.rb`:

```ruby
class Cart < ApplicationRecord
  has_many :cart_items, dependent: :destroy
  has_many :products, through: :cart_items
  
  validates :session_id, presence: true, uniqueness: true
end
```

Edit `backend/app/models/product.rb`:

```ruby
class Product < ApplicationRecord
  has_many :order_items
  has_many :cart_items
  
  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :inventory_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
```

Edit `backend/app/models/order_item.rb`:

```ruby
class OrderItem < ApplicationRecord
  belongs_to :order
  belongs_to :product
  
  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :price, presence: true, numericality: { greater_than: 0 }
end
```

Edit `backend/app/models/cart_item.rb`:

```ruby
class CartItem < ApplicationRecord
  belongs_to :cart
  belongs_to :product
  
  validates :quantity, presence: true, numericality: { greater_than: 0 }
end
```

### Step 11: Seed Database

Create `backend/db/seeds.rb`:

```ruby
Product.destroy_all

products = [
  {
    name: "Premium Whey Protein Isolate",
    description: "High-quality protein to support muscle maintenance during weight loss. 25g protein per serving, easy to digest.",
    price: 49.99,
    category: "Supplements",
    inventory_count: 100,
    glp1_stage: "active",
    educational_content: "Protein intake is crucial during GLP-1 therapy to preserve lean muscle mass. Aim for 1.2-1.6g per kg of body weight daily."
  },
  {
    name: "Meal Prep Container Set",
    description: "BPA-free, microwave-safe containers perfect for portion control. Set of 10 with dividers.",
    price: 29.99,
    category: "Meal Prep",
    inventory_count: 150,
    glp1_stage: "starting",
    educational_content: "Portion control is essential when starting GLP-1 medication. These containers help visualize appropriate serving sizes."
  },
  {
    name: "Resistance Band Set",
    description: "5 levels of resistance for strength training at home. Includes door anchor and exercise guide.",
    price: 34.99,
    category: "Fitness",
    inventory_count: 75,
    glp1_stage: "active",
    educational_content: "Resistance training 2-3x per week helps maintain metabolism and muscle mass during weight loss."
  },
  {
    name: "Hydration Tracker Bottle",
    description: "32oz bottle with time markers to ensure adequate hydration throughout the day.",
    price: 24.99,
    category: "Wellness",
    inventory_count: 200,
    glp1_stage: "starting",
    educational_content: "Staying hydrated reduces common GLP-1 side effects like nausea and constipation. Aim for 64-80oz daily."
  },
  {
    name: "Digital Food Scale",
    description: "Accurate to 1g, helps track macronutrients and portion sizes. Rechargeable battery.",
    price: 19.99,
    category: "Meal Prep",
    inventory_count: 120,
    glp1_stage: "starting",
    educational_content: "Accurate food tracking helps you understand hunger cues and nutritional needs during medication adjustment."
  },
  {
    name: "Omega-3 Fish Oil",
    description: "High-potency EPA/DHA for cardiovascular health. 60 capsules, 2-month supply.",
    price: 39.99,
    category: "Supplements",
    inventory_count: 90,
    glp1_stage: "maintenance",
    educational_content: "Omega-3s support heart health, especially important as you optimize metabolic health during GLP-1 therapy."
  }
]

products.each { |attrs| Product.create!(attrs) }

puts "Seeded #{Product.count} products"
```

Run the seed:
```bash
rails db:seed
```

---

## Frontend Setup (React)

### Step 1: Create React Application

From project root (not backend folder):

```bash
cd ..  # Back to ruby-on-rails directory
npx create-react-app frontend
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install @apollo/client graphql react-router-dom
```

### Step 3: Configure Environment

Create `frontend/.env`:

```
REACT_APP_GRAPHQL_URL=http://localhost:3000/graphql
```

### Step 4: Create Project Structure

```bash
mkdir -p src/pages src/components src/graphql
```

---

## Running the Application

### Daily Development Workflow

**Terminal 1: Infrastructure (Docker)**
```bash
# Start infrastructure services
cd ~/Repos/ruby-on-rails
docker-compose up -d

# Check status
docker-compose ps

# View logs if needed
docker-compose logs -f
```

**Terminal 2: Rails Backend**
```bash
cd ~/Repos/ruby-on-rails/backend
rails server
```

**Terminal 3: Sidekiq (Background Jobs)**
```bash
cd ~/Repos/ruby-on-rails/backend
bundle exec sidekiq
```

**Terminal 4: React Frontend (3001 since 3000 in use)**
```bash
cd ~/Repos/ruby-on-rails/frontend
PORT=3001 npm start
```

### Access Applications

Open in your browser:
- **Backend API:** http://localhost:3000
- **GraphiQL IDE:** http://localhost:3000/graphiql
- **Sidekiq Dashboard:** http://localhost:3000/sidekiq
- **Frontend:** http://localhost:3001
- **MinIO Console:** http://localhost:9001 (login: minioadmin/minioadmin)

---

## VS Code Multi-Terminal Setup

For convenience, set up VS Code with multiple terminals:

1. Open VS Code in project root
2. Open terminal (`` Ctrl+` ``)
3. Click the split terminal button 3 times to create 4 terminals
4. In each terminal:
   - **Terminal 1:** `docker-compose up` (or run in background with `-d`)
   - **Terminal 2:** `cd backend && rails server`
   - **Terminal 3:** `cd backend && bundle exec sidekiq`
   - **Terminal 4:** `cd frontend && npm start`

---

## Common Development Tasks

### Database Operations

```bash
# Create new migration
cd backend
rails generate migration AddColumnToProducts column_name:string

# Run migrations
rails db:migrate

# Rollback last migration
rails db:rollback

# Reset database completely
rails db:drop db:create db:migrate db:seed

# Open Rails console
rails console

# Open PostgreSQL console
docker exec -it glp1-postgres psql -U postgres -d glp1_ecommerce_development
```

### Generate Code

```bash
# Generate model
rails generate model User email:string name:string

# Generate controller
rails generate controller Api::Products index show create update destroy

# Generate GraphQL type
rails generate graphql:object User

# Generate GraphQL mutation
rails generate graphql:mutation CreateUser
```

### Frontend Development

```bash
cd frontend

# Install new package
npm install axios

# Remove package
npm uninstall axios

# Update packages
npm update

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Troubleshooting

### Ruby Native Extension Issues

**Error:** "MSYS2 could not be found"

**Solution:**
```bash
ridk install
# Choose option 3: MSYS2 and MINGW development toolchain
```

Then retry:
```bash
cd backend
bundle install
```

### Database Connection Issues

**Error:** "could not connect to server"

**Solution:**
```bash
# Check if PostgreSQL container is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Verify connection
docker exec -it glp1-postgres psql -U postgres -c "SELECT version();"
```

### Port Already in Use

**Error:** "Address already in use - bind(2)"

**Solution:**
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F

# Or change Rails port
rails server -p 3001
```

### Redis Connection Issues

**Error:** "Error connecting to Redis"

**Solution:**
```bash
# Check Redis container
docker-compose ps redis

# Test Redis connection
docker exec -it glp1-redis redis-cli ping
# Should return: PONG

# Restart Redis
docker-compose restart redis
```

### Sidekiq Won't Start

**Error:** "Could not connect to Redis"

**Solution:**
```bash
# Ensure Redis is running
docker-compose ps redis

# Check Redis URL in config
# backend/config/initializers/sidekiq.rb should have:
# redis://localhost:6379/0
```

### Frontend Build Issues

**Error:** npm install failures

**Solution:**
```bash
cd frontend

# Clear cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Hot Reload Not Working

**Frontend hot reload not working:**

Edit `frontend/.env`:
```
CHOKIDAR_USEPOLLING=true
REACT_APP_GRAPHQL_URL=http://localhost:3000/graphql
```

**Rails hot reload not working:**

Add to `backend/Gemfile` in development group:
```ruby
gem 'listen'
```

Then:
```bash
bundle install
```

---

## Performance Tips

### Speed Up Rails

1. **Use Spring preloader:**
```bash
cd backend
bundle exec spring binstub --all
```

2. **Use Bootsnap (should already be included):**
Check `Gemfile` has:
```ruby
gem 'bootsnap', require: false
```

### Speed Up Frontend

1. **Use faster package manager:**
```bash
# Install pnpm globally
npm install -g pnpm

# Use pnpm instead of npm
cd frontend
pnpm install
pnpm start
```

2. **Disable source maps in development:**

Edit `frontend/.env`:
```
GENERATE_SOURCEMAP=false
```

---

## Stopping Services

### Stop Everything

```bash
# Stop Rails (Ctrl+C in Rails terminal)

# Stop Sidekiq (Ctrl+C in Sidekiq terminal)

# Stop React (Ctrl+C in React terminal)

# Stop Docker infrastructure
docker-compose down

# Stop Docker and remove volumes (clean slate)
docker-compose down -v
```

---

## Project Structure

```
ruby-on-rails/
├── backend/                 # Rails API
│   ├── app/
│   │   ├── graphql/        # GraphQL types, mutations, queries
│   │   ├── models/         # ActiveRecord models
│   │   ├── controllers/    # API controllers
│   │   └── jobs/           # Sidekiq background jobs
│   ├── config/
│   │   ├── database.yml    # Database configuration
│   │   ├── routes.rb       # API routes
│   │   └── initializers/   # Rails initializers
│   ├── db/
│   │   ├── migrate/        # Database migrations
│   │   └── seeds.rb        # Seed data
│   ├── Gemfile             # Ruby dependencies
│   └── Gemfile.lock
├── frontend/                # React application
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── graphql/        # GraphQL queries/mutations
│   │   └── App.js          # Main app component
│   ├── package.json        # Node dependencies
│   └── .env                # Environment variables
├── docker-compose.yml       # Infrastructure services
└── README.md
```

---

## Quick Reference

### Most Used Commands

```bash
# Start infrastructure
docker-compose up -d

# Start Rails
cd backend && rails server

# Start Sidekiq
cd backend && bundle exec sidekiq

# Start React
cd frontend && npm start

# Rails console
cd backend && rails console

# Database operations
cd backend && rails db:migrate
cd backend && rails db:seed
cd backend && rails db:rollback

# Run tests
cd backend && rails test
cd frontend && npm test

# Stop infrastructure
docker-compose down
```

### Service URLs

| Service | URL |
|---------|-----|
| Rails API | http://localhost:3000 |
| GraphiQL | http://localhost:3000/graphiql |
| Sidekiq | http://localhost:3000/sidekiq |
| React App | http://localhost:3001 |
| MinIO | http://localhost:9001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Next Steps

Once your environment is running:

1. ✅ Verify all services: Rails, React, Sidekiq, Docker containers
2. ✅ Test GraphiQL: http://localhost:3000/graphiql
3. ✅ Access frontend: http://localhost:3001
4. 📖 Review [ARCHITECTURE.md](./ARCHITECTURE.md)
5. 📖 Review [API.md](./API.md) for GraphQL schema
6. 🚀 Start building features!

For production deployment with Kubernetes, see [DEPLOYMENT.md](./DEPLOYMENT.md)