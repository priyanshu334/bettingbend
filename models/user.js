const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: String,
  fullName: String,
  phone: String,
  password: String,
  referralCode: String,
  money: { type: Number, default: 0 },
  totalBets: { type: Number, default: 0 }, // Total amount bet
  betHistory: [
    {
      player: String,
      odds: String,
      amount: Number,
      result: String, // 'win' | 'lose'
      winnings: Number,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
