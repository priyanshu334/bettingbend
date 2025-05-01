const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  password: String,
  referralCode: String,
  money: { type: Number, default: 0 },
  totalBets: { type: Number, default: 0 },
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
  accountHistory: [
    {
      type: { type: String, enum: ['deposit', 'withdrawal', 'bet', 'win', 'referral'] },
      amount: Number,
      reference: String,
      details: mongoose.Schema.Types.Mixed,
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);