const mongoose = require("mongoose");

const BetSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Reference to the User (custom string)
    matchId: { type: Number, required: true },
    teamId: { type: Number, required: false }, // Sometimes null for full match bets

    // Example: 'runs_at_6_overs', 'total_match_runs', 'total_match_wickets'
    marketType: {
      type: String,
      enum: [
        "runs_at_over",
        "wickets_at_over",
        "total_match_runs",
        "total_match_wickets",
        "total_match_4s",
        "total_match_6s",
        "match_odds",
        "bookmaker",
        "toss",
        "winner"
      ],
      required: true,
    },

    // Stores Yes/No condition or Over number
    betCondition: {
      type: String,
      required: true, // e.g., "yes", "no", or "15_overs" for condition metadata
    },

    overs: { type: Number }, // For overs-specific bets (optional)
    statType: {
      type: String,
      enum: ["runs", "wickets", "4s", "6s"],
      required: false,
    },

    odds: { type: Number, required: true },
    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "won", "lost"],
      default: "pending",
    },
    resultChecked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bet", BetSchema);
