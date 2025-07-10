import React from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  const handleLogoClick = () => {
    window.location.href = '/';
  };

  return (
    <header className="header-menu">
      <div className="header-container">
        <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <h1>
            Borç Takip
            {isAdminPage && <span className="admin-badge">-admin</span>}
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
