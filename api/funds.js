const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Fund model (reuse from server)
const fundSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['FON', 'HİSSE'], default: 'FON' },
  price: { type: String, default: '-' },
  totalAmount: { type: String, required: true },
  payableAmount: { type: String, default: '0' },
  createdAt: { type: Date, default: Date.now }
});

const Fund = mongoose.models.Fund || mongoose.model('Fund', fundSchema);

// GET /api/funds - Get all funds from MongoDB
router.get('/', async (req, res) => {
  try {
    const funds = await Fund.find();
    res.json(funds);
  } catch (err) {
    res.status(500).json({ error: 'MongoDB error', details: err.message });
  }
});

module.exports = router;
