const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/user");
const Admin = require("../models/admin");
const Member = require("../models/member");

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// User Signup
const signup = async (req, res) => {
  try {
    const { userId, fullName, phone, password, referralCode } = req.body;

    // Check if phone number is already registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ message: "Phone number already registered" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      userId,
      fullName,
      phone,
      password: hashedPassword,
      referralCode: referralCode || null,
      money: 0, // Default balance
    });

    await newUser.save();
    
    // Apply referral bonus if referral code exists
    if (referralCode) {
      await applyReferralBonus(referralCode, userId);
    }

    res.status(201).json({ message: "User registered successfully", userId });
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

    const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(400).json({ message: "Invalid input", error: error.message });
  }
};

// Find User by ID
const findUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Find User Error:", error);
    res.status(500).json({ message: "Error retrieving user", error: error.message });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOneAndDelete({ userId });

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
    const { userId } = req.params;
    const updatedUser = await User.findOneAndUpdate({ userId }, req.body, { new: true });

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    console.error("Edit User Error:", error);
    res.status(400).json({ message: "Invalid input", error: error.message });
  }
};

// Check if User ID exists
const checkUserIdExists = async (req, res) => {
  try {
    const { userId } = req.params;

    const userExists = await User.exists({ userId });

    if (!userExists) {
      return res.status(404).json({ exists: false, message: "User ID does not exist" });
    }

    res.status(200).json({ exists: true, message: "User ID exists" });
  } catch (error) {
    console.error("Check User ID Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add money to user account
const addMoneyToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $inc: { money: amount } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Money added successfully", updatedBalance: updatedUser.money });
  } catch (error) {
    console.error("Add Money Error:", error);
    res.status(500).json({ message: "Error adding money", error: error.message });
  }
};

// Deduct money from user account (general)
const deductMoneyFromUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findOne({ userId });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    user.money -= amount;
    await user.save();

    res.json({ message: "Money deducted successfully", updatedBalance: user.money });
  } catch (error) {
    console.error("Deduct Money Error:", error);
    res.status(500).json({ message: "Error deducting money", error: error.message });
  }
};

// Transfer money from user to admin
const transferToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, adminId } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ userId }).session(session);
      const admin = await Admin.findOne({ adminId }).session(session);

      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "User not found" });
      }

      if (!admin) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Admin not found" });
      }

      if (user.money < amount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Perform the transfer
      user.money -= amount;
      admin.money += amount;

      await user.save({ session });
      await admin.save({ session });

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
      throw error;
    }
  } catch (error) {
    console.error("Transfer to Admin Error:", error);
    res.status(500).json({ message: "Error transferring money", error: error.message });
  }
};

// Transfer money from user to member
const transferToMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, memberId } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ userId }).session(session);
      const member = await Member.findOne({ memberId }).session(session);

      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "User not found" });
      }

      if (!member) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Member not found" });
      }

      if (user.money < amount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Perform the transfer
      user.money -= amount;
      member.money += amount;

      await user.save({ session });
      await member.save({ session });

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
      throw error;
    }
  } catch (error) {
    console.error("Transfer to Member Error:", error);
    res.status(500).json({ message: "Error transferring money", error: error.message });
  }
};

// Apply referral bonus (internal function)
const applyReferralBonus = async (referralCode, referredUserId) => {
  try {
    if (!referralCode) return;

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const referrer = await User.findOne({ userId: referralCode }).session(session);
      const referred = await User.findOne({ userId: referredUserId }).session(session);

      if (referrer && referred) {
        referrer.money += 100;
        referred.money += 100;
        await referrer.save({ session });
        await referred.save({ session });
      }

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Referral Bonus Error:", error);
  }
};

module.exports = {
  signup,
  login,
  findUserById,
  deleteUser,
  editUser,
  checkUserIdExists,
  addMoneyToUser,
  deductMoneyFromUser,
  transferToAdmin,
  transferToMember,
  applyReferralBonus
};