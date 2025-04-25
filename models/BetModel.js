// models/Bet.js
const mongoose = require('mongoose');

const BetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 100,
  },
  betTitle: {
    type: String,
    required: true,
  },
  selectedTeam: {
    type: String,
    enum: ['pink', 'blue'],
    required: true,
  },
  odds: {
    type: mongoose.Schema.Types.Mixed, // allows string or number
    required: true,
  },
  won: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Bet', BetSchema);
