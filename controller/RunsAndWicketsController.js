const MatchRunsWickets = require("../models/MatchRunsWiicketsModel"); // ✅ Corrected model name and import
const User = require("../models/user");
const axios = require("axios");

const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

// 1️⃣ Place a Bet
const placeBet = async (req, res) => {
  try {
    const {
      userId,
      matchId,
      teamId,
      marketType,
      betCondition,
      overs,
      statType,
      odds,
      amount,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    user.money -= amount;
    await user.save();

    const newBet = new MatchRunsWickets({
      userId,
      matchId: Number(matchId),
      teamId: teamId ? Number(teamId) : undefined,
      marketType,
      betCondition,
      overs,
      statType,
      odds,
      amount,
    });

    await newBet.save();

    res.status(201).json({
      message: "Bet placed successfully",
      bet: newBet,
    });
  } catch (err) {
    console.error("Error placing bet:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2️⃣ Settle Match Bets
const settleMatchBets = async (fixtureId, matchId) => {
  try {
    const { data } = await axios.get(
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureId}?include=tosswon,winner,runs&api_token=${SPORTMONKS_API_TOKEN}`
    );

    const matchData = data.data;
    const tossWinnerId = matchData.tosswon_id;
    const matchWinnerId = matchData.winner_team_id;
    const runsStats = matchData.runs || [];

    const allUnsettledBets = await MatchRunsWickets.find({
      matchId: Number(matchId),
      resultChecked: false,
    });

    let settledCount = 0;

    for (const bet of allUnsettledBets) {
      const user = await User.findById(bet.userId);
      if (!user) continue;

      let isWin = false;
      let canSettle = false;

      switch (bet.marketType) {
        case "tied":
          canSettle = matchWinnerId !== null;
          isWin = matchWinnerId === null && bet.betCondition === "true";
          break;

        case "match":
          if (matchWinnerId !== null && bet.teamId !== undefined) {
            canSettle = true;
            isWin =
              (bet.betCondition === "true" && bet.teamId === matchWinnerId) ||
              (bet.betCondition === "false" && bet.teamId !== matchWinnerId);
          }
          break;

        case "toss":
          if (tossWinnerId !== null && bet.teamId !== undefined) {
            canSettle = true;
            isWin =
              (bet.betCondition === "true" && bet.teamId === tossWinnerId) ||
              (bet.betCondition === "false" && bet.teamId !== tossWinnerId);
          }
          break;

        case "runs":
        case "wickets":
        case "fours":
        case "sixes": {
          // Replace this with real logic from `runsStats`
          const statValue = 200; // ⛔ Placeholder
          if (typeof statValue === "number") {
            canSettle = true;
            isWin = (bet.betCondition === "true" && statValue >= 100) ||
                    (bet.betCondition === "false" && statValue < 100);
          }
          break;
        }

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
        await user.save();
      }

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
