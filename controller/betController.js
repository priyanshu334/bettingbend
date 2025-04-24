const User = require("../models/user");
const Bets = require("../models/BetModel");

const placeBet = async (req, res) => {
  try {
    const { userId, amount, betTitle, selectedTeam, odds, won, creditedTo } = req.body;

    // Validate required fields
    if (!userId || !amount || !betTitle || !selectedTeam || !odds || typeof won !== "boolean" || !creditedTo) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate selectedTeam and creditedTo
    if (!["pink", "blue"].includes(selectedTeam)) {
      return res.status(400).json({ message: "Invalid selectedTeam" });
    }

    if (!["admin", "member"].includes(creditedTo)) {
      return res.status(400).json({ message: "Invalid creditedTo value" });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct amount from user balance
    user.money -= amount;
    await user.save();

    // Save bet to the database
    const bets = new Bets({
      userId,
      amount,
      betTitle,
      selectedTeam,
      odds,
      won,
      creditedTo
    });

    await bets.save();

    res.status(200).json({ message: "Bet placed successfully", bet });
  } catch (error) {
    console.error("Error placing bet:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  placeBet,
};
