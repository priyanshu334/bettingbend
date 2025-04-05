const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    adminId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed password
    money: { type: Number, default: 0 },
    role: { type: String, default: "admin", immutable: true }, // Fixed as 'admin'
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
