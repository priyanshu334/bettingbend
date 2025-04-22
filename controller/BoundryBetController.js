const BoundaryBet = require("../models/BoundryBet");
const User = require("../models/user");
const axios = require("axios");
const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

const placeBoundaryBet = async (req, res) => {
  try {
    const { userId, matchId, teamName, playerName, predictedBoundaries, betAmount } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < betAmount) return res.status(400).json({ message: "Insufficient balance" });

    // Deduct money
    user.money -= betAmount;
    await user.save();

    // Save bet
    const newBet = new BoundaryBet({
      userId,
      matchId,
      teamName,
      playerName,
      predictedBoundaries,
      betAmount,
    });

    await newBet.save();

    res.status(201).json({ message: "Boundary bet placed successfully", bet: newBet });
  } catch (err) {
    console.error("Error placing boundary bet:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const settleBoundaryBets = async (fixtureId, matchId) => {
  try {
    const { data } = await axios.get(
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureId}?include=batting&api_token=${SPORTMONKS_API_TOKEN}`
    );

    const playerStats = data.data.batting;

    const bets = await BoundaryBet.find({ matchId, resultChecked: false });

    let settled = 0;

    for (const bet of bets) {
      const user = await User.findById(bet.userId);
      if (!user) continue;

      const player = playerStats.find(
        (p) =>
          p.team.name.toLowerCase() === bet.teamName.toLowerCase() &&
          p.batsman && p.batsman.fullname.toLowerCase() === bet.playerName.toLowerCase()
      );

      if (!player) {
        console.log(`Player stats not found for ${bet.playerName}`);
        continue;
      }

      const boundariesHit = (player.fours || 0) + (player.sixes || 0);
      const isWin = boundariesHit >= bet.predictedBoundaries;

      bet.isWon = isWin;
      bet.resultChecked = true;
      bet.status = isWin ? 'won' : 'lost';

      if (isWin) {
        const payout = bet.betAmount * 2; // or some multiplier
        bet.payoutAmount = payout;
        user.money += payout;
        await user.save();
      }

      await bet.save();
      settled++;
    }

    return { message: `✅ Settled ${settled} boundary bets for match ${matchId}` };
  } catch (err) {
    console.error("❌ Error settling boundary bets:", err.message);
    throw new Error("Failed to settle boundary bets.");
  }
};

module.exports = {
  placeBoundaryBet,
  settleBoundaryBets,
};
