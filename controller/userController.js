const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// User signup
const signup = async (req, res) => {
  try {
    const { fullName, phone, password, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      fullName,
      phone,
      password: hashedPassword,
      referralCode,
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      phone: newUser.phone,
      money: newUser.money,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      money: user.money,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the requesting user is the same as the user being deleted
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit user
const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, phone, password } = req.body;

    // Verify the requesting user is the same as the user being edited
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;
    if (phone) updateFields.phone = phone;

    // Handle password change if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Find user by phone number
const findUserByPhoneNumber = async (req, res) => {
  try {
    const { phone } = req.params;

    const user = await User.findOne({ phone }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if user ID exists
const checkUserIdExists = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("_id");
    if (!user) {
      return res.json({ exists: false });
    }

    res.json({ exists: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add money to user balance
const addMoneyByPhone = async (req, res) => {
  try {
    const { phone, amount } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Find user by phone number
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update balance
    user.money += numericAmount;
    await user.save();

    res.json({
      message: "Money added successfully",
      newBalance: user.money,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Withdraw money from user balance
const withdrawMoneyByPhone = async (req, res) => {
  try {
    const { phone, amount } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Find user by phone number
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check sufficient balance
    if (user.money < numericAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Update balance
    user.money -= numericAmount;
    await user.save();

    res.json({
      message: "Money withdrawn successfully",
      userBalance: user.money,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Add bet to user's history
const addBetToHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { player, odds, amount, result, winnings } = req.body;

    // Verify the requesting user is the same as the user being updated
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user's balance and total bets
    const update = {
      $push: {
        betHistory: {
          player,
          odds,
          amount,
          result,
          winnings,
        },
      },
      $inc: {
        money: result === "win" ? winnings : -amount,
        totalBets: amount,
      },
    };

    const updatedUser = await User.findByIdAndUpdate(userId, update, {
      new: true,
    }).select("-password");

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's bet history
const getBetHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the requesting user is the same as the user being queried
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(userId).select("betHistory");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.betHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user balance
const getUserBalance = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the requesting user is the same as the user being queried
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(userId).select("money");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ balance: user.money });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -betHistory");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the requesting user is the same as the user being queried
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    const { userId } = req.user; // Authenticated user
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old and new passwords are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  signup,
  login,
  deleteUser,
  editUser,
  findUserByPhoneNumber,
  checkUserIdExists,
  addMoneyByPhone,
  withdrawMoneyByPhone,
  addBetToHistory,
  getBetHistory,
  getUserBalance,
  getAllUsers,
  getUserById,
  changePassword, // <-- Add this line
};
