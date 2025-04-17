const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  // Use default _id or define your own player ID
  // playerId: { type: Number, unique: true, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  fullName: { type: String, required: true }, // Store full name for easy access
  imagePath: { type: String },
  position: { // Important for identifying bowlers
    name: { type: String, required: true } // e.g., "Bowler", "Batsman", "Allrounder"
  },
  // Add other relevant player details
}, { timestamps: true }); // Add timestamps if needed

module.exports = mongoose.model('Player', playerSchema);
