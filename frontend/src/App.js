import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import client from './apollo-client';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import './App.css';

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <div className="App">
          <nav className="navbar">
            <div className="nav-container">
              <Link to="/" className="nav-logo">
                <span className="logo-icon">💊</span>
                <span className="logo-text">GLP-1 Lifestyle Support</span>
              </Link>
              
              <ul className="nav-menu">
                <li className="nav-item">
                  <Link to="/" className="nav-link">
                    🏠 Products
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/cart" className="nav-link">
                    🛒 Cart
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/orders" className="nav-link">
                    📦 Orders
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<ProductList />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<OrderHistory />} />
            </Routes>
          </main>

          <footer className="footer">
            <div className="footer-content">
              <p>&copy; 2025 GLP-1 Lifestyle Support Platform</p>
              <p className="footer-subtitle">Empowering your health journey with curated products</p>
            </div>
          </footer>
        </div>
      </Router>
    </ApolloProvider>
  );
}
export default App;