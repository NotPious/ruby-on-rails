# Architecture Documentation - GLP-1 E-Commerce Platform

## System Overview

This document outlines the architectural decisions, design patterns, and technical rationale for the GLP-1 Lifestyle Support E-Commerce Platform.

---

## Design Principles

### 1. Microservices Architecture
Each service has a clear boundary and responsibility, enabling independent scaling and development.

### 2. API-First Design
GraphQL API serves as the contract between frontend and backend, providing flexibility for multiple clients.

### 3. Asynchronous Processing
Long-running operations (payment processing, email sending, inventory updates) are handled via background jobs.

### 4. Cloud-Native Design
Services are containerized and orchestrated, ready for cloud deployment with minimal changes.

### 5. Healthcare-Ready Patterns
Architecture supports future HIPAA compliance requirements with proper data isolation and audit trails.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                           │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  React Frontend  │         │  Future Mobile   │              │
│  │   (Port 3001)    │         │      App         │              │
│  └────────┬─────────┘         └────────┬─────────┘              │
│           │                            │                        │
│           └─────────────┬──────────────┘                        │
│                         │ GraphQL over HTTP                     │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                         │     API Gateway Layer                 │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Rails GraphQL Endpoint                     │   │
│  │                  (Port 3000)                             │   │
│  │  - Authentication (Future)                               │   │
│  │  - Rate Limiting (Future)                                │   │
│  │  - Request Logging                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────────┐
│                         │   Application Layer                    │
│           ┌─────────────┴─────────────┐                          │
│           │                           │                          │
│  ┌────────▼────────┐         ┌───────▼─────────┐                 │
│  │  Product Service│         │  Order Service  │                 │
│  │                 │         │                 │                 │
│  │ - Catalog Mgmt  │         │ - Cart Mgmt     │                 │
│  │ - Search/Filter │         │ - Checkout      │                 │
│  │ - Inventory     │         │ - Order History │                 │
│  └────────┬────────┘         └───────┬─────────┘                 │
│           │                          │                           │
│           └──────────┬───────────────┘                           │
│                      │                                           │
│           ┌──────────▼──────────┐                                │
│           │  Payment Service    │                                │
│           │  (Stripe Wrapper)   │                                │
│           └─────────────────────┘                                │
└──────────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────┼────────────────────────────────────────────┐
│                     │   Async Processing Layer                   │
│                     ▼                                            │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                  Sidekiq Workers                        │     │
│  │                                                         │     │
│  │  ┌──────────────────┐  ┌──────────────────┐             │     │
│  │  │ Order Processing │  │ Email Service    │             │     │
│  │  │      Job         │  │      Job         │             │     │
│  │  └──────────────────┘  └──────────────────┘             │     │
│  │                                                         │     │
│  │  ┌──────────────────┐  ┌──────────────────┐             │     │
│  │  │ Inventory Update │  │ Analytics Job    │             │     │
│  │  │      Job         │  │   (Future)       │             │     │
│  │  └──────────────────┘  └──────────────────┘             │     │
│  └─────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────┼────────────────────────────────────────────┐
│                     │      Data Layer                            │
│       ┌─────────────┴─────────────┐                              │
│       │                           │                              │
│  ┌────▼──────┐  ┌────────┐  ┌────▼─────┐  ┌──────────────┐       │
│  │PostgreSQL │  │ Redis  │  │   S3/    │  │  SQS (Future)│       │
│  │    RDS    │  │ Cache  │  │  MinIO   │  │   or Redis   │       │
│  │           │  │        │  │          │  │              │       │
│  │ Products  │  │Sidekiq │  │ Product  │  │   Message    │       │
│  │ Orders    │  │ Jobs   │  │ Images   │  │   Queue      │       │
│  │ Carts     │  │        │  │          │  │              │       │
│  └───────────┘  └────────┘  └──────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Frontend Layer

**Technology:** React 18 with Apollo Client

**Responsibilities:**
- User interface rendering
- GraphQL query/mutation execution
- Client-side state management
- Session management (localStorage)

**Key Design Decisions:**
- **Apollo Client** for GraphQL integration with built-in caching
- **React Router** for client-side routing
- **No authentication layer** in MVP (session-based cart identification)
- **Responsive design** for mobile compatibility (future native apps)

