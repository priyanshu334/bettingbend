const MatchRunsWickets = require("../models/MatchRunsWiicketsModel");
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

    if (
      !userId || !matchId || !marketType || !betCondition ||
      !odds || !amount || isNaN(odds) || isNaN(amount)
    ) {
      return res.status(400).json({ message: "Missing or invalid required fields" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const validMarketTypes = ["tied", "match", "toss", "runs", "wickets", "fours", "sixes"];
    if (!validMarketTypes.includes(marketType)) {
      return res.status(400).json({ message: `Invalid marketType: ${marketType}` });
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
const settleMatchBets = async (matchId) => {
  try {
    if (!matchId) {
      throw new Error("Match ID is required for settling bets");
    }

    const { data } = await axios.get(
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${matchId}?include=tosswon,winner,runs&api_token=${SPORTMONKS_API_TOKEN}`
    );

    const matchData = data.data;
    if (!matchData) {
      throw new Error("No match data found");
    }

    const tossWinnerId = matchData.tosswon_id;
    const matchWinnerId = matchData.winner_team_id;
    const runsStats = Array.isArray(matchData.runs) ? matchData.runs : [];

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

      const teamRunStat = runsStats.find(stat => stat.team_id === bet.teamId);
      const statValue =
        teamRunStat && bet.marketType === "runs" ? teamRunStat.score :
        teamRunStat && bet.marketType === "wickets" ? teamRunStat.wickets :
        teamRunStat && bet.marketType === "fours" ? teamRunStat.fours :
        teamRunStat && bet.marketType === "sixes" ? teamRunStat.sixes :
        null;

      switch (bet.marketType) {
        case "tied":
          canSettle = matchWinnerId !== undefined;
          isWin = matchWinnerId === null && bet.betCondition === "true";
          break;

        case "match":
          if (matchWinnerId && bet.teamId) {
            canSettle = true;
            isWin =
              (bet.betCondition === "true" && bet.teamId === matchWinnerId) ||
              (bet.betCondition === "false" && bet.teamId !== matchWinnerId);
          }
          break;

        case "toss":
          if (tossWinnerId && bet.teamId) {
            canSettle = true;
            isWin =
              (bet.betCondition === "true" && bet.teamId === tossWinnerId) ||
              (bet.betCondition === "false" && bet.teamId !== tossWinnerId);
          }
          break;

        case "runs":
        case "wickets":
        case "fours":
        case "sixes":
          if (typeof statValue === "number" && typeof bet.overs === "number") {
            canSettle = true;
            const threshold = Number(bet.overs); // Using `overs` as threshold
            isWin =
              (bet.betCondition === "true" && statValue >= threshold) ||
              (bet.betCondition === "false" && statValue < threshold);
          }
          break;

        default:
          console.warn(`⚠️ Unknown marketType: ${bet.marketType}`);
      }

      if (!canSettle) {
        console.log(`⏳ Skipping bet (${bet._id}) – cannot be settled yet`);
        continue;
      }

      bet.status = isWin ? "won" : "lost";
      bet.resultChecked = true;
      await bet.save();

      if (isWin) {
        const winnings = bet.amount * 2;
        user.money += winnings;
        await user.save();
      }

      settledCount++;
    }

    return {
      message: `✅ Settled ${settledCount} bets for match ${matchId}`,
    };
  } catch (err) {
    console.error("❌ Error settling match bets:", err.message);
    throw new Error("Failed to settle match bets");
  }
};

module.exports = {
  placeBet,
  settleMatchBets,
};
