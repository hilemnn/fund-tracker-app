const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors({
  origin: ['https://fund-tracker-app.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection with caching for serverless
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.mongodb.net/fundtracker?retryWrites=true&w=majority';

  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 1,
      bufferCommands: false,
    });
    
    cachedConnection = connection;
    console.log('✅ MongoDB connected successfully');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Fund Schema
const fundSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'FON' },
  price: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  payableAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'funds' });

// Prevent model recompilation in serverless environment
let Fund;
try {
  Fund = mongoose.model('Fund');
} catch {
  Fund = mongoose.model('Fund', fundSchema);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running on Vercel serverless',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Get all funds
app.get('/api/funds', async (req, res) => {
  try {
    await connectToDatabase();
    const funds = await Fund.find().sort({ createdAt: -1 });
    res.json(funds);
  } catch (error) {
    console.error('Error fetching funds:', error);
    res.status(500).json({ error: 'Fonlar getirilirken hata oluştu', details: error.message });
  }
});

// Add new fund
app.post('/api/funds', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { name, type, price, totalAmount, payableAmount } = req.body;
    
    if (!name || !price || !totalAmount) {
      return res.status(400).json({ error: 'Gerekli alanlar eksik' });
    }

    const fund = new Fund({
      name,
      type: type || 'FON',
      price,
      totalAmount: parseFloat(totalAmount),
      payableAmount: parseFloat(payableAmount) || 0
    });

    const savedFund = await fund.save();
    res.status(201).json(savedFund);
  } catch (error) {
    console.error('Error adding fund:', error);
    res.status(500).json({ error: 'Fon eklenirken hata oluştu', details: error.message });
  }
});

// Update fund
app.put('/api/funds/:id', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { id } = req.params;
    const updateData = req.body;

    const updatedFund = await Fund.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedFund) {
      return res.status(404).json({ error: 'Fon bulunamadı' });
    }

    res.json(updatedFund);
  } catch (error) {
    console.error('Error updating fund:', error);
    res.status(500).json({ error: 'Fon güncellenirken hata oluştu', details: error.message });
  }
});

// Delete fund
app.delete('/api/funds/:id', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { id } = req.params;
    const deletedFund = await Fund.findByIdAndDelete(id);
    
    if (!deletedFund) {
      return res.status(404).json({ error: 'Fon bulunamadı' });
    }

    res.json({ message: 'Fon başarıyla silindi', deletedFund });
  } catch (error) {
    console.error('Error deleting fund:', error);
    res.status(500).json({ error: 'Fon silinirken hata oluştu', details: error.message });
  }
});

// Export handler for Vercel
module.exports = (req, res) => {
  return app(req, res);
};
