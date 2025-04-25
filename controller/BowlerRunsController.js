const BowlerRunsBet = require("../models/BowlerRuns");
const User = require("../models/user");
const axios = require("axios");
const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

// 1️⃣ Place a Bowler Runs Bet
const placeBowlerRunsBet = async (req, res) => {
  try {
    const { userId, matchId, bowlerName, predictedRunsConceded, betAmount } = req.body;

    // Validate input
    if (!userId || !matchId || !bowlerName || predictedRunsConceded == null || betAmount == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (betAmount <= 0) {
      return res.status(400).json({ message: "Bet amount must be greater than zero" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < betAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Save the bet
    user.money -= betAmount;
    await user.save();

    const newBet = new BowlerRunsBet({
      userId,
      matchId,
      bowlerName,
      predictedRunsConceded,
      betAmount,
    });

    await newBet.save();

    res.status(201).json({ message: "Bowler Runs Bet placed successfully", bet: newBet });
  } catch (err) {
    console.error("❌ Error placing bowler runs bet:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 2️⃣ Settle Bowler Runs Bets
const settleBowlerRunsBets = async (matchId) => {
  try {
    if (!matchId) throw new Error("Match ID is required");

    const { data } = await axios.get(
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${matchId}?include=bowling&api_token=${SPORTMONKS_API_TOKEN}`
    );

    const matchData = data?.data;
    const bowlerStats = matchData?.bowling;

    if (!bowlerStats || !Array.isArray(bowlerStats)) {
      throw new Error("Bowling data not available");
    }

    const bets = await BowlerRunsBet.find({ matchId, isWon: null });

    let settled = 0;

    for (const bet of bets) {
      const user = await User.findById(bet.userId);
      if (!user) {
        console.warn(`⚠️ User not found for bet ${bet._id}`);
        continue;
      }

      const bowler = bowlerStats.find(
        (b) =>
          b?.bowler?.fullname?.toLowerCase?.() === bet.bowlerName.toLowerCase()
      );

      if (!bowler || typeof bowler.runs !== "number") {
        console.warn(`⚠️ No stats found for bowler "${bet.bowlerName}" in match ${matchId}`);
        bet.betStatus = "void";
        bet.settledAt = new Date();
        await bet.save();

        // Refund the user
        user.money += bet.betAmount;
        await user.save();
        continue;
      }

      const runsConceded = Math.round(bowler.runs);
      const isWin = runsConceded === bet.predictedRunsConceded;

      bet.isWon = isWin;
      bet.settledAt = new Date();
      bet.actualRunsConceded = runsConceded;
      bet.betStatus = isWin ? "won" : "lost";

      if (isWin) {
        const winnings = bet.betAmount * 2;
        bet.payoutAmount = winnings;
        user.money += winnings;
      }

      await bet.save();
      await user.save();
      settled++;
    }

    return {
      message: `✅ Settled ${settled} bowler runs bets for match ${matchId}`,
    };
  } catch (err) {
    console.error("❌ Error settling bowler runs bets:", err.message);
    throw new Error("Failed to settle bowler runs bets. Please check logs.");
  }
};

module.exports = {
  placeBowlerRunsBet,
  settleBowlerRunsBets,
};
