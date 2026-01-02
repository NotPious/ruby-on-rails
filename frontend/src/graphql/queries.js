import { gql } from '@apollo/client';

export const GET_PRODUCTS = gql`
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
      createdAt
    }
  }
`;

export const GET_PRODUCT = gql`
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
`;

export const GET_CART = gql`
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
          inventoryCount
        }
      }
    }
  }
`;

export const GET_ORDERS = gql`
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
          id
          name
          imageUrl
        }
      }
    }
  }
`;

export const GET_ORDER = gql`
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
`;