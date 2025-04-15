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
    const { userId, fullName, phone, password, referralCode } = req.body;

    // Check if phone number is already registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ message: "Phone number already registered" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with additional fields
    const newUser = new User({
      userId,
      fullName,
      phone,
      password: hashedPassword,
      referralCode: referralCode || null,
      money: 0, // Default balance
      totalBets: 0, // Initialize total bets
      betHistory: [] // Initialize empty bet history
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

// User Login (unchanged)
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

    // Include userId and role in the token payload
    const tokenPayload = {
        userId: user.userId,
        role: 'user' // Assuming this controller handles regular users
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });


    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(400).json({ message: "Invalid input", error: error.message });
  }
};

// Find User by ID (now includes bet history)
const findUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    // Exclude password from the result
    const user = await User.findOne({ userId }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Find User Error:", error);
    res.status(500).json({ message: "Error retrieving user", error: error.message });
  }
};

// *** NEW FUNCTION START ***
// Get user balance by ID
const getUserBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    // Find the user and select only the 'money' field
    const user = await User.findOne({ userId }).select("money");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the balance
    res.json({ balance: user.money });
  } catch (error) {
    console.error("Get User Balance Error:", error);
    res.status(500).json({ message: "Error retrieving user balance", error: error.message });
  }
};
// *** NEW FUNCTION END ***

// Add bet to user history
const addBetToHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { player, odds, amount, result, winnings } = req.body;

    // Validate input data (basic example)
    if (!player || !odds || typeof amount !== 'number' || !result || typeof winnings !== 'number') {
        return res.status(400).json({ message: "Invalid bet data provided" });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Add new bet to history
    user.betHistory.push({
      player,
      odds,
      amount,
      result,
      winnings,
      createdAt: new Date() // Add timestamp to bet history
    });

    // Update total bets placed
    user.totalBets += amount;

    // Note: This endpoint only adds history. Balance changes should happen in game logic.
    // If winnings > 0, the game logic should have already added it to user.money

    await user.save();

    res.json({ message: "Bet added to history successfully" }); // Avoid sending full user object back
  } catch (error) {
    console.error("Add Bet Error:", error);
    res.status(500).json({ message: "Error adding bet to history", error: error.message });
  }
};

// Get user bet history
const getBetHistory = async (req, res) => {
  try {
    const { userId } = req.params;
     // Select necessary fields and sort history newest first
    const user = await User.findOne({ userId }).select("betHistory totalBets")
                           .populate({ path: 'betHistory', options: { sort: { 'createdAt': -1 } } });


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

// Delete User (unchanged)
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

// Edit User (unchanged, but consider password handling)
const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // IMPORTANT: Prevent password update through this endpoint unless specifically handled
    if (updateData.password) {
        return res.status(400).json({ message: "Password cannot be updated via this endpoint. Use a dedicated password change function." });
    }
     // Prevent changing userId or money directly via this generic edit endpoint
     delete updateData.userId;
     delete updateData.money;
     delete updateData.totalBets;
     delete updateData.betHistory;


    const updatedUser = await User.findOneAndUpdate(
        { userId },
        { $set: updateData }, // Use $set to update only provided fields
        { new: true, runValidators: true } // Return updated doc and run schema validators
    ).select("-password"); // Exclude password from response

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully", user: updatedUser }); // Return updated user data
  } catch (error) {
    console.error("Edit User Error:", error);
     // Check for validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: "Validation Error", errors: error.errors });
    }
    res.status(400).json({ message: "Error updating user", error: error.message });
  }
};


// Check if User ID exists (unchanged)
const checkUserIdExists = async (req, res) => {
  try {
    const { userId } = req.params;

    // Use exists for efficiency if you only need true/false
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

// Add money to user account (unchanged)
// NOTE: Consider adding transaction history for deposits
const addMoneyToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    // Validate amount more strictly
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ message: "Invalid deposit amount" });
    }

    // Use findOneAndUpdate for atomicity
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $inc: { money: depositAmount } }, // Increment money
      { new: true } // Return the updated document
    ).select("money"); // Select only the money field

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

     // TODO: Log this deposit in a separate Transaction collection

    res.json({ message: "Money added successfully", updatedBalance: updatedUser.money });
  } catch (error) {
    console.error("Add Money Error:", error);
    res.status(500).json({ message: "Error adding money", error: error.message });
  }
};


// Deduct money from user account (unchanged)
// NOTE: Consider adding transaction history for withdrawals
const deductMoneyFromUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    // Validate amount more strictly
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
    }

    // Use findOneAndUpdate with condition for atomicity and balance check
    const updatedUser = await User.findOneAndUpdate(
        { userId, money: { $gte: withdrawalAmount } }, // Find user only if balance is sufficient
        { $inc: { money: -withdrawalAmount } }, // Decrement money
        { new: true } // Return the updated document
    ).select("money"); // Select only the money field


    if (!updatedUser) {
        // If user not found OR balance was insufficient
        const userExists = await User.exists({ userId });
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        } else {
            return res.status(400).json({ message: "Insufficient balance" });
        }
    }

    // TODO: Log this withdrawal in a separate Transaction collection

    res.json({ message: "Money deducted successfully", updatedBalance: updatedUser.money });
  } catch (error) {
    console.error("Deduct Money Error:", error);
    res.status(500).json({ message: "Error deducting money", error: error.message });
  }
};

