# Testing Guide - GLP-1 E-Commerce Platform

This guide covers testing strategies, test examples, and how to run tests for the application.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [Integration Testing](#integration-testing)
5. [Performance Testing](#performance-testing)
6. [Manual Testing Checklist](#manual-testing-checklist)

---

## Testing Philosophy

### Testing Pyramid

```
       /\
      /  \  E2E Tests (Few)
     /----\
    /      \  Integration Tests (Some)
   /--------\
  /          \ Unit Tests (Many)
 /____________\
```

**Unit Tests (70%):** Test individual functions and components in isolation
**Integration Tests (20%):** Test interactions between components
**E2E Tests (10%):** Test complete user workflows

---

## Backend Testing

### Setup RSpec

Add to `backend/Gemfile`:

```ruby
group :development, :test do
  gem 'rspec-rails', '~> 6.0'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'shoulda-matchers'
  gem 'database_cleaner-active_record'
end
```

Install and configure:

```bash
cd backend
bundle install
rails generate rspec:install
```

### RSpec Configuration

**spec/rails_helper.rb:**

```ruby
require 'spec_helper'
ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
abort("The Rails environment is running in production mode!") if Rails.env.production?
require 'rspec/rails'

begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

RSpec.configure do |config|
  config.fixture_path = "#{::Rails.root}/spec/fixtures"
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!

  # FactoryBot
  config.include FactoryBot::Syntax::Methods

  # Database Cleaner
  config.before(:suite) do
    DatabaseCleaner.strategy = :transaction
    DatabaseCleaner.clean_with(:truncation)
  end

  config.around(:each) do |example|
    DatabaseCleaner.cleaning do
      example.run
    end
  end
end

Shoulda::Matchers.configure do |config|
  config.integrate do |with|
    with.test_framework :rspec
    with.library :rails
  end
end
```

### Model Tests

**spec/models/product_spec.rb:**

```ruby
require 'rails_helper'

RSpec.describe Product, type: :model do
  describe 'validations' do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:price) }
    it { should validate_presence_of(:inventory_count) }
    it { should validate_numericality_of(:price).is_greater_than(0) }
    it { should validate_numericality_of(:inventory_count).is_greater_than_or_equal_to(0) }
    
    it { should validate_inclusion_of(:category).in_array(%w[Supplements Meal\ Prep Fitness Wellness]) }
    it { should validate_inclusion_of(:glp1_stage).in_array(%w[starting active maintenance]).allow_nil }
  end

  describe 'associations' do
    it { should have_many(:order_items) }
    it { should have_many(:cart_items).dependent(:destroy) }
    it { should have_many(:orders).through(:order_items) }
  end

  describe 'scopes' do
    let!(:in_stock_product) { create(:product, inventory_count: 10) }
    let!(:out_of_stock_product) { create(:product, inventory_count: 0) }

    it 'returns products in stock' do
      expect(Product.in_stock).to include(in_stock_product)
      expect(Product.in_stock).not_to include(out_of_stock_product)
    end
  end

  describe '#in_stock?' do
    it 'returns true when inventory is greater than 0' do
      product = create(:product, inventory_count: 5)
      expect(product.in_stock?).to be true
    end

    it 'returns false when inventory is 0' do
      product = create(:product, inventory_count: 0)
      expect(product.in_stock?).to be false
    end
  end

  describe '#low_stock?' do
    it 'returns true when inventory is between 1 and 10' do
      product = create(:product, inventory_count: 5)
      expect(product.low_stock?).to be true
    end

    it 'returns false when inventory is above 10' do
      product = create(:product, inventory_count: 15)
      expect(product.low_stock?).to be false
    end

    it 'returns false when inventory is 0' do
      product = create(:product, inventory_count: 0)
      expect(product.low_stock?).to be false
    end
  end
end
```

**spec/models/order_spec.rb:**

```ruby
require 'rails_helper'

RSpec.describe Order, type: :model do
  describe 'validations' do
    it { should validate_presence_of(:user_email) }
    it { should validate_presence_of(:status) }
    it { should validate_presence_of(:payment_status) }
    it { should validate_presence_of(:total_amount) }
    it { should validate_numericality_of(:total_amount).is_greater_than(0) }
    
    it { should allow_value('user@example.com').for(:user_email) }
    it { should_not allow_value('invalid_email').for(:user_email) }
  end

  describe 'associations' do
    it { should have_many(:order_items).dependent(:destroy) }
    it { should have_many(:products).through(:order_items) }
  end

  describe '#item_count' do
    let(:order) { create(:order) }
    
    it 'returns total quantity of items' do
      create(:order_item, order: order, quantity: 2)
      create(:order_item, order: order, quantity: 3)
      
      expect(order.item_count).to eq(5)
    end
  end
end
```

### GraphQL Tests

**spec/graphql/queries/products_query_spec.rb:**

```ruby
require 'rails_helper'

RSpec.describe Types::QueryType, type: :request do
  describe 'products query' do
    let!(:supplement) { create(:product, category: 'Supplements', glp1_stage: 'active') }
    let!(:fitness) { create(:product, category: 'Fitness', glp1_stage: 'starting') }

    it 'returns all products' do
      post '/graphql', params: { query: query }
      
      json = JSON.parse(response.body)
      data = json['data']['products']
      
      expect(data.length).to eq(2)
    end

    it 'filters by category' do
      post '/graphql', params: { query: query(category: 'Supplements') }
      
      json = JSON.parse(response.body)
      data = json['data']['products']
      
      expect(data.length).to eq(1)
      expect(data.first['category']).to eq('Supplements')
    end

    it 'filters by GLP-1 stage' do
      post '/graphql', params: { query: query(glp1Stage: 'starting') }
      
      json = JSON.parse(response.body)
      data = json['data']['products']
      
      expect(data.length).to eq(1)
      expect(data.first['glp1Stage']).to eq('starting')
    end

    def query(category: nil, glp1_stage: nil)
      args = []
      args << "category: \"#{category}\"" if category
      args << "glp1Stage: \"#{glp1_stage}\"" if glp1_stage
      args_string = args.any? ? "(#{args.join(', ')})" : ''

      <<~GQL
        query {
          products#{args_string} {
            id
            name
            category
            glp1Stage
            price
          }
        }
      GQL
    end
  end
end
```

**spec/graphql/mutations/add_to_cart_spec.rb:**

```ruby
require 'rails_helper'

RSpec.describe Mutations::AddToCart, type: :request do
  let(:product) { create(:product, inventory_count: 10) }
  let(:session_id) { 'test_session_123' }

  it 'adds product to cart' do
    post '/graphql', params: { query: mutation }
    
    json = JSON.parse(response.body)
    data = json['data']['addToCart']
    
    expect(data['errors']).to be_empty
    expect(data['cart']['cartItems'].length).to eq(1)
    expect(data['cart']['cartItems'].first['quantity']).to eq(1)
  end

  it 'returns error for invalid product' do
    post '/graphql', params: { query: mutation(product_id: 99999) }
    
    json = JSON.parse(response.body)
    data = json['data']['addToCart']
    
    expect(data['errors']).to include('Product not found')
    expect(data['cart']).to be_nil
  end

  it 'returns error when quantity exceeds inventory' do
    post '/graphql', params: { query: mutation(quantity: 20) }
    
    json = JSON.parse(response.body)
    data = json['data']['addToCart']
    
    expect(data['errors'].first).to match(/Insufficient inventory/)
  end

  def mutation(product_id: nil, quantity: 1)
    product_id ||= product.id

    <<~GQL
      mutation {
        addToCart(input: {
          sessionId: "#{session_id}",
          productId: "#{product_id}",
          quantity: #{quantity}
        }) {
          cart {
            id
            total
            cartItems {
              id
              quantity
            }
          }
          errors
        }
      }
    GQL
  end
end
```

### Job Tests

**spec/jobs/order_processing_job_spec.rb:**

```ruby
require 'rails_helper'

RSpec.describe OrderProcessingJob, type: :job do
  let(:order) { create(:order, status: 'pending', payment_status: 'pending') }
  let(:payment_method_id) { 'pm_test_123' }

  it 'updates order status on successful payment' do
    allow_any_instance_of(OrderProcessingJob).to receive(:process_payment)
      .and_return({ success: true, transaction_id: 'txn_123' })

    expect {
      described_class.new.perform(order.id, payment_method_id)
    }.to change { order.reload.status }.from('pending').to('confirmed')
      .and change { order.payment_status }.from('pending').to('paid')
  end

  it 'updates order status on failed payment' do
    allow_any_instance_of(OrderProcessingJob).to receive(:process_payment)
      .and_return({ success: false, error: 'Payment declined' })

    expect {
      described_class.new.perform(order.id, payment_method_id)
    }.to change { order.reload.status }.from('pending').to('failed')
      .and change { order.payment_status }.from('pending').to('failed')
  end

  it 'enqueues follow-up jobs on successful payment' do
    allow_any_instance_of(OrderProcessingJob).to receive(:process_payment)
      .and_return({ success: true, transaction_id: 'txn_123' })

    expect(InventoryUpdateJob).to receive(:perform_async).with(order.id)
    expect(OrderConfirmationEmailJob).to receive(:perform_async).with(order.id)

    described_class.new.perform(order.id, payment_method_id)
  end
end
```

### Factories

**spec/factories/products.rb:**

```ruby
FactoryBot.define do
  factory :product do
    name { Faker::Commerce.product_name }
    description { Faker::Lorem.paragraph }
    price { Faker::Commerce.price(range: 10.0..100.0) }
    category { %w[Supplements Meal\ Prep Fitness Wellness].sample }
    inventory_count { rand(0..100) }
    glp1_stage { %w[starting active maintenance].sample }
    educational_content { Faker::Lorem.sentence }
  end
end
```

**spec/factories/orders.rb:**

```ruby
FactoryBot.define do
  factory :order do
    user_email { Faker::Internet.email }
    status { 'pending' }
    payment_status { 'pending' }
    total_amount { Faker::Commerce.price(range: 50.0..500.0) }

    trait :confirmed do
      status { 'confirmed' }
      payment_status { 'paid' }
    end

    trait :with_items do
      after(:create) do |order|
        create_list(:order_item, 3, order: order)
      end
    end
  end
end
```

### Running Backend Tests

```bash
cd backend

# Run all tests
bundle exec rspec

# Run specific test file
bundle exec rspec spec/models/product_spec.rb

# Run tests matching pattern
bundle exec rspec spec/graphql/

# Run with coverage (add simplecov gem)
bundle exec rspec --format documentation

# Run in parallel (add parallel_tests gem)
bundle exec parallel_rspec spec/
```

---

## Frontend Testing

### Setup Jest and React Testing Library

Already configured with Create React App. Add additional libraries:

```bash
cd frontend
npm install --save-dev @testing-library/jest-dom @testing-library/user-event
```

### Component Tests

**src/pages/ProductList.test.js:**

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import ProductList from './ProductList';
import { GET_PRODUCTS } from '../graphql/queries';

const mocks = [
  {
    request: {
      query: GET_PRODUCTS,
      variables: { category: null, glp1Stage: null },
    },
    result: {
      data: {
        products: [
          {
            id: '1',
            name: 'Test Product',
            description: 'Test description',
            price: 49.99,
            category: 'Supplements',
            inventoryCount: 100,
            glp1Stage: 'active',
            educationalContent: 'Test content',
            imageUrl: 'http://example.com/image.jpg',
            createdAt: '2025-01-01T00:00:00Z',
          },
        ],
      },
    },
  },
];

describe('ProductList', () => {
  it('renders loading state initially', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ProductList />
      </MockedProvider>
    );

    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  it('renders products after loading', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ProductList />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText(/test description/i)).toBeInTheDocument();
  });

  it('displays educational content', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ProductList />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/test content/i)).toBeInTheDocument();
    });
  });
});
```

**src/pages/Cart.test.js:**

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import Cart from './Cart';
import { GET_CART } from '../graphql/queries';
import { UPDATE_CART_ITEM } from '../graphql/mutations';

const cartMock = {
  request: {
    query: GET_CART,
    variables: { sessionId: 'test_session' },
  },
  result: {
    data: {
      cart: {
        id: '1',
        sessionId: 'test_session',
        total: 99.98,
        cartItems: [
          {
            id: '1',
            quantity: 2,
            subtotal: 99.98,
            product: {
              id: '1',
              name: 'Test Product',
              price: 49.99,
              imageUrl: 'http://example.com/image.jpg',
              inventoryCount: 100,
            },
          },
        ],
      },
    },
  },
};

describe('Cart', () => {
  beforeEach(() => {
    localStorage.setItem('sessionId', 'test_session');
  });

  it('renders cart items', async () => {
    render(
      <BrowserRouter>
        <MockedProvider mocks={[cartMock]} addTypename={false}>
          <Cart />
        </MockedProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    expect(screen.getByText('$49.99 each')).toBeInTheDocument();
    expect(screen.getByText('$99.98')).toBeInTheDocument();
  });

  it('displays empty cart message when cart is empty', async () => {
    const emptyCartMock = {
      ...cartMock,
      result: {
        data: {
          cart: {
            ...cartMock.result.data.cart,
            cartItems: [],
          },
        },
      },
    };

    render(
      <BrowserRouter>
        <MockedProvider mocks={[emptyCartMock]} addTypename={false}>
          <Cart />
        </MockedProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });
  });
});
```

