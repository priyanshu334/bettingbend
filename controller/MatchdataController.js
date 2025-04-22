const Bet = require("../models/MatchdataModel"); // ✅ Correct model import
const User = require("../models/user");

const axios = require("axios");
const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

// 1️⃣ Place a Bet
const placeBet = async (req, res) => {
  try {
    const { userId, matchId, teamId, marketType, betType, odds, amount } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < amount) return res.status(400).json({ message: "Insufficient balance" });

    user.money -= amount;
    await user.save();

    const newBet = new Bet({
      userId,
      matchId,
      teamId,
      marketType,
      betType,
      odds,
      amount,
    });

    await newBet.save();

    res.status(201).json({ message: "Bet placed successfully", bet: newBet });
  } catch (err) {
    console.error("Error placing bet:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2️⃣ Settle Match Bets
const settleMatchBets = async (fixtureId, matchId) => {
  try {
    const { data } = await axios.get(
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureId}?include=tosswon,winner&api_token=${SPORTMONKS_API_TOKEN}`
    );

    const matchData = data.data;
    const tossWinnerId = matchData.tosswon_id;
    const matchWinnerId = matchData.winner_team_id;

    const allUnsettledBets = await Bet.find({ matchId, resultChecked: false });

    let settledCount = 0;

    for (const bet of allUnsettledBets) {
      const user = await User.findById(bet.userId);
      if (!user) continue;

      let isWin = false;
      let canSettle = false;

      switch (bet.marketType) {
        case "toss":
          if (tossWinnerId != null) {
            canSettle = true;
            isWin =
              (bet.betType === "back" && bet.teamId === tossWinnerId) ||
              (bet.betType === "lay" && bet.teamId !== tossWinnerId);
          }
          break;

        case "match_odds":
        case "bookmaker":
        case "winner":
          if (matchWinnerId != null) {
            canSettle = true;
            isWin =
              (bet.betType === "back" && bet.teamId === matchWinnerId) ||
              (bet.betType === "lay" && bet.teamId !== matchWinnerId);
          }
          break;

        default:
          console.warn(`⚠️ Unknown marketType: ${bet.marketType}`);
      }

      if (!canSettle) {
        console.log(`⏳ Skipping bet (${bet.marketType}) – result not available yet`);
        continue;
      }

      bet.status = isWin ? "won" : "lost";
      bet.resultChecked = true;
      await bet.save();

      if (isWin) {
        const winnings = bet.amount * bet.odds;
        user.money += winnings;
      }

      await user.save();
      settledCount++;
    }

    return {
      message: `✅ Settled ${settledCount} bets for match ${matchId}`,
    };
  } catch (err) {
    console.error("❌ Error settling bets:", err.message);
    throw new Error("Failed to settle bets. Please check logs.");
  }
};

module.exports = {
  placeBet,
  settleMatchBets,
};
