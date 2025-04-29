const mongoose = require("mongoose");

const BowlerRunsBetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  matchId: {
    type: String,
    required: true
  },
  playerId: {            // 🆕 Store player ID now
    type: String,
    required: true
  },
  bowlerName: {          // (Optional) still storing name for UI convenience
    type: String,
    required: true
  },
  predictedRunsConceded: {
    type: Number,
    required: true
  },
  actualRunsConceded: {
    type: Number,
    default: null
  },
  betAmount: {
    type: Number,
    required: true
  },
  isWon: {
    type: Boolean,
    default: null
  },
  payoutAmount: {
    type: Number,
    default: 0
  },
  betStatus: {
    type: String,
    enum: ["pending", "won", "lost"],
    default: "pending"
  },
  settledAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BowlerRunsBet', BowlerRunsBetSchema);
