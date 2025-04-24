const BoundaryBet = require("../models/BoundryBet");
const BowlerRunsBet = require("../models/BowlerRuns");
const Bet = require("../models/MatchdataModel");
const MatchRunsWickets = require("../models/MatchRunsWiicketsModel");
const PlayerRunsBet = require("../models/PlayerRuns");
const PlayerWicketsBet = require("../models/PlayerWickets");
const User = require("../models/user");

const getUserBets = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch placed bets (bets that are not yet settled)
    const placedBoundaryBets = await BoundaryBet.find({ userId, resultChecked: false });
    const placedBowlerRunsBets = await BowlerRunsBet.find({ userId, resultChecked: false });
    const placedMatchRunsWicketsBets = await MatchRunsWickets.find({ userId, resultChecked: false });
    const placedPlayerRunsBets = await PlayerRunsBet.find({ userId, resultChecked: false });
    const placedPlayerWicketsBets = await PlayerWicketsBet.find({ userId, resultChecked: false });
    const placedGeneralBets = await Bet.find({ userId, resultChecked: false });

    // Fetch settled bets (bets that are settled, with status 'won' or 'lost')
    const settledBoundaryBets = await BoundaryBet.find({ userId, resultChecked: true });
    const settledBowlerRunsBets = await BowlerRunsBet.find({ userId, resultChecked: true });
    const settledMatchRunsWicketsBets = await MatchRunsWickets.find({ userId, resultChecked: true });
    const settledPlayerRunsBets = await PlayerRunsBet.find({ userId, resultChecked: true });
    const settledPlayerWicketsBets = await PlayerWicketsBet.find({ userId, resultChecked: true });
    const settledGeneralBets = await Bet.find({ userId, resultChecked: true });

    // Combine all placed and settled bets
    const placedBets = [
      ...placedBoundaryBets,
      ...placedBowlerRunsBets,
      ...placedMatchRunsWicketsBets,
      ...placedPlayerRunsBets,
      ...placedPlayerWicketsBets,
      ...placedGeneralBets,
    ];

    const settledBets = [
      ...settledBoundaryBets,
      ...settledBowlerRunsBets,
      ...settledMatchRunsWicketsBets,
      ...settledPlayerRunsBets,
      ...settledPlayerWicketsBets,
      ...settledGeneralBets,
    ];

    // Return the placed and settled bets
    res.status(200).json({
      placedBets,
      settledBets,
    });
  } catch (err) {
    console.error("Error fetching user bets:", err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUserBets,
};
