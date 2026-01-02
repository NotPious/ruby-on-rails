import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_PRODUCTS, GET_CART } from '../graphql/queries';
import { ADD_TO_CART } from '../graphql/mutations';
import './ProductList.css';

const ProductList = () => {
  const [category, setCategory] = useState('');
  const [glp1Stage, setGlp1Stage] = useState('');
  const [notification, setNotification] = useState(null);
  
  // Get or create session ID
  const sessionId = localStorage.getItem('sessionId') || generateSessionId();
  
  const { loading, error, data } = useQuery(GET_PRODUCTS, {
    variables: { 
      category: category || null, 
      glp1Stage: glp1Stage || null 
    },
  });
  
  const [addToCart, { loading: adding }] = useMutation(ADD_TO_CART, {
    refetchQueries: [
      { query: GET_CART, variables: { sessionId } }
    ],
  });
  
  function generateSessionId() {
    const id = `session_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', id);
    return id;
  }
  
  const handleAddToCart = async (productId, productName) => {
    try {
      const result = await addToCart({
        variables: { sessionId, productId, quantity: 1 }
      });
      
      if (result.data.addToCart.errors.length > 0) {
        showNotification(result.data.addToCart.errors.join(', '), 'error');
      } else {
        showNotification(`${productName} added to cart!`, 'success');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      showNotification('Error adding to cart', 'error');
    }
  };
  
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">Error loading products: {error.message}</div>;
  
  return (
    <div className="product-list-container">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="page-header">
        <h1>Shop Products</h1>
        <p className="subtitle">Curated products to support your GLP-1 journey</p>
      </div>
      
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="category">Category:</label>
          <select 
            id="category"
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Supplements">Supplements</option>
            <option value="Meal Prep">Meal Prep</option>
            <option value="Fitness">Fitness</option>
            <option value="Wellness">Wellness</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="glp1-stage">GLP-1 Journey Stage:</label>
          <select 
            id="glp1-stage"
            value={glp1Stage} 
            onChange={(e) => setGlp1Stage(e.target.value)}
          >
            <option value="">All Stages</option>
            <option value="starting">Just Starting</option>
            <option value="active">Active Management</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        
        {(category || glp1Stage) && (
          <button 
            className="clear-filters"
            onClick={() => {
              setCategory('');
              setGlp1Stage('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>
      
      {data.products.length === 0 ? (
        <div className="no-products">
          <p>No products found matching your criteria.</p>
          <button onClick={() => { setCategory(''); setGlp1Stage(''); }}>
            View All Products
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {data.products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image-container">
                <img src={product.imageUrl} alt={product.name} />
                {product.inventoryCount <= 10 && product.inventoryCount > 0 && (
                  <span className="low-stock-badge">Only {product.inventoryCount} left!</span>
                )}
                {product.inventoryCount === 0 && (
                  <span className="out-of-stock-badge">Out of Stock</span>
                )}
              </div>
              
              <div className="product-info">
                <span className="product-category">{product.category}</span>
                {product.glp1Stage && (
                  <span className="product-stage">{product.glp1Stage}</span>
                )}
                
                <h3>{product.name}</h3>
                <p className="price">${product.price.toFixed(2)}</p>
                <p className="description">{product.description}</p>
                
                {product.educationalContent && (
                  <div className="educational-tip">
                    <strong>💡 Why this helps:</strong>
                    <p>{product.educationalContent}</p>
                  </div>
                )}
                
                <button 
                  onClick={() => handleAddToCart(product.id, product.name)}
                  disabled={adding || product.inventoryCount === 0}
                  className="add-to-cart-btn"
                >
                  {adding ? 'Adding...' : product.inventoryCount === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;