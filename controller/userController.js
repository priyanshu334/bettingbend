const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/user");

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
    res.status(201).json({ message: "User registered successfully", userId });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(400).json({ message: "Invalid input", error: error.message });
  }
};

// User Login
const login = async (req, res) => {
  try {
    console.log("Login Request Body:", req.body); // Debugging

    const { phone, password } = req.body;
    const user = await User.findOne({ phone });

    if (!user) {
      console.error("Login Error: User not found");
      return res.status(400).json({ message: "Invalid phone number or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("Login Error: Incorrect password");
      return res.status(400).json({ message: "Invalid phone number or password" });
    }

    const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: "7d" });

    console.log("Generated Token:", token); // Debugging

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

module.exports = { signup, login, findUserById, deleteUser, editUser };
