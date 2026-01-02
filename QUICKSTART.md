# Quick Start Guide - GLP-1 E-Commerce Platform

**Get the MVP running in under 10 minutes**

---

## What You're Building

A fully functional e-commerce platform for GLP-1 medication users featuring:
- Product catalog with educational content
- Shopping cart and checkout
- Asynchronous order processing
- Background job management
- Microservices architecture ready for production

---

## Prerequisites Checklist

```bash
# Required software
✓ Docker Desktop installed
✓ Git installed
✓ 8GB RAM available
✓ 10GB disk space

# Optional (for development)
✓ Ruby 3.2+
✓ Node.js 18+
✓ PostgreSQL 15
```

---

## 5-Minute Setup

### Step 1: Clone and Setup

```bash
# Create project directory
mkdir glp1-ecommerce-mvp
cd glp1-ecommerce-mvp

# You'll create these subdirectories as you build
mkdir -p backend frontend k8s scripts
```

### Step 2: Start with Docker Compose

```bash
# Create docker-compose.yml (see DOCKER_KUBERNETES.md)
# Then start all services
docker-compose up -d

# Wait for services to start (~30 seconds)
docker-compose ps
```

### Step 3: Initialize Database

```bash
# Run migrations and seed data
docker-compose exec backend rails db:create
docker-compose exec backend rails db:migrate
docker-compose exec backend rails db:seed

# Verify seed data
docker-compose exec backend rails console
# In console: Product.count  # Should return 6
```

### Step 4: Access the Application

Open your browser:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3001 | Shop products |
| **GraphQL API** | http://localhost:3000/graphql | API endpoint |
| **GraphiQL** | http://localhost:3000/graphiql | API explorer |
| **Sidekiq** | http://localhost:3000/sidekiq | Job monitoring |
| **MinIO** | http://localhost:9001 | Storage console |

---

## Test the Application

### 1. Browse Products
- Visit http://localhost:3001
- Filter by category and GLP-1 stage
- View educational content

### 2. Add to Cart
- Click "Add to Cart" on any product
- View cart at http://localhost:3001/cart
- Update quantities

### 3. Complete Order
- Click "Proceed to Checkout"
- Enter email: `test@example.com`
- Use test card: `4242 4242 4242 4242`
- Submit order

### 4. View Order History
- Click "Orders" in navigation
- Enter the email you used
- See order details and status

### 5. Monitor Background Jobs
- Visit http://localhost:3000/sidekiq
- Watch order processing jobs
- Check logs: `docker-compose logs -f sidekiq`

---

## Common Commands

### Development

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f sidekiq

# Restart a service
docker-compose restart backend

# Open Rails console
docker-compose exec backend rails console

# Run database migrations
docker-compose exec backend rails db:migrate

# Reset database
docker-compose exec backend rails db:drop db:create db:migrate db:seed
```

### Testing

```bash
# Backend tests
docker-compose exec backend rspec

# Frontend tests
docker-compose exec frontend npm test

# GraphQL query test
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products { id name price } }"}'
```

### Cleanup

```bash
# Stop services
docker-compose stop

# Remove containers
docker-compose down

# Remove containers and volumes (fresh start)
docker-compose down -v

# Remove all Docker resources
docker system prune -a --volumes
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Error

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check if database exists
docker-compose exec postgres psql -U postgres -l
```

### Frontend Not Loading

```bash
# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend

# Check logs
docker-compose logs frontend
```

### Sidekiq Jobs Not Processing

```bash
# Check Redis connection
docker-compose exec redis redis-cli ping

# Restart Sidekiq
docker-compose restart sidekiq

# View Sidekiq logs
docker-compose logs -f sidekiq
```

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────┐
│  React Frontend (Port 3001)                 │
│  - Product browsing                         │
│  - Shopping cart                            │
│  - Checkout flow                            │
└──────────────┬──────────────────────────────┘
               │ GraphQL
               ▼
┌─────────────────────────────────────────────┐
│  Rails API Backend (Port 3000)              │
│  - GraphQL endpoint                         │
│  - Business logic                           │
│  - Order management                         │
└─┬──────────┬──────────────┬─────────────────┘
  │          │              │
  ▼          ▼              ▼
┌────┐   ┌──────┐   ┌──────────────┐
│ PG │   │Redis │   │   Sidekiq    │
│ DB │   │Queue │   │   Workers    │
└────┘   └──────┘   └──────────────┘
```

---

## Key Features Implemented

### ✅ E-Commerce Core
- Product catalog with categories
- Shopping cart with session management
- Checkout with payment simulation
- Order history and tracking

### ✅ GLP-1 Specific
- Products tagged by GLP-1 journey stage
- Educational content on products
- Stage-based filtering and recommendations

### ✅ Technical Excellence
- GraphQL API with type safety
- Asynchronous order processing
- Background job queue (Sidekiq)
- Containerized microservices
- Scalable architecture

