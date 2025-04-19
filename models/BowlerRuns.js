// models/BowlerRunsBet.ts

import mongoose from 'mongoose';

const BowlerRunsBetSchema = new mongoose.Schema({
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
  bowlerName: {
    type: String,
    required: true
  },
  predictedRunsConceded: {
    type: Number,
    required: true
  },
  betAmount: {
    type: Number,
    required: true
  },
  isWon: {
    type: Boolean,
    default: null // To be set after match result
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

export default mongoose.model('BowlerRunsBet', BowlerRunsBetSchema);
