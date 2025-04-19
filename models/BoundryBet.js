// models/BoundaryBet.ts

const mongoose = require("mongoose")

const BoundaryBetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  teamName: {
    type: String,
    required: true
  },
  playerName: {
    type: String,
    required: true
  },
  predictedBoundaries: {
    type: Number,
    required: true
  },
  betAmount: {
    type: Number,
    required: true
  },
  isWon: {
    type: Boolean,
    default: null // will be set after match
  },
  payoutAmount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports =  mongoose.model('BoundaryBet', BoundaryBetSchema);
