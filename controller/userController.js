const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("../models/user");
const Admin = require("../models/admin");
const Member = require("../models/member");

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// User Signup
const signup = async (req, res) => {
  try {
    const { fullName, phone, password, referralCode } = req.body;

    // Check if phone number is already registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ message: "Phone number already registered" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with additional fields
    const newUser = new User({
      fullName,
      phone,
      password: hashedPassword,
      referralCode: referralCode || null,
      money: 0,
      totalBets: 0,
      betHistory: []
    });

    await newUser.save();

    // Apply referral bonus if referral code exists
    if (referralCode) {
      await applyReferralBonus(referralCode, newUser._id);
    }

    res.status(201).json({ 
      message: "User registered successfully", 
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        phone: newUser.phone,
        money: newUser.money
      }
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(400).json({ message: "Invalid input", error: error.message });
  }
};

// User Login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "Invalid phone number or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid phone number or password" });
    }

    // Include MongoDB _id and role in the token payload
    const tokenPayload = {
      id: user._id,
      role: 'user'
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

    res.json({ 
      message: "Login successful", 
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        money: user.money
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(400).json({ message: "Invalid input", error: error.message });
  }
};

// Find User by ID
const findUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id).select("-password -__v");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Find User Error:", error);
    res.status(500).json({ message: "Error retrieving user", error: error.message });
  }
};

// Get user balance by ID
const getUserBalance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id).select("money");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ balance: user.money });
  } catch (error) {
    console.error("Get User Balance Error:", error);
    res.status(500).json({ message: "Error retrieving user balance", error: error.message });
  }
};

// Add bet to user history
const addBetToHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { player, odds, amount, result, winnings } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (!player || !odds || typeof amount !== 'number' || !result || typeof winnings !== 'number') {
      return res.status(400).json({ message: "Invalid bet data provided" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.betHistory.push({
      player,
      odds,
      amount,
      result,
      winnings
      // createdAt will be added automatically by the schema
    });

    user.totalBets += amount;
    await user.save();

    res.json({ message: "Bet added to history successfully" });
  } catch (error) {
    console.error("Add Bet Error:", error);
    res.status(500).json({ message: "Error adding bet to history", error: error.message });
  }
};

// Get user bet history
const getBetHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id)
      .select("betHistory totalBets")
      .sort({ "betHistory.createdAt": -1 });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      totalBets: user.totalBets,
      betHistory: user.betHistory
    });
  } catch (error) {
    console.error("Get Bet History Error:", error);
    res.status(500).json({ message: "Error retrieving bet history", error: error.message });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

// Edit User
const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Prevent changing critical fields
    delete updateData.password;
    delete updateData.money;
    delete updateData.totalBets;
    delete updateData.betHistory;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ 
      message: "User updated successfully", 
      user: updatedUser 
    });
  } catch (error) {
    console.error("Edit User Error:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation Error", errors: error.errors });
    }
    res.status(400).json({ message: "Error updating user", error: error.message });
  }
};

// Check if User ID exists
const checkUserIdExists = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ exists: false, message: "Invalid user ID format" });
    }

    const userExists = await User.exists({ _id: id });

    res.status(200).json({ exists: !!userExists });
  } catch (error) {
    console.error("Check User ID Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add money to user account
const addMoneyToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $inc: { money: depositAmount } },
      { new: true }
    ).select("money");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      message: "Money added successfully", 
      updatedBalance: updatedUser.money 
    });
  } catch (error) {
    console.error("Add Money Error:", error);
    res.status(500).json({ message: "Error adding money", error: error.message });
  }
};

// Deduct money from user account
const deductMoneyFromUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return res.status(400).json({ message: "Invalid withdrawal amount" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, money: { $gte: withdrawalAmount } },
      { $inc: { money: -withdrawalAmount } },
      { new: true }
    ).select("money");

    if (!updatedUser) {
      const userExists = await User.exists({ _id: id });
      if (!userExists) {
        return res.status(404).json({ message: "User not found" });
      } else {
        return res.status(400).json({ message: "Insufficient balance" });
      }
    }

    res.json({ 
      message: "Money deducted successfully", 
      updatedBalance: updatedUser.money 
    });
  } catch (error) {
    console.error("Deduct Money Error:", error);
    res.status(500).json({ message: "Error deducting money", error: error.message });
  }
};

