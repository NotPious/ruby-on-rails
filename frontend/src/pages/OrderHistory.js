import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ORDERS } from '../graphql/queries';
import './OrderHistory.css';

const OrderHistory = () => {
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');
  const [searchEmail, setSearchEmail] = useState('');
  
  const { loading, error, data } = useQuery(GET_ORDERS, {
    variables: { userEmail: searchEmail },
    skip: !searchEmail,
  });
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (email) {
      setSearchEmail(email);
      localStorage.setItem('userEmail', email);
    }
  };
  
  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      confirmed: 'green',
      failed: 'red',
      shipped: 'blue',
      delivered: 'purple',
      cancelled: 'gray'
    };
    return colors[status] || 'gray';
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="order-history-container">
      <h1>Order History</h1>
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
          />
          <button type="submit">View My Orders</button>
        </div>
      </form>
      
      {loading && <div className="loading">Loading orders...</div>}
      {error && <div className="error">Error loading orders: {error.message}</div>}
      
      {data && data.orders.length === 0 && (
        <div className="no-orders">
          <p>No orders found for {searchEmail}</p>
          <p>Orders will appear here after you make a purchase.</p>
        </div>
      )}
      
      {data && data.orders.length > 0 && (
        <div className="orders-list">
          <h2>Your Orders ({data.orders.length})</h2>
          
          {data.orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-id-section">
                  <h3>Order #{order.id}</h3>
                  <p className="order-date">{formatDate(order.createdAt)}</p>
                </div>
                
                <div className="order-status-section">
                  <span 
                    className={`status-badge ${getStatusColor(order.status)}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span 
                    className={`payment-badge ${order.paymentStatus === 'paid' ? 'green' : 'orange'}`}
                  >
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="order-items">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="order-item">
                    <img src={item.product.imageUrl} alt={item.product.name} />
                    <div className="order-item-details">
                      <p className="item-name">{item.product.name}</p>
                      <p className="item-quantity">Quantity: {item.quantity}</p>
                      <p className="item-price">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="item-total">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-footer">
                <div className="order-total">
                  <strong>Order Total:</strong>
                  <strong>${order.totalAmount.toFixed(2)}</strong>
                </div>
                
                {order.status === 'confirmed' && (
                  <button className="track-order-btn">Track Shipment</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;