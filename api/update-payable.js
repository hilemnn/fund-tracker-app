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
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['FON', 'HİSSE'], default: 'FON' },
  price: { type: String, default: '-' },
  totalAmount: { type: String, required: true },
  payableAmount: { type: String, default: '0' },
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  fundId: { type: String, required: true },
  fundName: { type: String, required: true },
  amount: { type: Number, required: true },
  previousAmount: { type: Number, default: 0 },
  type: { type: String, enum: ['INCREASE', 'DECREASE'], required: true },
  date: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  operation: { type: String, required: true },
  newAmount: { type: Number, required: true }
});

const Fund = mongoose.models.Fund || mongoose.model('Fund', fundSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  await dbConnect();
  
  if (req.method === 'POST') {
    try {
      const { fundId, operation } = req.body;
      
      if (!fundId || !operation) {
        return res.status(400).json({ 
          message: 'fundId and operation are required' 
        });
      }
      
      // Önce mevcut fund'ı getir
      const currentFund = await Fund.findById(fundId);
      if (!currentFund) {
        return res.status(404).json({ message: 'Fund not found' });
      }
      
      // Mevcut payableAmount'u al
      const currentAmount = parseFloat(currentFund.payableAmount) || 0;
      
      // Operation'ı parse et (+5, -3, 5 vs.)
      let newAmount;
      const operationStr = operation.toString().trim();
      
      if (operationStr.startsWith('+')) {
        // +5 -> mevcut değere ekle
        const addValue = parseFloat(operationStr.substring(1));
        newAmount = currentAmount + addValue;
      } else if (operationStr.startsWith('-')) {
        // -3 -> mevcut değerden çıkar
        const subtractValue = parseFloat(operationStr.substring(1));
        newAmount = currentAmount - subtractValue;
      } else {
        // 5 -> pozitif sayı, otomatik ekle
        const addValue = parseFloat(operationStr);
        if (isNaN(addValue)) {
          return res.status(400).json({ 
            message: 'Invalid operation format. Use +5, -3, or 5' 
          });
        }
        newAmount = currentAmount + addValue;
      }
      
      // Negatif değerleri 0'a sınırla
      if (newAmount < 0) newAmount = 0;
      
      // Fund'ı güncelle
      const updatedFund = await Fund.findByIdAndUpdate(
        fundId, 
        { payableAmount: newAmount.toString() }, 
        { new: true, runValidators: true }
      );
      
      // Transaction kaydı oluştur
      const transactionData = {
        fundId: fundId,
        fundName: currentFund.name,
        amount: Math.abs(newAmount - currentAmount), // İşlem miktarı (pozitif)
        previousAmount: currentAmount,
        type: newAmount > currentAmount ? 'INCREASE' : 'DECREASE',
        operation: operationStr,
        newAmount: newAmount,
        description: `Payable amount updated: ${operationStr}`
      };
      
      const transaction = new Transaction(transactionData);
      await transaction.save();
      
      res.status(200).json({
        fund: updatedFund.toObject(),
        transaction: transaction.toObject(),
        operation: operationStr,
        previousAmount: currentAmount,
        newAmount: newAmount
      });
    } catch (error) {
      console.error('Payable Update Error:', error);
      res.status(500).json({ 
        error: 'Database error', 
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
