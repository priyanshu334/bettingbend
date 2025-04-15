const User = require("../models/User");
const Admin = require("../models/Admin");
const Member = require("../models/Member");

const placeBet = async (req, res) => {
  try {
    const { userId, amount, betTitle, selectedTeam, odds, won, creditedTo } = req.body;

    if (!userId || !amount || !betTitle || !selectedTeam || !odds || typeof won !== "boolean" || !creditedTo) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct bet amount
    user.money -= amount;
    await user.save();

    // Handle winnings
    if (won) {
      const winnings = amount * parseFloat(odds);

      if (creditedTo === "admin") {
        const admin = await Admin.findOne();
        if (!admin) return res.status(404).json({ message: "Admin not found" });
        admin.money += winnings;
        await admin.save();
      } else if (creditedTo === "member") {
        const member = await Member.findOne({ referralCode: user.referralCode });
        if (!member) return res.status(404).json({ message: "Member not found for referralCode" });
        member.money += winnings;
        await member.save();
      } else {
        return res.status(400).json({ message: "Invalid creditedTo field" });
      }
    }

    res.status(200).json({ message: "Bet placed successfully" });
  } catch (error) {
    console.error("Error placing bet:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  placeBet,
};
