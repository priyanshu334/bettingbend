const RunsAndWickets = require("../models/MatchRunsWiicketsModel");
const User = require("../models/user");
const axios = require("axios");

const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

// 1️⃣ Place a Bet

const placeBet = async (req, res) => {
  try {
    const {
      userId,
      matchId,
      teamId, // Optional field
      marketType,
      betCondition,
      overs,
      statType, // Optional field
      odds,
      amount
    } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check balance
    if (user.money < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct bet amount
    user.money -= amount;
    await user.save();

    // Create and save bet
    const newBet = new RunsAndWickets({
      userId,
      matchId: Number(matchId),
      teamId: teamId ? Number(teamId) : undefined,  // Optional teamId
      marketType,
      betCondition,
      overs: overs ? Number(overs) : undefined,  // Optional overs
      statType,
      odds,
      amount
    });

    await newBet.save();

    res.status(201).json({
      message: "Bet placed successfully",
      bet: newBet
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
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureId}?include=tosswon,winner&api_token=${SPORTMONKS_API_TOKEN}`
    );

    const matchData = data.data;
    const tossWinnerId = matchData.tosswon_id;
    const matchWinnerId = matchData.winner_team_id;

    const allUnsettledBets = await RunsAndWickets.find({
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
        case "toss":
          if (tossWinnerId !== null && tossWinnerId !== undefined) {
            canSettle = true;
            isWin = bet.betCondition === tossWinnerId.toString();
          }
          break;

        case "match_odds":
        case "winner":
          if (matchWinnerId !== null && matchWinnerId !== undefined) {
            canSettle = true;
            isWin = bet.betCondition === matchWinnerId.toString();
          }
          break;

        // Handle the new bet types
        case "runs_at_over":
        case "wickets_at_over":
          // Logic to settle bets based on specific overs data
          // For example, match data can provide runs at specific overs
          // You will need to fetch overs data and compare it with betCondition
          break;

        case "total_match_runs":
        case "total_match_wickets":
        case "total_match_4s":
        case "total_match_6s":
          // Logic to settle bets based on total match statistics
          // For example, fetching total runs, wickets, etc., and comparing it with betCondition
          break;

        default:
          console.warn(`⚠️ Unknown or unsupported marketType: ${bet.marketType}`);
      }

      if (!canSettle) {
        console.log(`⏳ Skipping bet (${bet.marketType}) – result not available yet`);
        continue;
      }

      // Settle bet
      bet.status = isWin ? "won" : "lost";
      bet.resultChecked = true;
      await bet.save();

      // If user wins, update balance
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