### Running Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in CI mode
npm test -- --coverage --watchAll=false

# Run specific test file
npm test -- ProductList.test.js

# Update snapshots
npm test -- -u
```

---

## Integration Testing

### API Integration Tests

Test complete flows through the GraphQL API:

**spec/integration/order_flow_spec.rb:**

```ruby
require 'rails_helper'

RSpec.describe 'Order Flow', type: :request do
  let!(:product) { create(:product, price: 49.99, inventory_count: 10) }
  let(:session_id) { 'integration_test_session' }
  let(:user_email) { 'test@example.com' }

  it 'completes full order flow' do
    # Add to cart
    post '/graphql', params: { query: add_to_cart_mutation }
    expect(response).to have_http_status(:success)
    
    cart_data = JSON.parse(response.body).dig('data', 'addToCart', 'cart')
    expect(cart_data['cartItems'].length).to eq(1)

    # Create order
    post '/graphql', params: { query: create_order_mutation }
    expect(response).to have_http_status(:success)
    
    order_data = JSON.parse(response.body).dig('data', 'createOrder', 'order')
    expect(order_data['status']).to eq('pending')
    expect(order_data['userEmail']).to eq(user_email)

    # Verify cart is cleared
    post '/graphql', params: { query: get_cart_query }
    cart_data = JSON.parse(response.body).dig('data', 'cart')
    expect(cart_data['cartItems']).to be_empty
  end

  def add_to_cart_mutation
    <<~GQL
      mutation {
        addToCart(input: {
          sessionId: "#{session_id}",
          productId: "#{product.id}",
          quantity: 1
        }) {
          cart {
            id
            cartItems {
              id
              quantity
            }
          }
          errors
        }
      }
    GQL
  end

  def create_order_mutation
    <<~GQL
      mutation {
        createOrder(input: {
          sessionId: "#{session_id}",
          userEmail: "#{user_email}",
          paymentMethodId: "pm_test_123"
        }) {
          order {
            id
            status
            userEmail
            totalAmount
          }
          errors
        }
      }
    GQL
  end

  def get_cart_query
    <<~GQL
      query {
        cart(sessionId: "#{session_id}") {
          id
          cartItems {
            id
          }
        }
      }
    GQL
  end
