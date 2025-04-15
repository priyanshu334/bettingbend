const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;; // Replace with env variable

// ✅ Admin Signup (Register)
const adminSignup = async (req, res) => {
  try {
    const { adminId, fullName, phone, password, money } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ phone });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({
      adminId,
      fullName,
      phone,
      password: hashedPassword,
      money,
      role: "admin" // Ensure role is set to 'admin'
    });

    await newAdmin.save();

    res.status(201).json({ success: true, message: "Admin registered successfully", admin: newAdmin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Admin Login
const adminLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ phone });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.status(200).json({ success: true, message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Protected Route: Get Admin Profile
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { adminSignup, adminLogin, getAdminProfile };
