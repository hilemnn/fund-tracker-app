import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Login from './Login';
import AdminPanel from './AdminPanel';
import NotFound from './NotFound';
import API_BASE_URL from './config/api';
import './App.css';

// Configure axios base URL
axios.defaults.baseURL = API_BASE_URL;

function App() {
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [funds, setFunds] = useState([]);

  // Check if user is already logged in
  useEffect(() => {
    const loggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    
    // Load funds from database
    fetchFunds();
  }, []);

  const fetchFunds = async () => {
    try {
      const response = await axios.get('/api/funds');
      setFunds(response.data);
    } catch (error) {
      console.error('Error fetching funds:', error);
      setMessage('Fonlar yüklenirken hata oluştu');
    }
  };

  // Save funds to localStorage whenever funds change (backup)
  useEffect(() => {
    localStorage.setItem('funds', JSON.stringify(funds));
  }, [funds]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    setIsLoggedIn(false);
    // Navigate to home page after logout
    window.location.href = '/';
  };

  // Borç hesaplamaları
  const calculateDebtStats = () => {
    let totalDebt = 0;
    let paidDebt = 0;
    
    funds.forEach(fund => {
      // Fiyatı sayıya çevir (TL kısmını kaldır)
      const price = parseFloat(fund.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      const totalAmount = parseFloat(fund.totalAmount) || 0;
      const paidAmount = parseFloat(fund.payableAmount) || 0;
      
      // Toplam borç = fiyat * toplam adet
      totalDebt += price * totalAmount;
      
      // Ödenen borç = fiyat * ödenen adet
      paidDebt += price * paidAmount;
    });
    
    const remainingDebt = totalDebt - paidDebt;
    
    return {
      total: totalDebt,
      paid: paidDebt,
      remaining: remainingDebt
    };
  };

  const addFund = async (newFundData) => {
    try {
      const response = await axios.post('/api/funds', {
        name: newFundData.name,
        type: newFundData.type || 'FON',
        price: newFundData.price,
        totalAmount: newFundData.totalAmount,
        payableAmount: newFundData.payableAmount
      });
      
      setFunds([response.data, ...funds]);
      setMessage('Fon başarıyla eklendi!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error adding fund:', error);
      setMessage('Fon eklenirken hata oluştu');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const debtStats = calculateDebtStats();

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              <div>
                <Header />
                <div className="main-content">
                  <div className="container">
                    {message && (
                      <div className={message.includes('Error') ? 'error' : 'success'}>
                        {message}
                      </div>
                    )}

                    {/* Fon Ekle Butonu */}
                    <div className="add-fund-section">
                      <button 
                        className="add-fund-button"
                        onClick={() => window.location.href = '/admin'}
                      >
                        ➕ Fon Ekle
                      </button>
                    </div>

                    {/* Borç İstatistikleri */}
                    <div className="debt-stats-container">
                      <div className="debt-stats">
                        <div className="debt-stat-item">
                          <div className="debt-stat-label">Toplam Borç</div>
                          <div className="debt-stat-value total">{debtStats.total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</div>
                        </div>
                        <div className="debt-stat-item">
                          <div className="debt-stat-label">Ödenen Borç</div>
                          <div className="debt-stat-value paid">{debtStats.paid.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</div>
                        </div>
                        <div className="debt-stat-item">
                          <div className="debt-stat-label">Kalan Borç</div>
                          <div className="debt-stat-value remaining">{debtStats.remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-container">
                      <div className="progress-header">
                        <span>Borç Ödeme Durumu</span>
                        <span>{debtStats.total > 0 ? Math.round((debtStats.paid / debtStats.total) * 100) : 0}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${debtStats.total > 0 ? (debtStats.paid / debtStats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="table-container">
                        <table className="fon-table">
                          <thead>
                            <tr>
                              <th>FON/HİSSE</th>
                              <th>FİYAT</th>
                              <th>TOPLAM ADET</th>
                              <th>ÖDENEN</th>
                            </tr>
                          </thead>
                          <tbody>
                            {funds.length === 0 ? (
                              <tr>
                                <td colSpan="4" style={{ textAlign: 'center', color: '#666' }}>
                                  Henüz fon eklenmedi.
                                </td>
                              </tr>
                            ) : (
                              funds.map((fund) => (
                                <tr key={fund._id}>
                                  <td>{fund.name}</td>
                                  <td>{fund.price}</td>
                                  <td>{fund.totalAmount}</td>
                                  <td>{fund.payableAmount}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } 
          />
          <Route 
            path="/admin" 
            element={
              isLoggedIn ? (
                <AdminPanel 
                  onLogout={handleLogout} 
                  funds={funds}
                  onAddFund={addFund}
                />
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
