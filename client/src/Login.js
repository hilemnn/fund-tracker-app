import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // LocalStorage'dan admin bilgilerini al
    const savedUsername = localStorage.getItem('adminUsername') || 'admin';
    const savedPassword = localStorage.getItem('adminPassword') || 'admin123';

    // Admin kontrolü
    if (credentials.username === savedUsername && credentials.password === savedPassword) {
      localStorage.setItem('isAdminLoggedIn', 'true');
      onLogin();
    } else {
      setError('Kullanıcı adı veya şifre hatalı!');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>Admin Girişi</h2>
          <p>Borç Takip Sistemi</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Kullanıcı Adı:</label>
            <input
              type="text"
              id="username"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              placeholder="admin"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Şifre:</label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              placeholder="Şifrenizi girin"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        
        <div className="login-info">
          <small>Demo: admin / admin123</small>
        </div>
      </div>
    </div>
  );
};

export default Login;
