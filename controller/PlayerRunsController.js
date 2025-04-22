const PlayerRunsBet = require("../models/PlayerRuns");
const User = require("../models/user");
const axios = require("axios");

const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

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
const settlePlayerRunsBets = async (fixtureId, matchId) => {
  try {
    const { data } = await axios.get(
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureId}?include=batting&api_token=${SPORTMONKS_API_TOKEN}`
    );

    const battingStats = data.data.batting;
    const bets = await PlayerRunsBet.find({ matchId, isWon: null });

    let settled = 0;

    for (const bet of bets) {
      const user = await User.findById(bet.userId);
      if (!user) continue;

      const playerStat = battingStats.find(
        (b) =>
          b.batsman &&
          b.batsman.id === bet.playerId // match by ID for accuracy
      );

      if (!playerStat) {
        console.log(`No data for player ID ${bet.playerId}`);
        continue;
      }

      const actualRuns = parseInt(playerStat.score, 10);
      const predictedThreshold = parseInt(bet.betType.replace("+", ""), 10); // "50+" → 50

      const isWin = actualRuns >= predictedThreshold;

      bet.isWon = isWin;

      if (isWin) {
        const payout = bet.betAmount * bet.odds;
        bet.payoutAmount = payout;
        user.money += payout;
      }

      await bet.save();
      await user.save();
      settled++;
    }

    return { message: `✅ Settled ${settled} player runs bets for match ${matchId}` };
  } catch (err) {
    console.error("❌ Error settling player runs bets:", err.message);
    throw new Error("Failed to settle player runs bets.");
  }
};

module.exports = {
  placePlayerRunsBet,
  settlePlayerRunsBets,
};