**Communication Pattern:**
```
React Component → Apollo Client → GraphQL Query → Rails API
```

---

### API Gateway Layer

**Technology:** Rails 7.1 API Mode with graphql-ruby

**Responsibilities:**
- GraphQL schema definition and resolution
- Request validation
- CORS handling
- Future: Authentication, rate limiting, API versioning

**Key Design Decisions:**
- **GraphQL over REST** for flexible data fetching (reduces over-fetching/under-fetching)
- **Type-safe schema** for contract between frontend and backend
- **Single endpoint** simplifies client integration

**GraphQL Schema Structure:**
```graphql
type Query {
  products(category: String, glp1Stage: String): [Product!]!
  product(id: ID!): Product
  cart(sessionId: String!): Cart
  orders(userEmail: String!): [Order!]!
  order(id: ID!): Order
}

type Mutation {
  addToCart(input: AddToCartInput!): AddToCartPayload
  updateCartItem(input: UpdateCartItemInput!): UpdateCartItemPayload
  createOrder(input: CreateOrderInput!): CreateOrderPayload
}
```

---

### Application Services

#### Product Service

**Responsibilities:**
- Product catalog management
- Search and filtering
- Inventory tracking
- GLP-1 stage recommendations

**Data Model:**
```ruby
Product
  - id: integer
  - name: string
  - description: text
  - price: decimal(10,2)
  - category: string
  - inventory_count: integer
  - glp1_stage: string (starting, active, maintenance)
  - educational_content: text
  - created_at, updated_at: datetime
```

**Key Features:**
- Category filtering (Supplements, Meal Prep, Fitness, Wellness)
- GLP-1 journey stage targeting
- Educational content for behavior support

#### Order Service

**Responsibilities:**
- Shopping cart management
- Order creation and tracking
- Order history retrieval

**Data Model:**
```ruby
Cart
  - id: integer
  - session_id: string (unique)
  
CartItem
  - id: integer
  - cart_id: foreign_key
  - product_id: foreign_key
  - quantity: integer

Order
  - id: integer
  - user_email: string
  - status: string (pending, confirmed, failed)
  - total_amount: decimal(10,2)
  - payment_status: string
  
OrderItem
  - id: integer
  - order_id: foreign_key
  - product_id: foreign_key
  - quantity: integer
  - price: decimal(10,2) (snapshot at order time)
```

**State Machine:**
```
Cart → Checkout → Order (pending) → Payment Processing → Order (confirmed)
                                   ↓
                              Order (failed)
```

#### Payment Service

**Responsibilities:**
- Payment processing wrapper
- Stripe API integration (test mode)
- Payment status tracking

**Design Pattern:** Adapter pattern for payment provider abstraction

```ruby
class PaymentService
  def process_payment(order, payment_method_id)
    # Stripe integration
    Stripe::PaymentIntent.create(
      amount: (order.total_amount * 100).to_i,
      currency: 'usd',
      payment_method: payment_method_id
    )
  end
end
```

**Future Enhancement:** Support for multiple payment providers

---

### Async Processing Layer

**Technology:** Sidekiq with Redis

**Responsibilities:**
- Background job processing
- Asynchronous order fulfillment
- Email notifications
- Inventory updates

**Job Queue Architecture:**
```
Order Created → OrderProcessingJob (high priority)
                ↓
         Process Payment
                ↓
         ┌──────┴───────┐
         ▼              ▼
  InventoryUpdateJob  OrderConfirmationEmailJob
     (medium)           (low priority)
```

**Job Definitions:**

1. **OrderProcessingJob**
   - Priority: High
   - Responsibility: Process payment, update order status
   - Retry: 3 attempts with exponential backoff
   
2. **InventoryUpdateJob**
   - Priority: Medium
   - Responsibility: Decrement product inventory
   - Retry: 5 attempts (critical for accuracy)
   
3. **OrderConfirmationEmailJob**
   - Priority: Low
   - Responsibility: Send confirmation email
   - Retry: 3 attempts

**Benefits:**
- **Non-blocking:** User gets immediate response while processing happens async
- **Resilience:** Failed jobs are retried automatically
- **Scalability:** Workers can be scaled independently of API servers

---

### Data Layer

#### PostgreSQL Database

