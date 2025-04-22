const mongoose = require("mongoose");

const playerRunsBetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  matchId: {
    type: String,
    required: true,
  },
  playerId: {
    type: Number,
    required: true,
  },
  playerName: {
    type: String,
    required: true,
  },
  betType: {
    type: String,
    required: true, // e.g., "50+": predicted that player will score 50+
  },
  odds: {
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
}, { timestamps: true });

module.exports = mongoose.model("PlayerRunsBet", playerRunsBetSchema);
