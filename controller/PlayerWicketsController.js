const PlayerWicketsBet = require("../models/PlayerWicketsBet");
const User = require("../models/user");
const axios = require("axios");
const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

// 1️⃣ Place Wicket Bet
const placePlayerWicketsBet = async (req, res) => {
  try {
    const { userId, matchId, teamName, playerName, predictedWickets, betAmount } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < betAmount) return res.status(400).json({ message: "Insufficient balance" });

    user.money -= betAmount;
    await user.save();

    const newBet = new PlayerWicketsBet({
      userId,
      matchId,
      teamName,
      playerName,
      predictedWickets,
      betAmount,
    });

    await newBet.save();

    res.status(201).json({ message: "Player Wickets Bet placed successfully", bet: newBet });
  } catch (err) {
    console.error("Error placing player wickets bet:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// 2️⃣ Settle Player Wickets Bets
const settlePlayerWicketsBets = async (fixtureId, matchId) => {
  try {
    const { data } = await axios.get(
      `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureId}?include=bowling&api_token=${SPORTMONKS_API_TOKEN}`
    );

    const bowlingStats = data.data.bowling;
    const bets = await PlayerWicketsBet.find({ matchId, isWon: null });

    let settled = 0;

    for (const bet of bets) {
      const user = await User.findById(bet.userId);
      if (!user) continue;

      const playerStat = bowlingStats.find(
        (b) =>
          b.team.name.toLowerCase() === bet.teamName.toLowerCase() &&
          b.bowler && b.bowler.fullname.toLowerCase() === bet.playerName.toLowerCase()
      );

      if (!playerStat) {
        console.log(`No bowling data found for ${bet.playerName}`);
        continue;
      }

      const actualWickets = parseInt(playerStat.wickets, 10);

      const isWin = actualWickets === bet.predictedWickets;

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
