const mongoose = require("mongoose");

const playerWicketsBetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
  matchId: {
    type: String,
    required: true, // Match ID is required for each bet
  },
 
  playerName: {
    type: String,
    required: true, // Player name should be included in the bet
  },
  predictedWickets: {
    type: Number,
    required: true, // Predicted wickets as the number of wickets expected
  },
  betAmount: {
    type: Number,
    required: true, // Amount placed for the bet
  },
  isWon: {
    type: Boolean,
    default: null, // Initially null, will be updated when the bet is settled
  },
  payoutAmount: {
    type: Number,
    default: 0, // Amount to be paid out if the bet is won
  },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

module.exports = mongoose.model("PlayerWicketsBet", playerWicketsBetSchema);
