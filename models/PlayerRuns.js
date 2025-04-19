// models/PlayerRunsBet.js

const mongoose = require("mongoose");

const playerRunsBetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  matchId: {
    type: String,
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
  predictedRuns: {
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
