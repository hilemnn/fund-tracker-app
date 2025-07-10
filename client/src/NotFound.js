import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">404</div>
        <h1>Sayfa Bulunamadı</h1>
        <p>Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        <div className="not-found-buttons">
          <Link to="/" className="home-btn">
            Ana Sayfa
          </Link>
          <Link to="/admin" className="admin-btn">
            Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
