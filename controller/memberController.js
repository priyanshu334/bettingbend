const Member = require("../models/member");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET; // Replace with env variable

// ✅ Member Signup (Register)
const memberSignup = async (req, res) => {
  try {
    const { memberId, fullName, phone, password, money } = req.body;
    console.log(req.body);
    // Check if member already exists
    const existingMember = await Member.findOne({ phone });
    if (existingMember) {
      return res.status(400).json({ success: false, message: "Member already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new member
    const newMember = new Member({
      memberId,
      fullName,
      phone,
      password: hashedPassword,
      money,
      role: "member" // Ensure role is set to 'member'
    });

    await newMember.save();

    res.status(201).json({ success: true, message: "Member registered successfully", member: newMember });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Member Login
const memberLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Check if member exists
    const member = await Member.findOne({ phone });
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, member.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: member._id, role: member.role },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.status(200).json({ success: true, message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Get Member by ID
const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).select("-password");
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    res.status(200).json({ success: true, member });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Get All Members
const getAllMembers = async (req, res) => {
  try {
    const members = await Member.find().select("-password");
    res.status(200).json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Delete Member
const deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    res.status(200).json({ success: true, message: "Member deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { memberSignup, memberLogin, getMemberById, getAllMembers, deleteMember };