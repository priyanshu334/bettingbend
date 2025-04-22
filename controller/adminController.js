const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET; // Replace with env variable

// ✅ Admin Signup (Register)
const adminSignup = async (req, res) => {
  console.log("👉 Admin Signup Request Body:", req.body);

  try {
    const { adminId, fullName, phone, password, money } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ phone });
    if (existingAdmin) {
      console.log("⚠️ Admin already exists with phone:", phone);
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 Password hashed successfully");

    // Create new admin
    const newAdmin = new Admin({
      adminId,
      fullName,
      phone,
      password: hashedPassword,
      money,
      role: "admin"
    });

    await newAdmin.save();
    console.log("✅ New admin saved:", newAdmin);

    res.status(201).json({ success: true, message: "Admin registered successfully", admin: newAdmin });
  } catch (error) {
    console.error("❌ Error in adminSignup:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Admin Login
const adminLogin = async (req, res) => {
  console.log("👉 Admin Login Request Body:", req.body);

  try {
    const { phone, password } = req.body;

    const admin = await Admin.findOne({ phone });
    if (!admin) {
      console.log("⚠️ Admin not found for phone:", phone);
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      console.log("⛔ Invalid password for phone:", phone);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      SECRET_KEY,
      { expiresIn: "7d" }
    );
    console.log("✅ Token generated for admin ID:", admin._id);

    res.status(200).json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.error("❌ Error in adminLogin:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Protected Route: Get Admin Profile
const getAdminProfile = async (req, res) => {
  console.log("🔐 Get Admin Profile for ID:", req.user?.id);

  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    if (!admin) {
      console.log("⚠️ Admin not found for ID:", req.user.id);
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    console.log("✅ Admin profile fetched:", admin);
    res.status(200).json({ success: true, admin });
  } catch (error) {
    console.error("❌ Error in getAdminProfile:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { adminSignup, adminLogin, getAdminProfile };