end
```

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test product listing endpoint
ab -n 1000 -c 10 -p graphql_query.json -T 'application/json' http://localhost:3000/graphql

# graphql_query.json
{
  "query": "{ products { id name price } }"
}
```

### Database Query Performance

Add to `spec/support/query_counter.rb`:

```ruby
RSpec::Matchers.define :exceed_query_limit do |expected|
  match do |block|
    query_count = 0
    counter = lambda { |*, **| query_count += 1 }
    
    ActiveSupport::Notifications.subscribed(counter, 'sql.active_record') do
      block.call
    end
    
    @query_count = query_count
    @query_count > expected
  end
  
  failure_message do
    "Expected to run maximum #{expected} queries, but ran #{@query_count}"
  end
end

# Usage in tests
it 'does not have N+1 queries' do
  expect {
    Order.includes(:order_items).first(10).each do |order|
      order.order_items.each(&:product)
    end
  }.not_to exceed_query_limit(3)
end
```

---

## Manual Testing Checklist

### Smoke Tests

- [ ] Application starts without errors
- [ ] Database connection established
- [ ] Redis connection established
- [ ] GraphQL endpoint responds

### Product Browsing

- [ ] Products load on homepage
- [ ] Category filter works
- [ ] GLP-1 stage filter works
- [ ] Product images display
- [ ] Educational content displays
- [ ] Low stock badges show correctly

