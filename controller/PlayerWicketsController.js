const PlayerWicketsBet = require("../models/PlayerWickets");
const User = require("../models/user");
const axios = require("axios");
const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

// 1️⃣ Place Wicket Bet
const placePlayerWicketsBet = async (req, res) => {
  try {
    const { userId, matchId, playerName, predictedWickets, betAmount } = req.body;

    // Validation
    if (!userId || !matchId || !playerName || predictedWickets === undefined || betAmount === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (typeof predictedWickets !== "number" || predictedWickets < 0) {
      return res.status(400).json({ message: "Invalid predictedWickets value" });
    }

    if (typeof betAmount !== "number" || betAmount <= 0) {
      return res.status(400).json({ message: "Invalid bet amount" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < betAmount) return res.status(400).json({ message: "Insufficient balance" });

    // Optional: Prevent duplicate bets on same player/match
    const existingBet = await PlayerWicketsBet.findOne({ userId, matchId, playerName });
    if (existingBet) return res.status(409).json({ message: "You already placed a bet on this player for this match" });

    user.money -= betAmount;
    await user.save();

    const newBet = new PlayerWicketsBet({
      userId,
      matchId: Number(matchId),
      playerName: playerName.trim(),
      predictedWickets,
      betAmount,
    });

    await newBet.save();

    res.status(201).json({ 
      message: "Player Wickets Bet placed successfully", 
      bet: newBet, 
      newBalance: user.money 
    });
  } catch (err) {
    console.error("❌ Error placing player wickets bet:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


// 2️⃣ Settle Player Wickets Bets
const settlePlayerWicketsBets = async (matchId) => {
  try {
    if (!matchId) throw new Error("Match ID is required to settle bets");

    const { data } = await axios.get(
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${matchId}?include=bowling&api_token=${SPORTMONKS_API_TOKEN}`
    );

    const bowlingStats = data?.data?.bowling;
    if (!Array.isArray(bowlingStats)) {
      console.warn("⚠️ No valid bowling stats found from API response");
      return { message: `No valid bowling data available for match ${matchId}` };
    }

    const bets = await PlayerWicketsBet.find({ matchId: Number(matchId), isWon: null });

    if (!bets.length) {
      return { message: `No unsettled player wickets bets for match ${matchId}` };
    }

    let settled = 0;

    for (const bet of bets) {
      const user = await User.findById(bet.userId);
      if (!user) {
        console.warn(`User not found for bet ID: ${bet._id}`);
        continue;
      }

      const playerStat = bowlingStats.find(
        (b) => b?.bowler?.fullname?.toLowerCase() === bet.playerName.toLowerCase()
      );

      if (!playerStat) {
        console.log(`⛔ No bowling data found for ${bet.playerName}`);
        continue;
      }

      const actualWickets = parseInt(playerStat?.wickets, 10) || 0;
      const isWin = actualWickets === bet.predictedWickets;

      bet.isWon = isWin;
      bet.actualWickets = actualWickets;

      if (isWin) {
        const payout = bet.betAmount * 2;
        bet.payoutAmount = payout;
        user.money += payout;
      } else {
        bet.payoutAmount = 0;
      }

      await bet.save();
      await user.save();
      settled++;
    }

    return {
      message: `✅ Settled ${settled} player wickets bets for match ${matchId}`,
    };
  } catch (err) {
    console.error("❌ Error settling player wickets bets:", err.message);
    throw new Error("Failed to settle player wickets bets.");
  }
};


module.exports = {
  placePlayerWicketsBet,
  settlePlayerWicketsBets,
};
