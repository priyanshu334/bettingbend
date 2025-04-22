const mongoose = require("mongoose");

const BetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    matchId: { type: Number, required: true },
    teamId: { type: Number, required: false },
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
    betCondition: { type: String, required: true },
    overs: { type: Number },
    statType: { type: String, enum: ["runs", "wickets", "4s", "6s"] },
    odds: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "won", "lost"], default: "pending" },
    resultChecked: { type: Boolean, default: false },
  },
  { timestamps: true }
);


module.exports = mongoose.model("RunsAndWickets", BetSchema);
