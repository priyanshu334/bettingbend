const BowlerRunsBet = require("../models/BowlerRunsBet");
const User = require("../models/user");
const axios = require("axios");
const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

// 1️⃣ Place a Bowler Runs Bet
const placeBowlerRunsBet = async (req, res) => {
  try {
    const { userId, matchId, teamName, bowlerName, predictedRunsConceded, betAmount } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < betAmount) return res.status(400).json({ message: "Insufficient balance" });

    user.money -= betAmount;
    await user.save();

    const newBet = new BowlerRunsBet({
      userId,
      matchId,
      teamName,
      bowlerName,
      predictedRunsConceded,
      betAmount,
    });

    await newBet.save();

    res.status(201).json({ message: "Bowler Runs Bet placed successfully", bet: newBet });
  } catch (err) {
    console.error("Error placing bowler runs bet:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// 2️⃣ Settle Bowler Runs Bets
const settleBowlerRunsBets = async (fixtureId, matchId) => {
  try {
    const { data } = await axios.get(
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureId}?include=bowling,team,stage,scoreboards&api_token=${SPORTMONKS_API_TOKEN}`
    );

    const matchData = data.data;
    const bowlerStats = matchData.bowling;

    const bets = await BowlerRunsBet.find({ matchId, isWon: null });

    let settled = 0;

    for (const bet of bets) {
      const user = await User.findById(bet.userId);
      if (!user) continue;

      const bowler = bowlerStats.find(
        (b) =>
          b.team.name.toLowerCase() === bet.teamName.toLowerCase() &&
          b.bowler && b.bowler.fullname.toLowerCase() === bet.bowlerName.toLowerCase()
      );

      if (!bowler) {
        console.log(`Bowler stats not found for ${bet.bowlerName}`);
        continue;
      }

      const runsConceded = bowler.rate * bowler.overs; // OR use bowler.runs if available

      const isWin = Math.round(runsConceded) === bet.predictedRunsConceded;

      bet.isWon = isWin;

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
    throw new Error("Failed to settle bowler runs bets.");
  }
};

module.exports = {
  placeBowlerRunsBet,
  settleBowlerRunsBets,
};
