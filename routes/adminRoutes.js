const express = require("express");
const router = express.Router();
const { adminSignup, adminLogin, getAdminProfile } = require("../controller/adminController");
const { authenticateUser, authorizeRole } = require("../middleware/AuthMiddleware");

// ✅ Public Routes
router.post("/signup", adminSignup);
router.post("/login", adminLogin);

// ✅ Protected Routes (Only Admins)
router.get("/profile", authenticateUser, authorizeRole(["admin"]), getAdminProfile);

module.exports = router;
