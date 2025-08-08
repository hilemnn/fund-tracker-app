// Vercel Serverless Function: /api/funds/index.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const fundSchema = new mongoose.Schema({
  name: String,
  type: String,
  price: String,
  totalAmount: String,
  payableAmount: String,
  createdAt: Date,
});

const Fund = mongoose.models.Fund || mongoose.model('Fund', fundSchema);

export default async function handler(req, res) {
  await dbConnect();
  if (req.method === 'GET') {
    try {
      const funds = await Fund.find().sort({ createdAt: -1 });
      res.status(200).json(funds);
    } catch (error) {
      res.status(500).json({ error: 'MongoDB error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
