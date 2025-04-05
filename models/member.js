const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema(
  {
    memberId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed password
    money: { type: Number, default: 0 },
    referralCode: { type: String, default: null },
    role: { type: String, default: "member", immutable: true }, // Fixed as 'member'
  },
  { timestamps: true }
);

const Member = mongoose.model("Member", MemberSchema);
module.exports = Member;
