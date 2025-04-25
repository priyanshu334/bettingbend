// controllers/playerRunsController.js

const PlayerRunsBet = require('../models/PlayerRuns.js');
const User = require('../models/user.js');
const axios = require('axios');
require('dotenv').config();

const { SPORTMONKS_API_TOKEN } = process.env;

// 1️⃣ Place Bet
const placePlayerRunsBet = async (req, res) => {
  try {
    const { userId, matchId, playerId, playerName, betType, amount, odds } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.money < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    user.money -= amount;
    await user.save();

    const newBet = new PlayerRunsBet({
      userId,
      matchId,
      playerId,
      playerName,
      betType,
      odds,
      betAmount: amount,
    });

    await newBet.save();

    res.status(201).json({
      message: "Bet placed successfully",
      newBalance: user.money,
    });
  } catch (err) {
    console.error("Error placing bet:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// 2️⃣ Settle Bets
const settlePlayerRunsBets = async (matchId) => {
  try {
    const { data } = await axios.get(
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${matchId}?include=batting&api_token=${SPORTMONKS_API_TOKEN}`
    );

    const battingStats = data.data.batting;
    const bets = await PlayerRunsBet.find({ matchId, isWon: null });

    let settled = 0;
    const results = [];

    for (const bet of bets) {
      const user = await User.findById(bet.userId);
      if (!user) continue;

      const playerStat = battingStats.find(
        (b) => b.player_id === bet.playerId
      );

      if (!playerStat) {
        console.log(`No data for player ID ${bet.playerId}`);
        continue;
      }

      // Skip if player is still not out
      if (playerStat.result && playerStat.result.toLowerCase() === "not out") {
        console.log(`⏳ Player ${bet.playerId} is still not out. Skipping...`);
        continue;
      }

      const actualRuns = parseInt(playerStat.score, 10);
      const predictedThreshold = parseInt(bet.betType.replace("+", ""), 10);
      const isWin = actualRuns >= predictedThreshold;

      bet.isWon = isWin;

      if (isWin) {
        const payout = bet.betAmount * 2;
        bet.payoutAmount = payout;
        user.money += payout;
        results.push({
          userId: user._id,
          playerId: bet.playerId,
          actualRuns,
          predictedThreshold,
          result: "🏆 User won the bet!",
        });
      } else {
        results.push({
          userId: user._id,
          playerId: bet.playerId,
          actualRuns,
          predictedThreshold,
          result: "😞 User lost the bet.",
        });
      }

      await bet.save();
      await user.save();
      settled++;
    }

    return {
      message: `✅ Settled ${settled} player runs bets for match ${matchId}`,
      results,
    };
  } catch (err) {
    console.error("❌ Error settling player runs bets:", err.message);
    throw new Error("Failed to settle player runs bets.");
  }
};

module.exports = {
  placePlayerRunsBet,
  settlePlayerRunsBets,
};
