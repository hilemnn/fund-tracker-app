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

// Health check endpoint
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.json({ 
    status: 'OK', 
    message: 'API is running on Vercel serverless',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    method: req.method,
    url: req.url
  });
}
