const mongoose = require('mongoose');

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

// Funds API endpoint
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      // Get all funds
      const funds = await Fund.find().sort({ createdAt: -1 });
      return res.json(funds);
    }

    if (req.method === 'POST') {
      // Add new fund
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
      return res.status(201).json(savedFund);
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message,
      method: req.method,
      url: req.url
    });
  }
}
