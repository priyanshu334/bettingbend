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
const findUserByPhoneNumber = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid or missing phone number" });
    }

    const user = await User.findOne({ phone }).select("-password -__v");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Find User by Phone Error:", error);
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


// Add money to user account by phone number
const addMoney = async (req, res) => {
  try {
    const { phone, amount } = req.body;

    // Validate input
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid or missing phone number" });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount. Must be a positive number" });
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update balance
    user.money += amount;
    await user.save();

    res.status(200).json({ 
      message: "Money added successfully",
      newBalance: user.money
    });

  } catch (error) {
    console.error("Add Money Error:", error);
    res.status(500).json({ message: "Error adding money", error: error.message });
  }
};

// Withdraw money from user account by phone number
const withdrawMoney = async (req, res) => {
  try {
    const { phone, amount } = req.body;

    // Validate input
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid or missing phone number" });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount. Must be a positive number" });
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check sufficient balance
    if (user.money < amount) {
      return res.status(400).json({ 
        message: "Insufficient balance",
        currentBalance: user.money
      });
    }

    // Update balance
    user.money -= amount;
    await user.save();

    res.status(200).json({ 
      message: "Money withdrawn successfully",
      newBalance: user.money
    });

  } catch (error) {
    console.error("Withdraw Money Error:", error);
    res.status(500).json({ message: "Error withdrawing money", error: error.message });
  }
};

// Add these to your exports
// Get all users (for admin purposes)
const getAllUsers = async (req, res) => {
  try {
    // Check if the requester is an admin (you might want to add proper authorization)
    // For now, we'll just return all users
    
    const users = await User.find()
      .select("-password -__v")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ message: "Error retrieving users", error: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id).select("-password -__v");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Get User by ID Error:", error);
    res.status(500).json({ message: "Error retrieving user", error: error.message });
  }
};

// Add these to your exports
module.exports = {
  signup,
  login,
  findUserByPhoneNumber,
  getUserBalance,
  addBetToHistory,
  getBetHistory,
  deleteUser,
  editUser,
  checkUserIdExists,
  addMoney,
  withdrawMoney,
  getAllUsers,       // Add this
  getUserById        // Add this
};