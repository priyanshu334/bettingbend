const User = require("../models/user");
const Bets = require("../models/BetModel");

const placeBet = async (req, res) => {
  try {
    const { userId, amount, betTitle, selectedTeam, odds, won } = req.body;

    // Validate required fields
    if (!userId || !amount || !betTitle || !selectedTeam || !odds || typeof won !== "boolean") {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate selectedTeam
    if (!["pink", "blue"].includes(selectedTeam)) {
      return res.status(400).json({ message: "Invalid selectedTeam" });
    }

    const user = await User.findById( userId );
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct amount from user balance
    user.money -= amount;
    await user.save();

    // Save bet to the database
    const bet = new Bets({
      userId,
      amount,
      betTitle,
      selectedTeam,
      odds,
      won
    });

    await bet.save();

    res.status(200).json({ message: "Bet placed successfully", bet });
  } catch (error) {
    console.error("Error placing bet:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🆕 Fetch all bets by a user
const getUserBets = async (req, res) => {
  try {
    const { userId } = req.params;

    const bets = await Bets.find( {userId }).sort({ timestamp: -1 });

    res.status(200).json({ bets });
  } catch (error) {
    console.error("Error fetching user bets:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  placeBet,
  getUserBets,
};
