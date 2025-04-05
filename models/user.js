const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true }, // Explicitly provided User ID
    fullName: { type: String, required: true }, // Full Name
    phone: { type: String, required: true, unique: true }, // Phone Number (unique)
    password: { type: String, required: true }, // Encrypted Password
    referralCode: { type: String, default: null }, // Optional Referral Code
    money: { type: Number, required: true, default: 0 }, // User Balance
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
