const mongoose = require("mongoose");

const BoundaryBetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  matchId: {
    type:String,
    required: true,
  },
  teamName: {
    type: String,
    required: true,
  },
  playerName: {
    type: String,
    required: true,
  },
  predictedBoundaries: {
    type: Number,
    required: true,
  },
  betAmount: {
    type: Number,
    required: true,
  },
  isWon: {
    type: Boolean,
    default: null,
  },
  payoutAmount: {
    type: Number,
    default: 0,
  },
  resultChecked: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String, // 'won', 'lost'
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('BoundaryBet', BoundaryBetSchema);