### Shopping Cart

- [ ] Add to cart updates cart count
- [ ] Cart displays correct items
- [ ] Quantity can be increased/decreased
- [ ] Items can be removed
- [ ] Cart total calculates correctly
- [ ] Cart persists across page refreshes

### Checkout

- [ ] Checkout form validates email
- [ ] Test card number works (4242 4242 4242 4242)
- [ ] Order creation succeeds
- [ ] Cart clears after order
- [ ] Confirmation message displays

### Order Management

- [ ] Orders display in history
- [ ] Order details are correct
- [ ] Order status updates
- [ ] Email confirmation sent (check logs)

### Background Jobs

- [ ] Order processing job runs
- [ ] Inventory updates correctly
- [ ] Email job executes
- [ ] Failed jobs retry

### Performance

- [ ] Page loads in < 3 seconds
- [ ] API responds in < 200ms
- [ ] No N+1 query issues
- [ ] Images load quickly

---

## Continuous Integration

### GitHub Actions Workflow

`.github/workflows/test.yml`:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Ruby
      uses: ruby/setup-ruby@v1
      with:
        ruby-version: 3.2
        bundler-cache: true

    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:password@localhost:5432/test
        REDIS_URL: redis://localhost:6379/0
      run: |
        cd backend
        bundle exec rails db:create db:schema:load
        bundle exec rspec

  frontend:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node
      uses: actions/setup-node@v2
      with:
        node-version: 18
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Install dependencies
      run: |
        cd frontend
        npm ci

    - name: Run tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false
```

---

This testing guide provides comprehensive coverage for ensuring the quality and reliability of the GLP-1 E-Commerce Platform.