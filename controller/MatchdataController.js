const Bet = require("../models/MatchdataModel");
const User = require("../models/user");
const axios = require("axios");

const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

// 1️⃣ Place a Bet
const placeBet = async (req, res) => {
  try {
    const { userId, matchId, teamId, marketType, betType, odds, amount } = req.body;

    // Basic validation
    if (!userId || !matchId || !teamId || !marketType || !betType || !odds || !amount) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (amount <= 0 || odds <= 1) {
      return res.status(400).json({ message: "Invalid bet amount or odds." });
    }

    if (user.money < amount) return res.status(400).json({ message: "Insufficient balance" });

    // Deduct and save
    user.money -= amount;
    await user.save();

    // Create and save the bet
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

    res.status(201).json({
      message: "Bet placed successfully",
      bet: newBet,
      newBalance: user.money,
    });
  } catch (err) {
    console.error("❌ Error placing bet:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 2️⃣ Settle Match Bets
const settleMatchBets = async (matchId) => {
  try {
    console.log("hello")
    if (!matchId) throw new Error("matchId is required to settle bets");

    const { data } = await axios.get(
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${matchId}?include=tosswon,winnerteam&api_token=${SPORTMONKS_API_TOKEN}`
    );

    console.log("data is ",data)
    if (!data || !data.data) {
      console.warn("⚠️ Invalid match data response");
      return { message: "Invalid match data" };
    }

    const matchData = data.data;
    console.log(matchData)
    const tossWinnerId = matchData.toss_won_team_id;
    console.log(tossWinnerId)
    const matchWinnerId = matchData.winner_team_id;

    const bets = await Bet.find({ matchId, resultChecked: false });

    if (!bets.length) {
      return { message: `ℹ️ No unsettled bets found for match ${matchId}` };
    }

    let settledCount = 0;
    const results = [];

    for (const bet of bets) {
      const user = await User.findById(bet.userId);
      if (!user) {
        console.warn(`⚠️ User not found for bet ID ${bet._id}`);
        continue;
      }

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
          console.warn(`⚠️ Unknown marketType "${bet.marketType}" for bet ID ${bet._id}`);
      }

      if (!canSettle) {
        console.log(`⏳ Skipping bet ID ${bet._id} – result for ${bet.marketType} not available yet`);
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

      results.push({
        betId: bet._id,
        userId: user._id,
        marketType: bet.marketType,
        betType: bet.betType,
        status: bet.status,
        winnings: isWin ? bet.amount * bet.odds : 0,
      });
    }

    return {
      message: `✅ Settled ${settledCount} bets for match ${matchId}`,
      results,
    };
  } catch (err) {
    console.error("❌ Error settling bets:", err.message);
    throw new Error("Failed to settle bets.");
  }
};

module.exports = {
  placeBet,
  settleMatchBets,
};
