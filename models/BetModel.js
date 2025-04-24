// models/Bet.js
const mongoose = require('mongoose');

const BetSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100
  },
  betTitle: {
    type: String,
    required: true
  },
  selectedTeam: {
    type: String,
    enum: ['pink', 'blue'],
    required: true
  },
  odds: {
    type: mongoose.Schema.Types.Mixed, // can be number or string
    required: true
  },
  won: {
    type: Boolean,
    default: false
  },
  creditedTo: {
    type: String,
    enum: ['admin', 'member'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Bets', BetSchema);
