// models/Bet.js
const mongoose = require("mongoose")

const betSchema = new mongoose.Schema({
  title: String,
  odds: String,
  amount: Number,
  selectedTeam: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  result: {
    type: String,
    enum: ['pending', 'won', 'lost'],
    default: 'pending',
  }
});

module.exports=  mongoose.model('Bet', betSchema);