### ✅ Developer Experience
- Hot reload for frontend and backend
- GraphiQL API explorer
- Job monitoring dashboard
- Comprehensive logging

---

## Next Steps

### Immediate (Hours)
1. ✅ Run the application
2. ✅ Test core workflows
3. ✅ Explore GraphiQL API
4. ✅ Review background jobs

### Short-term (Days)
1. 📖 Read ARCHITECTURE.md
2. 🔧 Customize seed data
3. 🎨 Adjust frontend styling
4. 📝 Add more products

### Medium-term (Weeks)
1. 🔐 Implement user authentication
2. 💳 Integrate real Stripe payments
3. 📧 Add email service (SendGrid)
4. 📊 Build admin dashboard

### Long-term (Months)
1. 🏥 Integrate FHIR for clinical data
2. 🤖 ML-based recommendations
3. 📱 Build mobile app
4. 🚀 Deploy to production AWS

---

## Documentation Index

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **README.md** | Project overview | First |
| **QUICKSTART.md** | This guide | First |
| **SETUP.md** | Detailed installation | Building from scratch |
| **ARCHITECTURE.md** | System design | Understanding architecture |
| **API.md** | GraphQL API reference | API integration |
| **DEPLOYMENT.md** | Production deployment | Going to production |
| **TESTING.md** | Testing guide | Writing tests |
| **BACKEND_CODE.md** | Backend implementation | Backend development |
| **FRONTEND_CODE.md** | Frontend implementation | Frontend development |
| **DOCKER_KUBERNETES.md** | Container configs | DevOps tasks |

---

## Sample Data Overview

After seeding, you'll have:

**6 Products:**
1. Premium Whey Protein Isolate - $49.99 (Supplements, Active)
2. Meal Prep Container Set - $29.99 (Meal Prep, Starting)
3. Resistance Band Set - $34.99 (Fitness, Active)
4. Hydration Tracker Bottle - $24.99 (Wellness, Starting)
5. Digital Food Scale - $19.99 (Meal Prep, Starting)
6. Omega-3 Fish Oil - $39.99 (Supplements, Maintenance)

**Categories:**
- Supplements (protein, omega-3)
- Meal Prep (containers, scale)
- Fitness (resistance bands)
- Wellness (hydration tracker)

**GLP-1 Stages:**
- Starting (new to medication)
- Active (actively managing)
- Maintenance (long-term management)

---

## Success Metrics

You'll know it's working when:

✅ Frontend loads without errors  
✅ Products display with images  
✅ Cart adds/removes items  
✅ Checkout creates orders  
✅ Background jobs process orders  
✅ Order history shows completed orders  
✅ Sidekiq dashboard shows job stats  

---

## Getting Help

### Check Logs First

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f sidekiq
```

### Common Issues

**"Port already in use"**
- Another service is running on that port
- Kill the process or change the port in docker-compose.yml

**"Database does not exist"**
- Run `docker-compose exec backend rails db:create`

**"Connection refused"**
- Wait for services to start fully (~30 seconds)
- Check with `docker-compose ps`

**"No products displaying"**
- Seed the database: `docker-compose exec backend rails db:seed`

---

## Project Structure Quick Reference

```
glp1-ecommerce-mvp/
├── backend/              # Rails API
│   ├── app/
│   │   ├── graphql/     # GraphQL schema
│   │   ├── models/      # ActiveRecord models
│   │   └── jobs/        # Background jobs
│   ├── db/
│   │   └── seeds.rb     # Sample data
│   └── Dockerfile
│
├── frontend/             # React app
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── graphql/     # GraphQL queries
│   │   └── App.js       # Main app
│   └── Dockerfile
│
├── k8s/                  # Kubernetes configs
│   └── *.yaml
│
├── docker-compose.yml    # Local development
└── README.md
```

---

## Pro Tips

1. **Use GraphiQL** - Best way to explore the API interactively
2. **Watch Sidekiq** - Monitor background jobs in real-time
3. **Check Redis** - Job queue lives here
4. **Session Storage** - Cart uses localStorage (check browser DevTools)
5. **Hot Reload** - Code changes auto-reload (may need manual refresh)

---

## What Makes This Special

### For the Company
✅ Validates technical feasibility  
✅ Demonstrates healthcare domain knowledge  
✅ Shows scalable architecture patterns  
✅ Proves async processing works  
✅ Ready for clinical data integration  

### For the Developer
✅ Full-stack proficiency showcase  
✅ Modern tech stack mastery  
✅ Production-ready code quality  
✅ DevOps capability demonstration  
✅ Healthcare context understanding  

---

## One-Line Demo

```bash
docker-compose up -d && sleep 30 && docker-compose exec backend rails db:setup && open http://localhost:3001
```

This command:
1. Starts all services
2. Waits for startup
3. Creates and seeds database
4. Opens the application

---

**🎉 You're ready to build! Follow the steps above and you'll have a working e-commerce platform in minutes.**

For detailed documentation, see the other markdown files in this repository.
