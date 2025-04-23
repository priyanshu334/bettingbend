const mongoose = require("mongoose");

const BetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    matchId: { type: Number, required: true },
    teamId: { type: Number, required: false },
    marketType: {
      type: String,
      enum: ["runs", "wickets", "fours", "sixes", "match", "tied", "toss"],
      required: true,
    },
    statType: {
      type: String,
      enum: ["total", "highest", "individual"],
      required: false,
    },
    betCondition: {
      type: String,
      enum: ["true", "false"],
      required: true,
    },
    overs: { type: String },
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

module.exports = mongoose.model("MatchRunsWickets", BetSchema);