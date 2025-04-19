const express = require("express");
const router = express.Router();
const { memberSignup, memberLogin, getMemberById, getAllMembers, deleteMember } = require("../controller/memberController");
const { authenticateUser, authorizeRole } = require("../middleware/AuthMiddleware");

// ✅ Public Routes
router.post("/signup", memberSignup);
router.post("/login", memberLogin);

// ✅ Protected Routes
router.get("/:id", getMemberById);
router.get("/", getAllMembers);
router.delete("/:id",  deleteMember);

module.exports = router;
