import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { GET_CART } from '../graphql/queries';
import { CREATE_ORDER } from '../graphql/mutations';
import './Checkout.css';

const Checkout = () => {
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState({});
  
  const sessionId = localStorage.getItem('sessionId');
  const navigate = useNavigate();
  
  const { data: cartData } = useQuery(GET_CART, {
    variables: { sessionId },
    skip: !sessionId,
  });
  
  const [createOrder, { loading }] = useMutation(CREATE_ORDER);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    
    if (!expiry || !expiry.match(/^\d{2}\/\d{2}$/)) {
      newErrors.expiry = 'Please enter expiry in MM/YY format';
    }
    
    if (!cvv || cvv.length < 3) {
      newErrors.cvv = 'Please enter a valid CVV';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const result = await createOrder({
        variables: {
          sessionId,
          userEmail: email,
          paymentMethodId: `pm_test_${cardNumber.slice(-4)}`
        }
      });
      
      if (result.data.createOrder.errors.length > 0) {
        alert(result.data.createOrder.errors.join(', '));
      } else {
        localStorage.setItem('userEmail', email);
        alert('Order placed successfully! Check your email for confirmation.');
        navigate('/orders');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Error placing order. Please try again.');
    }
  };
  
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };
  
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(formatCardNumber(value));
    }
  };
  
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setExpiry(value);
  };
  
  const cart = cartData?.cart;
  
  if (!sessionId || !cart || cart.cartItems.length === 0) {
    return (
      <div className="checkout-container">
        <div className="empty-checkout">
          <h2>Your cart is empty</h2>
          <button onClick={() => navigate('/')}>Continue Shopping</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      
      <div className="checkout-content">
        <div className="checkout-form-section">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section">
              <h2>Contact Information</h2>
              
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
            </div>
            
            <div className="form-section">
              <h2>Payment Information</h2>
              <p className="test-mode-notice">
                🧪 Test Mode: Use card number 4242 4242 4242 4242
              </p>
              
              <div className="form-group">
                <label htmlFor="cardNumber">Card Number *</label>
                <input
                  id="cardNumber"
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4242 4242 4242 4242"
                  maxLength="19"
                  required
                />
                {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expiry">Expiry Date *</label>
                  <input
                    id="expiry"
                    type="text"
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                  {errors.expiry && <span className="error-text">{errors.expiry}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="cvv">CVV *</label>
                  <input
                    id="cvv"
                    type="text"
                    value={cvv}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 4 && /^\d*$/.test(value)) {
                        setCvv(value);
                      }
                    }}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                  {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="place-order-btn"
            >
              {loading ? 'Processing...' : `Place Order - $${cart.total.toFixed(2)}`}
            </button>
          </form>
        </div>
        
        <div className="order-summary-section">
          <h2>Order Summary</h2>
          
          <div className="summary-items">
            {cart.cartItems.map((item) => (
              <div key={item.id} className="summary-item">
                <img src={item.product.imageUrl} alt={item.product.name} />
                <div className="summary-item-details">
                  <p className="item-name">{item.product.name}</p>
                  <p className="item-quantity">Qty: {item.quantity}</p>
                </div>
                <p className="item-price">${item.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
          
          <div className="summary-totals">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;