// Transfer money from user to admin (unchanged)
const transferToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, adminId } = req.body; // Assuming adminId identifies the target admin

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ message: "Invalid transfer amount" });
    }
    if (!adminId) {
        return res.status(400).json({ message: "Admin ID is required" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let userBalance, adminBalance;

    try {
      // Find user and check balance atomically
      const user = await User.findOneAndUpdate(
        { userId, money: { $gte: transferAmount } },
        { $inc: { money: -transferAmount } },
        { new: true, session }
      );

      if (!user) {
          await session.abortTransaction();
          session.endSession();
          // Check if user exists but had insufficient balance
          const userExists = await User.findOne({ userId }).select('_id money');
          if (!userExists) return res.status(404).json({ message: "Sender user not found" });
          return res.status(400).json({ message: "Insufficient balance" });
      }
      userBalance = user.money; // Balance after deduction

      // Find admin and add money
      const admin = await Admin.findOneAndUpdate(
        { adminId }, // Make sure Admin model has 'adminId' field
        { $inc: { money: transferAmount } },
        { new: true, session }
      );

      if (!admin) {
        await session.abortTransaction();
        session.endSession();
        // Rollback user deduction manually as findOneAndUpdate was outside transaction scope initially
        // This highlights complexity - better to fetch both first then update if valid
        await User.updateOne({ userId }, { $inc: { money: transferAmount } }); // Manual rollback attempt
        return res.status(404).json({ message: "Recipient Admin not found" });
      }
      adminBalance = admin.money; // Balance after addition

      // TODO: Log this transfer in a Transaction collection

      await session.commitTransaction();
      session.endSession();

      res.json({
        message: "Money transferred to admin successfully",
        userBalance: userBalance,
        adminBalance: adminBalance
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transfer to Admin Transaction Error:", error); // Log the specific error
      res.status(500).json({ message: "Transaction failed during transfer", error: error.message }); // Return specific error
    }
  } catch (error) {
    // Catch errors initiating the session or outside the transaction block
    console.error("Transfer to Admin Error:", error);
    res.status(500).json({ message: "Error initiating transfer", error: error.message });
  }
};


// Transfer money from user to member (unchanged)
// Apply similar transaction improvements as transferToAdmin
const transferToMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, memberId } = req.body; // Assuming memberId identifies the target member

    const transferAmount = parseFloat(amount);
     if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ message: "Invalid transfer amount" });
    }
     if (!memberId) {
        return res.status(400).json({ message: "Member ID is required" });
    }


    const session = await mongoose.startSession();
    session.startTransaction();
    let userBalance, memberBalance;

    try {
      // Find user and check balance atomically before deduction
       const user = await User.findOneAndUpdate(
        { userId, money: { $gte: transferAmount } },
        { $inc: { money: -transferAmount } },
        { new: true, session }
      );


      if (!user) {
        await session.abortTransaction();
        session.endSession();
         const userExists = await User.findOne({ userId }).select('_id money');
         if (!userExists) return res.status(404).json({ message: "Sender user not found" });
         return res.status(400).json({ message: "Insufficient balance" });
      }
       userBalance = user.money;


      // Find member and add money
      const member = await Member.findOneAndUpdate(
        { memberId }, // Make sure Member model has 'memberId' field
        { $inc: { money: transferAmount } },
        { new: true, session }
      );

      if (!member) {
        await session.abortTransaction();
        session.endSession();
        // Attempt rollback (consider implications if this fails)
         await User.updateOne({ userId }, { $inc: { money: transferAmount } });
        return res.status(404).json({ message: "Recipient Member not found" });
      }
       memberBalance = member.money;

      // TODO: Log this transfer in a Transaction collection

      await session.commitTransaction();
      session.endSession();

      res.json({
        message: "Money transferred to member successfully",
        userBalance: userBalance,
        memberBalance: memberBalance
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


// Apply referral bonus (internal function, unchanged)
// Consider making bonus amount configurable
const applyReferralBonus = async (referralCode, referredUserId) => {
  try {
    if (!referralCode || !referredUserId || referralCode === referredUserId) return; // Prevent self-referral

    const bonusAmount = parseFloat(process.env.REFERRAL_BONUS_AMOUNT) || 100; // Configurable bonus


    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Ensure referrer exists and is not the referred user
      const referrer = await User.findOneAndUpdate(
        { userId: referralCode, userId: { $ne: referredUserId } }, // Find referrer, ensure not self
        { $inc: { money: bonusAmount } }, // Add bonus to referrer
        { new: true, session }
      );

      // Ensure referred user exists
      const referred = await User.findOneAndUpdate(
        { userId: referredUserId },
        { $inc: { money: bonusAmount } }, // Add bonus to referred user
        { new: true, session }
      );


      // Only commit if both referrer and referred were found and updated
      if (referrer && referred) {
         // TODO: Log referral bonus transaction for both users
        await session.commitTransaction();
         console.log(`Referral bonus of ${bonusAmount} applied to ${referrer.userId} and ${referred.userId}`);
      } else {
        await session.abortTransaction();
        if (!referrer) console.log(`Referrer (${referralCode}) not found or was same as referred user.`);
        if (!referred) console.log(`Referred user (${referredUserId}) not found during bonus application.`);
      }

      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      // Re-throw for outer catch block
      throw error;
    }
  } catch (error) {
    // Log errors related to referral bonus application specifically
    console.error(`Referral Bonus Application Error for ${referredUserId} via ${referralCode || 'N/A'}:`, error.message);
    // Don't block signup if bonus fails, but log it thoroughly
  }
};


module.exports = {
  signup,
  login,
  findUserById,
  getUserBalance, // <-- Added function export
  addBetToHistory,
  getBetHistory,
  deleteUser,
  editUser,
  checkUserIdExists,
  addMoneyToUser,
  deductMoneyFromUser,
  transferToAdmin,
  transferToMember
  // applyReferralBonus is internal, usually not exported for direct API use
};