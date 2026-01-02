import React from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { GET_CART } from '../graphql/queries';
import { UPDATE_CART_ITEM } from '../graphql/mutations';
import './Cart.css';

const Cart = () => {
  const sessionId = localStorage.getItem('sessionId');
  const navigate = useNavigate();
  
  const { loading, error, data, refetch } = useQuery(GET_CART, {
    variables: { sessionId },
    skip: !sessionId,
  });
  
  const [updateCartItem] = useMutation(UPDATE_CART_ITEM);
  
  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    try {
      const result = await updateCartItem({ 
        variables: { cartItemId, quantity: newQuantity } 
      });
      
      if (result.data.updateCartItem.errors.length > 0) {
        alert(result.data.updateCartItem.errors.join(', '));
      }
      
      refetch();
    } catch (err) {
      console.error('Error updating cart:', err);
      alert('Error updating cart');
    }
  };
  
  const handleRemoveItem = (cartItemId) => {
    if (window.confirm('Remove this item from your cart?')) {
      handleUpdateQuantity(cartItemId, 0);
    }
  };
  
  if (!sessionId) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Start shopping to add items to your cart</p>
        <button onClick={() => navigate('/')}>Browse Products</button>
      </div>
    );
  }
  
  if (loading) return <div className="loading">Loading cart...</div>;
  if (error) return <div className="error">Error loading cart: {error.message}</div>;
  
  const cart = data?.cart;
  
  if (!cart || cart.cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Start shopping to add items to your cart</p>
        <button onClick={() => navigate('/')}>Browse Products</button>
      </div>
    );
  }
  
  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>
      <p className="cart-item-count">{cart.cartItems.length} item(s)</p>
      
      <div className="cart-content">
        <div className="cart-items">
          {cart.cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={item.product.imageUrl} alt={item.product.name} />
              
              <div className="item-details">
                <h3>{item.product.name}</h3>
                <p className="price">${item.product.price.toFixed(2)} each</p>
                {item.product.inventoryCount <= 10 && (
                  <p className="low-stock">Only {item.product.inventoryCount} left in stock</p>
                )}
              </div>
              
              <div className="quantity-controls">
                <button 
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="quantity">{item.quantity}</span>
                <button 
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.inventoryCount}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              
              <div className="item-subtotal">
                <strong>${item.subtotal.toFixed(2)}</strong>
              </div>
              
              <button 
                className="remove-btn"
                onClick={() => handleRemoveItem(item.id)}
                aria-label="Remove item"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        
        <div className="cart-summary">
          <h2>Order Summary</h2>
          
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
          
          <div className="summary-row">
            <span>Shipping:</span>
            <span>FREE</span>
          </div>
          
          <div className="summary-row total">
            <span>Total:</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
          
          <button 
            onClick={() => navigate('/checkout')} 
            className="checkout-btn"
          >
            Proceed to Checkout
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            className="continue-shopping-btn"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;