const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new Schema({
  teamId: { type: Number, required: true },
  name: { type: String, required: true },
  image_path: { type: String }
}, { _id: false }); // Don't create separate _id for subdocuments

const lineupPlayerSchema = new Schema({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  teamId: { type: Number, required: true },
  isSubstitute: { type: Boolean, default: false }
}, { _id: false });

const bowlerOddsSchema = new Schema({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  teamId: { type: Number, required: true }, // To easily group later
  predictedRunsConceded: { type: Number, required: true },
  odds: [{ type: String, required: true }] // e.g., ["Over:1.90", "Under:1.85"]
}, { _id: false });

const matchSchema = new Schema({
  // Use default _id or define your own match ID
  // matchId: { type: Number, unique: true, required: true },
  localTeam: teamSchema,
  visitorTeam: teamSchema,
  venue: { type: String },
  startingAt: { type: Date },
  status: { type: String }, // e.g., 'Scheduled', 'Live', 'Finished'
  lineup: [lineupPlayerSchema], // Full lineup including substitutes
  bowlerRunsOdds: [bowlerOddsSchema], // Embed the pre-calculated odds
  // Add other relevant match details (scores, result, etc.)
}, { timestamps: true }); // Add timestamps if needed

module.exports = mongoose.model('Match', matchSchema);