// Transfer money from user to admin
const transferToAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, adminId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ message: "Invalid transfer amount" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOneAndUpdate(
        { _id: id, money: { $gte: transferAmount } },
        { $inc: { money: -transferAmount } },
        { new: true, session }
      );

      if (!user) {
        await session.abortTransaction();
        session.endSession();
        const userExists = await User.exists({ _id: id });
        if (!userExists) return res.status(404).json({ message: "Sender user not found" });
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const admin = await Admin.findByIdAndUpdate(
        adminId,
        { $inc: { money: transferAmount } },
        { new: true, session }
      );

      if (!admin) {
        await session.abortTransaction();
        session.endSession();
        await User.updateOne({ _id: id }, { $inc: { money: transferAmount } });
        return res.status(404).json({ message: "Recipient Admin not found" });
      }

      await session.commitTransaction();
      session.endSession();

      res.json({
        message: "Money transferred to admin successfully",
        userBalance: user.money,
        adminBalance: admin.money
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transfer to Admin Transaction Error:", error);
      res.status(500).json({ message: "Transaction failed during transfer", error: error.message });
    }
  } catch (error) {
    console.error("Transfer to Admin Error:", error);
    res.status(500).json({ message: "Error initiating transfer", error: error.message });
  }
};

// Transfer money from user to member
const transferToMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, memberId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ message: "Invalid transfer amount" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOneAndUpdate(
        { _id: id, money: { $gte: transferAmount } },
        { $inc: { money: -transferAmount } },
        { new: true, session }
      );

      if (!user) {
        await session.abortTransaction();
        session.endSession();
        const userExists = await User.exists({ _id: id });
        if (!userExists) return res.status(404).json({ message: "Sender user not found" });
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const member = await Member.findByIdAndUpdate(
        memberId,
        { $inc: { money: transferAmount } },
        { new: true, session }
      );

      if (!member) {
        await session.abortTransaction();
        session.endSession();
        await User.updateOne({ _id: id }, { $inc: { money: transferAmount } });
        return res.status(404).json({ message: "Recipient Member not found" });
      }

      await session.commitTransaction();
      session.endSession();

      res.json({
        message: "Money transferred to member successfully",
        userBalance: user.money,
        memberBalance: member.money
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transfer to Member Transaction Error:", error);
      res.status(500).json({ message: "Transaction failed during transfer", error: error.message });
    }
  } catch (error) {
    console.error("Transfer to Member Error:", error);
    res.status(500).json({ message: "Error initiating transfer", error: error.message });
  }
};

// Internal function for referral bonus
const applyReferralBonus = async (referralCode, referredUserId) => {
  try {
    if (!referralCode || !referredUserId || referralCode === referredUserId.toString()) return;

    const bonusAmount = parseFloat(process.env.REFERRAL_BONUS_AMOUNT) || 100;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const referrer = await User.findOneAndUpdate(
        { _id: referralCode, _id: { $ne: referredUserId } },
        { $inc: { money: bonusAmount } },
        { new: true, session }
      );

      const referred = await User.findByIdAndUpdate(
        referredUserId,
        { $inc: { money: bonusAmount } },
        { new: true, session }
      );

      if (referrer && referred) {
        await session.commitTransaction();
        console.log(`Referral bonus of ${bonusAmount} applied to ${referrer._id} and ${referred._id}`);
      } else {
        await session.abortTransaction();
        if (!referrer) console.log(`Referrer (${referralCode}) not found or was same as referred user.`);
        if (!referred) console.log(`Referred user (${referredUserId}) not found during bonus application.`);
      }

      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error(`Referral Bonus Application Error for ${referredUserId} via ${referralCode || 'N/A'}:`, error.message);
  }
};

module.exports = {
  signup,
  login,
  findUserById,
  getUserBalance,
  addBetToHistory,
  getBetHistory,
  deleteUser,
  editUser,
  checkUserIdExists,
  addMoneyToUser,
  deductMoneyFromUser,
  transferToAdmin,
  transferToMember
};