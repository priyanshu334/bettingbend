const mongoose = require("mongoose");

const BetSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // ✅ Just a plain custom string
  matchId: { type: Number, required: true },
  teamId: { type: Number, required: true },

  marketType: {
    type: String,
    enum: ["match_odds", "bookmaker", "toss", "winner"],
    required: true,
  },
  betType: {
    type: String,
    enum: ["back", "lay"],
    
  },

  odds: { type: Number, required: true },
  amount: { type: Number, required: true },

  status: {
    type: String,
    enum: ["pending", "won", "lost"],
    default: "pending",
  },
  resultChecked: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Bet", BetSchema);
