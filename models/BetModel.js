// models/Bet.js
import mongoose from 'mongoose';

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

export default mongoose.model('Bet', betSchema);