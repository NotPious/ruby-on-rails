import { gql } from '@apollo/client';

export const ADD_TO_CART = gql`
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
          subtotal
          product {
            id
            name
            price
            imageUrl
          }
        }
      }
      errors
    }
  }
`;

export const UPDATE_CART_ITEM = gql`
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
`;

export const CREATE_ORDER = gql`
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
        paymentStatus
        createdAt
        orderItems {
          id
          quantity
          price
          product {
            name
          }
        }
      }
      errors
    }
  }
`;