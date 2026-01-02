# GraphQL API Documentation - GLP-1 E-Commerce Platform

## Overview

The GLP-1 E-Commerce Platform exposes a GraphQL API for all client interactions. This document provides comprehensive API documentation including schema definitions, query examples, and usage patterns.

**Base URL:** `http://localhost:3000/graphql` (development)  
**GraphiQL IDE:** `http://localhost:3000/graphiql` (development only)

---

## Schema Overview

### Core Types

- **Product** - Product catalog items
- **Cart** - Shopping cart
- **CartItem** - Items in a cart
- **Order** - Placed orders
- **OrderItem** - Items in an order

### Operations

- **Queries** - Read operations
- **Mutations** - Write operations

---

## Type Definitions

### Product Type

```graphql
type Product {
  id: ID!
  name: String!
  description: String
  price: Float!
  category: String!
  inventoryCount: Int!
  glp1Stage: String
  educationalContent: String
  imageUrl: String
  createdAt: ISO8601DateTime!
  updatedAt: ISO8601DateTime!
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID! | Unique product identifier |
| `name` | String! | Product name |
| `description` | String | Detailed product description |
| `price` | Float! | Product price in USD |
| `category` | String! | Product category (Supplements, Meal Prep, Fitness, Wellness) |
| `inventoryCount` | Int! | Available inventory quantity |
| `glp1Stage` | String | Target GLP-1 journey stage (starting, active, maintenance) |
| `educationalContent` | String | Educational information about product benefits |
| `imageUrl` | String | Product image URL |
| `createdAt` | ISO8601DateTime! | Record creation timestamp |
| `updatedAt` | ISO8601DateTime! | Last update timestamp |

### Cart Type

```graphql
type Cart {
  id: ID!
  sessionId: String!
  cartItems: [CartItem!]!
  total: Float!
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID! | Unique cart identifier |
| `sessionId` | String! | Session identifier for cart ownership |
| `cartItems` | [CartItem!]! | List of items in cart |
| `total` | Float! | Calculated total price of all items |

### CartItem Type

```graphql
type CartItem {
  id: ID!
  product: Product!
  quantity: Int!
  subtotal: Float!
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID! | Unique cart item identifier |
| `product` | Product! | Associated product |
| `quantity` | Int! | Quantity of this product |
| `subtotal` | Float! | Calculated subtotal (price × quantity) |

### Order Type

```graphql
type Order {
  id: ID!
  userEmail: String!
  status: String!
  totalAmount: Float!
  paymentStatus: String!
  orderItems: [OrderItem!]!
  createdAt: ISO8601DateTime!
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID! | Unique order identifier |
| `userEmail` | String! | Customer email address |
| `status` | String! | Order status (pending, confirmed, failed, shipped, delivered) |
| `totalAmount` | Float! | Total order amount |
| `paymentStatus` | String! | Payment status (pending, paid, failed) |
| `orderItems` | [OrderItem!]! | List of items in order |
| `createdAt` | ISO8601DateTime! | Order creation timestamp |

### OrderItem Type

```graphql
type OrderItem {
  id: ID!
  product: Product!
  quantity: Int!
  price: Float!
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID! | Unique order item identifier |
| `product` | Product! | Associated product |
| `quantity` | Int! | Quantity ordered |
| `price` | Float! | Price at time of order (historical snapshot) |

---

## Queries

### Get All Products

Retrieve all products with optional filtering.

```graphql
query GetProducts($category: String, $glp1Stage: String) {
  products(category: $category, glp1Stage: $glp1Stage) {
    id
    name
    description
    price
    category
    inventoryCount
    glp1Stage
    educationalContent
    imageUrl
  }
}
```

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `category` | String | No | Filter by category |
| `glp1Stage` | String | No | Filter by GLP-1 journey stage |

**Example Request:**

```graphql
query {
  products(category: "Supplements", glp1Stage: "active") {
    id
    name
    price
    educationalContent
  }
}
```

**Example Response:**

```json
{
  "data": {
    "products": [
      {
        "id": "1",
        "name": "Premium Whey Protein Isolate",
        "price": 49.99,
        "educationalContent": "Protein intake is crucial during GLP-1 therapy..."
      }
    ]
  }
}
```

### Get Single Product

Retrieve details for a specific product.

```graphql
query GetProduct($id: ID!) {
  product(id: $id) {
    id
    name
    description
    price
    category
    inventoryCount
    glp1Stage
    educationalContent
    imageUrl
    createdAt
  }
}
```

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | ID! | Yes | Product identifier |

**Example Request:**

```graphql
query {
  product(id: "1") {
    id
    name
    description
    price
    inventoryCount
  }
}
```

**Example Response:**

```json
{
  "data": {
    "product": {
      "id": "1",
      "name": "Premium Whey Protein Isolate",
      "description": "High-quality protein to support muscle maintenance...",
      "price": 49.99,
      "inventoryCount": 100
    }
  }
}
```

### Get Cart

Retrieve shopping cart for a session.

```graphql
query GetCart($sessionId: String!) {
  cart(sessionId: $sessionId) {
    id
    sessionId
    total
    cartItems {
      id
      quantity
      subtotal
      product {
        id
        name
        price
        imageUrl
      }
    }
  }
}
```

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `sessionId` | String! | Yes | Session identifier |

**Example Request:**

```graphql
query {
  cart(sessionId: "session_abc123") {
    id
    total
    cartItems {
      quantity
      product {
        name
        price
      }
    }
  }
}
```

**Example Response:**

```json
{
  "data": {
    "cart": {
      "id": "1",
      "total": 99.98,
      "cartItems": [
        {
          "quantity": 2,
          "product": {
            "name": "Premium Whey Protein Isolate",
            "price": 49.99
          }
        }
      ]
    }
  }
}
```

### Get Orders

Retrieve order history for a user.

```graphql
query GetOrders($userEmail: String!) {
  orders(userEmail: $userEmail) {
    id
    userEmail
    status
    totalAmount
    paymentStatus
    createdAt
    orderItems {
      id
      quantity
      price
      product {
        name
        imageUrl
      }
    }
  }
}
```

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `userEmail` | String! | Yes | Customer email address |

**Example Request:**

```graphql
query {
  orders(userEmail: "user@example.com") {
    id
    status
    totalAmount
    createdAt
  }
}
```

**Example Response:**

```json
{
  "data": {
    "orders": [
      {
        "id": "1",
        "status": "confirmed",
        "totalAmount": 99.98,
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Get Single Order

Retrieve details for a specific order.

```graphql
query GetOrder($id: ID!) {
  order(id: $id) {
    id
    userEmail
    status
    totalAmount
    paymentStatus
    createdAt
    orderItems {
      id
      quantity
      price
      product {
        id
        name
        imageUrl
      }
    }
  }
}
```

**Arguments:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | ID! | Yes | Order identifier |

---

## Mutations

### Add to Cart

Add a product to the shopping cart.

```graphql
mutation AddToCart($sessionId: String!, $productId: ID!, $quantity: Int!) {
  addToCart(input: {
    sessionId: $sessionId,
    productId: $productId,
    quantity: $quantity
  }) {
    cart {
      id
      total
      cartItems {
        id
        quantity
        product {
          name
        }
      }
    }
    errors
  }
}
```

**Input Fields:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `sessionId` | String! | Yes | Session identifier |
| `productId` | ID! | Yes | Product to add |
| `quantity` | Int! | Yes | Quantity to add (positive integer) |

**Return Type:**

```graphql
type AddToCartPayload {
  cart: Cart
  errors: [String!]!
}
```

**Example Request:**

```graphql
mutation {
  addToCart(input: {
    sessionId: "session_abc123",
    productId: "1",
    quantity: 2
  }) {
    cart {
      total
    }
    errors
  }
}
```

**Success Response:**

```json
{
  "data": {
    "addToCart": {
      "cart": {
        "total": 99.98
      },
      "errors": []
    }
  }
}
```

**Error Response:**

```json
{
  "data": {
    "addToCart": {
      "cart": null,
      "errors": ["Product not found"]
    }
  }
}
```

### Update Cart Item

Update quantity of an item in the cart.

```graphql
mutation UpdateCartItem($cartItemId: ID!, $quantity: Int!) {
  updateCartItem(input: {
    cartItemId: $cartItemId,
    quantity: $quantity
  }) {
    cartItem {
      id
      quantity
      subtotal
    }
    errors
  }
}
```

**Input Fields:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `cartItemId` | ID! | Yes | Cart item identifier |
| `quantity` | Int! | Yes | New quantity (0 to remove) |

**Return Type:**

```graphql
type UpdateCartItemPayload {
  cartItem: CartItem
  errors: [String!]!
}
```

**Example Request (Update):**

```graphql
mutation {
  updateCartItem(input: {
    cartItemId: "1",
    quantity: 3
  }) {
    cartItem {
      quantity
    }
    errors
  }
}
```

**Example Request (Remove):**

```graphql
mutation {
  updateCartItem(input: {
    cartItemId: "1",
    quantity: 0
  }) {
    cartItem {
      id
    }
    errors
  }
}
```

### Create Order

Place an order from the current cart.

```graphql
mutation CreateOrder($sessionId: String!, $userEmail: String!, $paymentMethodId: String!) {
  createOrder(input: {
    sessionId: $sessionId,
    userEmail: $userEmail,
    paymentMethodId: $paymentMethodId
  }) {
    order {
      id
      status
      totalAmount
      orderItems {
        quantity
        product {
          name
        }
      }
    }
    errors
  }
}
```

**Input Fields:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `sessionId` | String! | Yes | Session identifier |
| `userEmail` | String! | Yes | Customer email address |
| `paymentMethodId` | String! | Yes | Payment method identifier (Stripe token) |

**Return Type:**

```graphql
type CreateOrderPayload {
  order: Order
  errors: [String!]!
}
```

**Example Request:**

```graphql
mutation {
  createOrder(input: {
    sessionId: "session_abc123",
    userEmail: "user@example.com",
    paymentMethodId: "pm_test_1234"
  }) {
    order {
      id
      status
      totalAmount
    }
    errors
  }
}
```

**Success Response:**

```json
{
  "data": {
    "createOrder": {
      "order": {
        "id": "1",
        "status": "pending",
        "totalAmount": 99.98
      },
      "errors": []
    }
  }
}
```

**Error Response:**

```json
{
  "data": {
    "createOrder": {
      "order": null,
      "errors": ["Cart not found or empty"]
    }
  }
}
```

---

## Error Handling

### GraphQL Errors

Standard GraphQL errors are returned in the `errors` array:

```json
{
  "errors": [
    {
      "message": "Product not found",
      "locations": [{"line": 2, "column": 3}],
      "path": ["product"]
    }
  ],
  "data": {
    "product": null
  }
}
```

### Application Errors

Application-specific errors are returned in the mutation payload:

```json
{
  "data": {
    "addToCart": {
      "cart": null,
      "errors": [
        "Product not found",
        "Insufficient inventory"
      ]
    }
  }
}
```

### Common Error Codes

| Error | HTTP Status | Description |
|-------|-------------|-------------|
| Product not found | 200 | Invalid product ID |
| Cart not found | 200 | Invalid session ID |
| Insufficient inventory | 200 | Not enough stock |
| Invalid email | 200 | Malformed email address |
| Payment failed | 200 | Payment processing error |

---

## Client Integration

### JavaScript/React with Apollo Client

```javascript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
  cache: new InMemoryCache(),
});

// Query example
const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      price
    }
  }
`;

const { data } = await client.query({ query: GET_PRODUCTS });

// Mutation example
const ADD_TO_CART = gql`
  mutation AddToCart($sessionId: String!, $productId: ID!, $quantity: Int!) {
    addToCart(input: {
      sessionId: $sessionId,
      productId: $productId,
      quantity: $quantity
    }) {
      cart {
        total
      }
      errors
    }
  }
`;

const { data } = await client.mutate({
  mutation: ADD_TO_CART,
  variables: {
    sessionId: 'session_abc123',
    productId: '1',
    quantity: 2
  }
});
```

### cURL Examples

**Query Products:**

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ products { id name price } }"
  }'
```

**Add to Cart:**

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation($sessionId: String!, $productId: ID!, $quantity: Int!) { addToCart(input: { sessionId: $sessionId, productId: $productId, quantity: $quantity }) { cart { total } errors } }",
    "variables": {
      "sessionId": "session_abc123",
      "productId": "1",
      "quantity": 2
    }
  }'
```

---

## Rate Limiting

**Current:** No rate limiting (development)

**Production:** 
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Pagination (Future)

Pagination will be implemented using cursor-based pagination:

```graphql
type ProductConnection {
  edges: [ProductEdge!]!
  pageInfo: PageInfo!
}

type ProductEdge {
  cursor: String!
  node: Product!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

query {
  products(first: 10, after: "cursor123") {
    edges {
      node {
        id
        name
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

---

## Authentication (Future)

Authentication will use JWT tokens:

```graphql
mutation {
  login(email: "user@example.com", password: "password") {
    token
    user {
      id
      email
    }
  }
}
```

Authenticated requests include token in header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Webhooks (Future)

Webhooks for order status updates:

```json
{
  "event": "order.confirmed",
  "order": {
    "id": "1",
    "status": "confirmed",
    "totalAmount": 99.98
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## GraphQL Schema (Full IDL)

```graphql
scalar ISO8601DateTime

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

type Product {
  id: ID!
  name: String!
  description: String
  price: Float!
  category: String!
  inventoryCount: Int!
  glp1Stage: String
  educationalContent: String
  imageUrl: String
  createdAt: ISO8601DateTime!
  updatedAt: ISO8601DateTime!
}

type Cart {
  id: ID!
  sessionId: String!
  cartItems: [CartItem!]!
  total: Float!
}

type CartItem {
  id: ID!
  product: Product!
  quantity: Int!
  subtotal: Float!
}

type Order {
  id: ID!
  userEmail: String!
  status: String!
  totalAmount: Float!
  paymentStatus: String!
  orderItems: [OrderItem!]!
  createdAt: ISO8601DateTime!
}

type OrderItem {
  id: ID!
  product: Product!
  quantity: Int!
  price: Float!
}

input AddToCartInput {
  sessionId: String!
  productId: ID!
  quantity: Int!
}

type AddToCartPayload {
  cart: Cart
  errors: [String!]!
}

input UpdateCartItemInput {
  cartItemId: ID!
  quantity: Int!
}

type UpdateCartItemPayload {
  cartItem: CartItem
  errors: [String!]!
}

input CreateOrderInput {
  sessionId: String!
  userEmail: String!
  paymentMethodId: String!
}

type CreateOrderPayload {
  order: Order
  errors: [String!]!
}
```

---

## Testing the API

### Using GraphiQL IDE

1. Navigate to http://localhost:3000/graphiql
2. Use the documentation explorer (Docs button)
3. Write queries in the left panel
4. Click the play button to execute
5. View results in the right panel

### Postman Collection

Import the following collection URL:
```
https://www.postman.com/collections/glp1-ecommerce-api
```

### Automated Testing

```bash
# Run GraphQL tests
cd backend
bundle exec rspec spec/graphql/
```

---

For questions or issues with the API, please refer to the [ARCHITECTURE.md](./ARCHITECTURE.md) documentation or open an issue in the repository.