**Schema Design Principles:**
- Normalized data model (3NF) for transactional consistency
- Foreign key constraints for referential integrity
- Indexes on frequently queried columns
- JSON columns for flexible metadata (future)

**Indexes:**
```sql
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_glp1_stage ON products(glp1_stage);
CREATE INDEX idx_orders_user_email ON orders(user_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_carts_session_id ON carts(session_id);
```

**Connection Pooling:**
```ruby
# config/database.yml
production:
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  checkout_timeout: 5
```

#### Redis Cache

**Usage:**
- Sidekiq job queue
- Future: Session storage
- Future: Product catalog caching

**Cache Strategy (Future):**
```ruby
# Cache product catalog
Rails.cache.fetch("products:all", expires_in: 1.hour) do
  Product.all.to_a
end
```

#### Object Storage (S3/MinIO)

**Usage:**
- Product images
- Future: User-uploaded content
- Future: Generated reports

**Structure:**
```
s3://glp1-ecommerce/
  products/
    images/
      product_1_main.jpg
      product_1_thumb.jpg
  orders/
    receipts/
      order_123_receipt.pdf
```

---

## Security Architecture

### Current Implementation

1. **CORS Protection**
   - Whitelisted origins only
   - Credentials allowed for authenticated requests (future)

2. **SQL Injection Prevention**
   - ActiveRecord parameterized queries
   - No raw SQL without sanitization

3. **XSS Prevention**
   - React's built-in escaping
   - Content Security Policy (future)

### Production Requirements

1. **Authentication & Authorization**
   ```ruby
   # JWT-based authentication
   class GraphqlController < ApplicationController
     before_action :authenticate_user!
     
     def execute
       context = { current_user: current_user }
       Schema.execute(params[:query], context: context)
     end
   end
   ```

2. **API Rate Limiting**
   ```ruby
   # Using Rack::Attack
   Rack::Attack.throttle('graphql/ip', limit: 100, period: 1.minute) do |req|
     req.ip if req.path == '/graphql'
   end
   ```

3. **Encryption**
   - HTTPS/TLS in production
   - Encrypted database columns for PII (future)
   - Encrypted S3 buckets

4. **HIPAA Compliance (Future)**
   - Audit logs for all data access
   - Data retention policies
   - Business Associate Agreements (BAAs)

---

## Scalability Considerations

### Horizontal Scaling

**Backend API:**
- Stateless design allows horizontal scaling
- Load balancer distributes traffic across pods
- Target: 3-5 replicas under normal load

**Sidekiq Workers:**
- Auto-scaling based on queue depth
- Target: 2-10 workers based on job volume

**Frontend:**
- Static asset CDN (CloudFront)
- Multiple frontend replicas for high availability

### Vertical Scaling

**Database:**
- Start: db.t3.micro (1 vCPU, 1GB RAM)
- Scale to: db.t3.medium (2 vCPU, 4GB RAM) under load

**Redis:**
- Start: cache.t3.micro (0.5GB RAM)
- Scale to: cache.t3.small (1.5GB RAM) for larger job queues

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | < 200ms (p95) | Application Performance Monitoring |
| Database Query Time | < 50ms (p95) | Rails query logs |
| GraphQL Resolver Time | < 100ms (p95) | graphql-ruby tracing |
| Order Processing Time | < 5s | Sidekiq job duration |
| Page Load Time | < 3s | Lighthouse score |

---

## Data Flow Examples

### Example 1: Product Browsing

```
1. User visits homepage
   → React renders ProductList component
   
2. Apollo Client executes GET_PRODUCTS query
   → HTTP POST to /graphql endpoint
   
3. Rails GraphQL resolver
   → Query: Product.where(category: 'Supplements')
   
4. PostgreSQL returns results
   → Rails serializes to GraphQL types
   
5. Apollo Client caches results
   → React re-renders with product data
```

### Example 2: Order Creation

```
1. User clicks "Place Order"
   → React calls CREATE_ORDER mutation
   
2. Rails GraphQL mutation
   → Validates cart, creates Order record
   → Order status: "pending"
   
3. Enqueue background job
   → OrderProcessingJob.perform_async(order_id)
   → Return order to client immediately
   
4. Sidekiq worker processes job
   → Process payment via Stripe
   → Update order status: "confirmed"
   
5. Enqueue follow-up jobs
   → InventoryUpdateJob (decrement stock)
   → OrderConfirmationEmailJob (send email)
   
6. User checks order status
   → Apollo Client polls order query
   → Sees "confirmed" status
```

