const PlayerRunsBet = require("../models/PlayerRuns");
const User = require("../models/user");
const axios = require("axios");
const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

// 1️⃣ Place Player Runs Bet
const placePlayerRunsBet = async (req, res) => {
  try {
    const { userId, matchId, teamName, playerName, predictedRuns, betAmount } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < betAmount) return res.status(400).json({ message: "Insufficient balance" });

    user.money -= betAmount;
    await user.save();

    const newBet = new PlayerRunsBet({
      userId,
      matchId,
      teamName,
      playerName,
      predictedRuns,
      betAmount,
    });

    await newBet.save();

    res.status(201).json({ message: "Player Runs Bet placed successfully", bet: newBet });
  } catch (err) {
    console.error("Error placing player runs bet:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// 2️⃣ Settle Player Runs Bets
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
          b.team.name.toLowerCase() === bet.teamName.toLowerCase() &&
          b.batsman && b.batsman.fullname.toLowerCase() === bet.playerName.toLowerCase()
      );

      if (!playerStat) {
        console.log(`No batting data found for ${bet.playerName}`);
        continue;
      }

      const actualRuns = parseInt(playerStat.score, 10);

      const isWin = actualRuns === bet.predictedRuns;

      bet.isWon = isWin;

      if (isWin) {
        const payout = bet.betAmount * 2;
        bet.payoutAmount = payout;
        user.money += payout;
      }

      await bet.save();
      await user.save();
      settled++;
    }

    return {
      message: `✅ Settled ${settled} player runs bets for match ${matchId}`,
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
