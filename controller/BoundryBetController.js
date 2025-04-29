const BoundaryBet = require("../models/BoundryBet");
const User = require("../models/user");
const axios = require("axios");

const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

// 1️⃣ Place a Boundary Bet
const placeBoundaryBet = async (req, res) => {
  try {
    const { userId, matchId, playerId, playerName, predictedBoundaries, betAmount } = req.body;

    if (!userId || !matchId || !playerId || !playerName || predictedBoundaries == null || betAmount == null) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < betAmount) return res.status(400).json({ message: "Insufficient balance" });

    // Deduct money from user
    user.money -= betAmount;
    await user.save();

    // Create and save the new bet
    const newBet = new BoundaryBet({
      userId,
      matchId,
      playerId,
      playerName: playerName.trim(),
      predictedBoundaries,
      betAmount,
    });
    console.log(newBet)

    await newBet.save();

    res.status(201).json({ message: "Boundary bet placed successfully", bet: newBet });
  } catch (err) {
    console.error("🚨 Error placing boundary bet:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 2️⃣ Settle Boundary Bets
const settleBoundaryBets = async (matchId) => {
  try {
    if (!matchId) throw new Error("Match ID is required");

    const { data } = await axios.get(
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${matchId}?include=batting&api_token=${SPORTMONKS_API_TOKEN}`
    );

    const battingStats = data?.data?.batting;
    if (!battingStats || !Array.isArray(battingStats)) {
      throw new Error("Batting stats not available for the match");
    }

    const bets = await BoundaryBet.find({ matchId, resultChecked: false });
    let settled = 0;

    for (const bet of bets) {
      const user = await User.findById(bet.userId);
      if (!user) {
        console.warn(`User not found for bet ID ${bet._id}`);
        continue;
      }

      console.log(bets)
      console.log("battingstats are ",battingStats)
      const player = battingStats.find(
        (b) => b.player_id.toString() === bet.playerId.toString()
        
      );

      if (!player) {
        console.warn(`Player stats not found for playerId ${bet.playerId}`);
        continue;
      }

      const boundariesHit = (player.fours || 0) + (player.sixes || 0);
      const isWin = boundariesHit >= bet.predictedBoundaries;

      bet.isWon = isWin;
      bet.resultChecked = true;
      bet.status = isWin ? "won" : "lost";
      bet.actualBoundaries = boundariesHit;
      bet.settledAt = new Date();

      if (isWin) {
        const payout = bet.betAmount * 2;
        bet.payoutAmount = payout;
        user.money += payout;
        await user.save();
      }

      await bet.save();
      settled++;
    }

    return {
      message: `✅ Settled ${settled} boundary bets for match ${matchId}`,
    };
  } catch (err) {
    console.error("❌ Error settling boundary bets:", err);
    throw new Error("Failed to settle boundary bets.");
  }
};

module.exports = {
  placeBoundaryBet,
  settleBoundaryBets,
};
