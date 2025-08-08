import React, { useState } from 'react';
import axios from 'axios';
import Header from './Header';
import API_BASE_URL from './config/api';
import './AdminPanel.css';

// Configure axios base URL
axios.defaults.baseURL = API_BASE_URL;

const AdminPanel = ({ onLogout, funds, onAddFund }) => {
  const [showFundInput, setShowFundInput] = useState(false);
  const [newFundName, setNewFundName] = useState('');
  const [newFundType, setNewFundType] = useState('FON');
  const [newFundTotalAmount, setNewFundTotalAmount] = useState('');
  const [editingFund, setEditingFund] = useState(null);
  const [editFundName, setEditFundName] = useState('');
  const [showPayableModal, setShowPayableModal] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);
  const [payableOperation, setPayableOperation] = useState('');
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Son güncelleme zamanını localStorage'dan yükle
  React.useEffect(() => {
    const savedTime = localStorage.getItem('lastPriceUpdate');
    if (savedTime) {
      setLastUpdateTime(new Date(savedTime));
    }
    
    // Transaction'ları yükle
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      console.log('İşlem geçmişi yükleniyor...');
      const response = await axios.get('/api/transactions');
      console.log('İşlem geçmişi yüklendi:', response.data.length, 'kayıt');
      console.log('Yüklenen transactions:', response.data.map(t => ({ id: t._id, fundName: t.fundName })));
      setTransactions(response.data);
    } catch (error) {
      console.error('İşlem geçmişi yükleme hatası:', error);
      
      if (error.response) {
        console.error('Server yanıtı:', error.response.status, error.response.data);
        if (error.response.status === 404 || error.response.status === 500) {
          // Server'da endpoint yok veya database hatası
          console.log('Server\'da transaction endpoint\'i bulunamadı veya database hatası, boş liste gösteriliyor');
        }
      } else if (error.request) {
        console.error('Network hatası:', error.request);
      } else {
        console.error('Genel hata:', error.message);
      }
      
      // Hata durumunda boş liste göster
      setTransactions([]);
    }
  };

  const toggleTransactions = () => {
    setShowTransactions(!showTransactions);
    if (!showTransactions) {
      fetchTransactions(); // Açılırken yeniden yükle
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!transactionId) {
      alert('Geçersiz işlem ID\'si');
      return;
    }

    console.log('Silme işlemi başlatılıyor. Transaction ID:', transactionId);

    if (window.confirm('Bu işlem kaydını silmek istediğinizden emin misiniz?')) {
      try {
        // Önce server bağlantısını test et
        console.log('Server bağlantısı test ediliyor...');
        await axios.get('/api/health');
        console.log('Server bağlantısı başarılı');
        
        // Server'a silme isteği gönder
        console.log('Silme isteği gönderiliyor:', `/api/transactions/${transactionId}`);
        const response = await axios.delete(`/api/transactions/${transactionId}`);
        console.log('Server silme yanıtı:', response.status, response.data);
        
        if (response.status === 200) {
          console.log('✅ Server silme işlemi başarılı:', response.data);
          
          // İşlem başarılı - Database'den gerçek durumu al
          console.log('Database\'den güncel listeyi alıyor...');
          await fetchTransactions();
          
          alert(`İşlem kaydı başarıyla silindi!\nDatabase'de kalan kayıt: ${response.data.remainingCount || 'Bilinmiyor'}`);
        } else {
          throw new Error(`Beklenmeyen yanıt: ${response.status}`);
        }
        
      } catch (error) {
        console.error('İşlem silme hatası:', error);
        
        // Hata türüne göre mesaj göster
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message || 'Bilinmeyen server hatası';
          
          console.error('Server hatası:', status, message);
          console.error('Tam hata:', error.response);
          
          if (status === 404) {
            // 404 hatası - kayıt bulunamadı
            console.log('404: Transaction bulunamadı, database\'i yeniden senkronize ediliyor...');
            alert('İşlem kaydı server\'da bulunamadı. Liste güncelleniyor...');
            
            // Database'den gerçek durumu al ve frontend'i senkronize et
            try {
              await fetchTransactions();
              console.log('Transaction listesi başarıyla senkronize edildi');
            } catch (syncError) {
              console.error('Senkronizasyon hatası:', syncError);
              // Manual olarak frontend'ten de sil
              const updatedTransactions = transactions.filter(t => t._id !== transactionId);
              setTransactions(updatedTransactions);
              console.log('Manuel olarak frontend\'ten silindi');
            }
          } else {
            alert(`Server hatası (${status}): ${message}`);
          }
        } else if (error.request) {
          // Network hatası
          console.error('Network hatası:', error.request);
          alert('Sunucu bağlantısı kurulamadı. Server çalışıyor mu? Lütfen kontrol edin.');
        } else if (error.message.includes('health')) {
          // Health check başarısız
          console.error('Server health check başarısız');
          alert('Server çalışmıyor. Lütfen server\'ı başlatın ve tekrar deneyin.');
        } else {
          // Genel hata
          console.error('Genel hata:', error.message);
          alert('Beklenmeyen bir hata oluştu: ' + error.message);
        }
      }
    }
  };

  const handleClearAllTransactions = async () => {
    if (window.confirm('TÜM işlem geçmişini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      if (window.confirm('Bu işlem tüm geçmiş kayıtları kalıcı olarak silecek. Devam etmek istediğinizden emin misiniz?')) {
        try {
          console.log('Clearing all transactions...');
          
          const response = await axios.delete('/api/transactions');
          console.log('Clear response:', response.data);
          
          // Frontend'te de tüm transaction'ları temizle
          setTransactions([]);
          
          alert(`Tüm işlem geçmişi başarıyla sıfırlandı. (${response.data.deletedCount} kayıt silindi)`);
          
          // İşlem geçmişini yeniden yükle
          fetchTransactions();
        } catch (error) {
          console.error('Error clearing all transactions:', error);
          
          if (error.response && error.response.data && error.response.data.message) {
            alert(`Hata: ${error.response.data.message}`);
          } else {
            alert('İşlem geçmişi sıfırlanırken hata oluştu.');
          }
        }
      }
    }
  };

  const handleAddFund = () => {
    setShowFundInput(true);
  };

  const handleSaveFund = () => {
    if (newFundName.trim() && newFundTotalAmount.trim()) {
      const newFund = {
        name: newFundName.trim(),
        type: newFundType,
        price: '-',
        totalAmount: newFundTotalAmount.trim(),
        payableAmount: '0'
      };
      onAddFund(newFund);
      setNewFundName('');
      setNewFundType('FON');
      setNewFundTotalAmount('');
      setShowFundInput(false);
    } else {
      alert('Lütfen fon adı ve toplam adet bilgilerini girin.');
    }
  };

  const handleDeleteFund = async (fundId) => {
    if (window.confirm('Bu fonu silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`/api/funds/${fundId}`);
        window.location.reload(); // Sayfayı yenile
      } catch (error) {
        console.error('Error deleting fund:', error);
        alert('Fon silinirken hata oluştu');
      }
    }
  };

  const handleEditFund = (fund) => {
    setEditingFund(fund._id);
    setEditFundName(fund.name);
  };

  const handleSaveEdit = async (fundId) => {
    if (editFundName.trim()) {
      try {
        await axios.put(`/api/funds/${fundId}`, {
          name: editFundName.trim()
        });
        setEditingFund(null);
        setEditFundName('');
        window.location.reload(); // Sayfayı yenile
      } catch (error) {
        console.error('Error updating fund:', error);
        alert('Fon güncellenirken hata oluştu');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingFund(null);
    setEditFundName('');
  };

  const handleOpenPayableModal = (fund) => {
    setSelectedFund(fund);
    setShowPayableModal(true);
    setPayableOperation('');
  };

  const handleClosePayableModal = () => {
    setShowPayableModal(false);
    setSelectedFund(null);
    setPayableOperation('');
  };

  const handlePayableSubmit = async () => {
    if (!selectedFund || !payableOperation.trim()) return;

    try {
      // Özel payable update endpoint'ini kullan (v2)
      const response = await axios.post('/api/update-payable', {
        fundId: selectedFund._id,
        operation: payableOperation.trim()
      });
      
      if (response.data.operation) {
        alert(`İşlem başarılı: ${response.data.operation}\nÖnceki: ${response.data.previousAmount}\nYeni: ${response.data.newAmount}`);
      } else if (response.data.message) {
        alert(response.data.message);
      }
      
      handleClosePayableModal();
      window.location.reload(); // Sayfayı yenile
    } catch (error) {
      console.error('Error updating payable amount:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('Ödenen adet güncellenirken hata oluştu');
      }
    }
  };

  const handlePayableKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePayableSubmit();
    } else if (e.key === 'Escape') {
      handleClosePayableModal();
    }
  };

  const handleCancelFund = () => {
    setNewFundName('');
    setNewFundType('FON');
    setNewFundTotalAmount('');
    setShowFundInput(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveFund();
    } else if (e.key === 'Escape') {
      handleCancelFund();
    }
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

  const debtStats = calculateDebtStats();

  const handleUpdatePrices = async () => {
    if (window.confirm('Tüm fon ve hisse fiyatları güncellenecek. Bu işlem birkaç dakika sürebilir. Devam etmek istiyor musunuz?')) {
      setIsUpdatingPrices(true);
      try {
        await axios.post('/api/update-fund-prices');
        
        // Güncelleme zamanını kaydet
        const updateTime = new Date();
        setLastUpdateTime(updateTime);
        localStorage.setItem('lastPriceUpdate', updateTime.toISOString());
        
        alert('Fiyat güncelleme işlemi başlatıldı. Birkaç dakika sonra sayfayı yenileyin.');
      } catch (error) {
        console.error('Error updating prices:', error);
        alert('Fiyat güncelleme işlemi başlatılırken hata oluştu.');
      } finally {
        setIsUpdatingPrices(false);
      }
    }
  };

  const handleAdminSettings = () => {
    setShowAdminSettings(true);
    // Mevcut bilgileri yükle
    const currentUsername = localStorage.getItem('adminUsername') || 'admin';
    setNewUsername(currentUsername);
    setNewPassword('');
  };

  const handleSaveAdminSettings = () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      alert('Lütfen kullanıcı adı ve şifre girin.');
      return;
    }
    
    // LocalStorage'a kaydet
    localStorage.setItem('adminUsername', newUsername.trim());
    localStorage.setItem('adminPassword', newPassword.trim());
    
    alert('Admin bilgileri başarıyla güncellendi!');
    setShowAdminSettings(false);
    setNewUsername('');
    setNewPassword('');
  };

  const handleCancelAdminSettings = () => {
    setShowAdminSettings(false);
    setNewUsername('');
    setNewPassword('');
  };

  return (
    <div className="admin-panel">
      <Header />
      <div className="admin-content">
        <div className="admin-header">
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
          
          <div className="admin-buttons">
            <button onClick={handleAddFund} className="add-fund-btn">
              Fon Ekle
            </button>
            <button onClick={handleAdminSettings} className="admin-settings-btn">
              Admin Ayarları
            </button>
            <div className="update-prices-container">
              <button 
                onClick={handleUpdatePrices} 
                className="update-prices-btn"
                disabled={isUpdatingPrices}
              >
                {isUpdatingPrices ? 'Güncelleniyor...' : 'Fiyatları Güncelle'}
              </button>
              {lastUpdateTime && (
                <div className="last-update-info">
                  Son güncelleme: {lastUpdateTime.toLocaleString('tr-TR')}
                </div>
              )}
            </div>
            <button onClick={onLogout} className="logout-btn">
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="debt-progress-container">
          <div className="debt-progress-info">
            <span className="progress-label">Borç Ödeme Durumu</span>
            <span className="progress-percentage">
              {debtStats.total > 0 ? Math.round((debtStats.paid / debtStats.total) * 100) : 0}% tamamlandı
            </span>
          </div>
          <div className="debt-progress-bar">
            <div 
              className="debt-progress-fill"
              style={{
                width: debtStats.total > 0 ? `${(debtStats.paid / debtStats.total) * 100}%` : '0%'
              }}
            ></div>
          </div>
        </div>
        
        {showFundInput && (
          <div className="fund-input-container">
            <div className="fund-input-box">
              <h3>Yeni Fon Ekle</h3>
              
              <div className="form-group">
                <label>Fon Adı:</label>
                <input
                  type="text"
                  value={newFundName}
                  onChange={(e) => setNewFundName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Fon adını girin..."
                  autoFocus
                  className="fund-input"
                />
              </div>
              
              <div className="form-group">
                <label>Fon Türü:</label>
                <select
                  value={newFundType}
                  onChange={(e) => setNewFundType(e.target.value)}
                  className="fund-select"
                >
                  <option value="FON">FON</option>
                  <option value="HİSSE">HİSSE</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Toplam Adet:</label>
                <input
                  type="number"
                  value={newFundTotalAmount}
                  onChange={(e) => setNewFundTotalAmount(e.target.value)}
                  placeholder="Toplam adet girin..."
                  className="fund-input"
                  min="0"
                />
              </div>
              
              <div className="fund-input-buttons">
                <button onClick={handleSaveFund} className="save-btn">
                  Kaydet
                </button>
                <button onClick={handleCancelFund} className="cancel-btn">
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showPayableModal && selectedFund && (
          <div className="payable-modal-container">
            <div className="payable-modal-box">
              <div className="payable-modal-header">
                <h3>Ödenen Adet Güncelle</h3>
                <h4>{selectedFund.name}</h4>
                <p>Mevcut: <strong>{selectedFund.payableAmount}</strong></p>
              </div>
              
              <div className="payable-modal-content">
                <div className="payable-examples">
                  <small>Örnekler: +5 (ekle), -3 (çıkar), 5 (ekle - pozitif sayılar otomatik +)</small>
                </div>
                <input
                  type="text"
                  value={payableOperation}
                  onChange={(e) => setPayableOperation(e.target.value)}
                  onKeyDown={handlePayableKeyPress}
                  placeholder="Örn: +5, -3 veya 5"
                  className="payable-modal-input"
                  autoFocus
                />
                
                <div className="payable-modal-buttons">
                  <button onClick={handlePayableSubmit} className="modal-save-btn">
                    Güncelle
                  </button>
                  <button onClick={handleClosePayableModal} className="modal-cancel-btn">
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {showAdminSettings && (
          <div className="admin-settings-container">
            <div className="admin-settings-box">
              <h3>Admin Ayarları</h3>
              
              <div className="form-group">
                <label>Kullanıcı Adı:</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Yeni kullanıcı adını girin..."
                  className="admin-input"
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Şifre:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yeni şifreyi girin..."
                  className="admin-input"
                />
              </div>
              
              <div className="admin-settings-buttons">
                <button onClick={handleSaveAdminSettings} className="save-btn">
                  Kaydet
                </button>
                <button onClick={handleCancelAdminSettings} className="cancel-btn">
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="card">
          <div className="table-container">
            <table className="fon-table">
              <thead>
                <tr>
                  <th>FON/HİSSE</th>
                  <th>FİYAT</th>
                  <th>TOPLAM ADET</th>
                  <th>ÖDENEN</th>
                  <th>İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {funds.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#666' }}>
                      Henüz fon eklenmedi. "Fon Ekle" butonuna tıklayarak başlayın.
                    </td>
                  </tr>
                ) : (
                  funds.map((fund) => (
                    <tr key={fund._id}>
                      <td>
                        {editingFund === fund._id ? (
                          <div className="edit-input-container">
                            <input
                              type="text"
                              value={editFundName}
                              onChange={(e) => setEditFundName(e.target.value)}
                              className="edit-input"
                              autoFocus
                            />
                            <div className="edit-buttons">
                              <button onClick={() => handleSaveEdit(fund._id)} className="save-edit-btn">✓</button>
                              <button onClick={handleCancelEdit} className="cancel-edit-btn">✗</button>
                            </div>
                          </div>
                        ) : (
                          fund.name
                        )}
                      </td>
                      <td>{fund.price}</td>
                      <td>{fund.totalAmount}</td>
                      <td>{fund.payableAmount}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleEditFund(fund)}
                            className="edit-btn"
                            disabled={editingFund === fund._id}
                            title="Adını Değiştir"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleOpenPayableModal(fund)}
                            className="payable-btn"
                            title="Ödenen Adet"
                          >
                            +
                          </button>
                          <button 
                            onClick={() => handleDeleteFund(fund._id)}
                            className="delete-btn"
                            title="Sil"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* İşlem Geçmişi */}
        <div className="transactions-section">
          <div className="transactions-header">
            <button 
              onClick={toggleTransactions} 
              className="transactions-toggle-btn"
            >
              {showTransactions ? '▼' : '▶'} İşlem Geçmişi ({transactions.length})
            </button>
            {showTransactions && (
              <div className="transactions-controls">
                <button 
                  onClick={() => {
                    console.log('Manuel refresh başlatıldı...');
                    fetchTransactions();
                  }}
                  className="refresh-transactions-btn"
                  title="İşlem Geçmişini Yenile"
                >
                  🔄 Yenile
                </button>
                {transactions.length > 0 && (
                  <button 
                    onClick={handleClearAllTransactions}
                    className="clear-all-transactions-btn"
                    title="Tüm İşlem Geçmişini Sil"
                  >
                    🗑️ Tümünü Sil
                  </button>
                )}
              </div>
            )}
          </div>
          
          {showTransactions && (
            <div className="transactions-dropdown">
              {transactions.length === 0 ? (
                <div className="no-transactions">
                  Henüz işlem kaydı bulunmuyor.
                </div>
              ) : (
                <div className="transactions-list">
                  {transactions.map((transaction, index) => {
                    console.log(`Transaction ${index}:`, transaction);
                    return (
                      <div key={transaction._id} className="transaction-item">
                        <div className="transaction-info">
                          <div className="transaction-fund">
                            {transaction.fundName}
                            <small style={{color: '#666', marginLeft: '10px', fontSize: '12px'}}>
                              ID: {transaction._id.slice(-6)}
                            </small>
                          </div>
                          <div className="transaction-details">
                            <span className={`transaction-operation ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                              {transaction.operation}
                            </span>
                            <span className="transaction-amounts">
                              {transaction.previousAmount} → {transaction.newAmount}
                            </span>
                          </div>
                        </div>
                        <div className="transaction-actions">
                          <div className="transaction-date">
                            {new Date(transaction.createdAt).toLocaleString('tr-TR')}
                          </div>
                          <button 
                            onClick={() => {
                              console.log('Silme butonu tıklandı. Transaction:', transaction);
                              console.log('Transaction ID:', transaction._id);
                              handleDeleteTransaction(transaction._id);
                            }}
                            className="transaction-delete-btn"
                            title="İşlem Kaydını Sil"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