---

## Technology Choices Rationale

### Why GraphQL?

**Pros:**
- Flexible data fetching (client specifies what it needs)
- Strong typing with schema validation
- Single endpoint simplifies API management
- Introspection for documentation

**Cons:**
- Learning curve for team
- More complex caching than REST
- Potential for expensive queries (N+1 problem)

**Mitigation:**
- Use graphql-ruby's dataloader for batching
- Implement query complexity limits
- Monitor query performance

### Why Rails?

**Pros:**
- Rapid development with conventions
- Mature ecosystem (gems for everything)
- ActiveRecord for database abstraction
- Easy integration with GraphQL, Sidekiq

**Cons:**
- Monolithic tendencies (requires discipline)
- Performance vs. Go/Node for high-concurrency

**Mitigation:**
- Use API-only mode (no view layer)
- Extract services for business logic
- Profile and optimize hot paths

### Why React?

**Pros:**
- Component-based architecture
- Large ecosystem and community
- Apollo Client for GraphQL integration
- Easy to hire React developers

**Cons:**
- Bundle size can be large
- JavaScript fatigue (many dependencies)

**Mitigation:**
- Code splitting with React.lazy
- Tree shaking in production builds
- Regular dependency audits

### Why Sidekiq?

**Pros:**
- Native Ruby integration
- Efficient (uses threads, not processes)
- Rich ecosystem (retry logic, scheduling, monitoring)
- Redis-backed for speed

**Cons:**
- Single point of failure (Redis)
- Memory usage with many jobs

**Mitigation:**
- Redis Sentinel for high availability
- Job size limits and archiving
- Monitoring with Sidekiq Pro

---

## AWS vs. Local Alternatives

| AWS Service | Local Alternative | Migration Path |
|-------------|-------------------|----------------|
| RDS PostgreSQL | PostgreSQL in Docker | Update DATABASE_URL env var |
| S3 | MinIO | Change ActiveStorage adapter |
| SQS | Redis (Sidekiq) | Add aws-sdk-sqs, configure Sidekiq |

**Decision:** Start local for zero-cost POC, migrate to AWS when:
- Traffic exceeds local capacity
- Need managed backups and HA
- Compliance requires cloud infrastructure

---

## Future Architecture Enhancements

### Phase 2: Authentication & User Management

```
Add JWT-based authentication:
- User registration/login
- OAuth integration (Google, Apple)
- Role-based access control (customer, admin)
```

### Phase 3: Clinical Data Integration

```
Add FHIR API integration:
- Lab results import
- Medication adherence tracking
- Biometric data (weight, glucose)
```

### Phase 4: Recommendation Engine

```
Add ML-based recommendations:
- Collaborative filtering
- Product affinity analysis
- Journey-stage prediction
```

### Phase 5: Advanced Features

```
- Real-time order tracking
- Subscription management
- Multi-warehouse inventory
- Advanced analytics dashboard
```

---

## Monitoring & Observability

### Logging

```ruby
# Structured logging with lograge
config.lograge.enabled = true
config.lograge.custom_options = lambda do |event|
  {
    user_id: event.payload[:current_user]&.id,
    graphql_operation: event.payload[:graphql_operation]
  }
end
```

### Metrics

**Key Metrics to Track:**
- Request rate (req/sec)
- Error rate (%)
- Response time (p50, p95, p99)
- Database query time
- Job queue depth
- Cache hit rate

**Tools:**
- Prometheus + Grafana
- Datadog
- New Relic

### Alerting

**Critical Alerts:**
- API error rate > 1%
- Database connection pool exhausted
- Sidekiq queue depth > 1000
- Disk space < 20%

---

## Conclusion

This architecture balances simplicity (for rapid POC development) with scalability (for future growth). Key design decisions prioritize:

1. **Developer velocity:** Conventional Rails, familiar React patterns
2. **User experience:** Fast responses via async processing
3. **Scalability:** Stateless services, horizontal scaling ready
4. **Healthcare readiness:** Audit trails, data isolation, compliance patterns

The system is production-ready with minimal modifications and provides a solid foundation for the full GLP-1 lifestyle support platform.
