const express = require("express");
const {
  signup,
  login,
  deleteUser,
  editUser,
  findUserById,
  checkUserIdExists,
  addMoneyToUser,
  deductMoneyFromUser,
  transferToAdmin,
  transferToMember,
  addBetToHistory,
  getBetHistory,
  getUserBalance // <-- Import the new function
} = require("../controller/userController"); // Ensure path is correct
// Ensure the path to your middleware is correct
// If your middleware is named userAuth.js and exports authenticateUser:
const authenticateUser = require("../middleware/userAuth");

const router = express.Router();

// --- Public routes ---
router.post("/signup", signup);
router.post("/login", login);

// --- User verification ---
// Consider if this needs authentication depending on your use case
router.get("/check-id/:userId", checkUserIdExists);

// --- Authenticated user routes ---
// General user info (already exists)
router.get("/:userId", authenticateUser, findUserById);

// *** ADDED ROUTE FOR BALANCE ***
// Get user balance
router.get("/:userId/balance", authenticateUser, getUserBalance);

// User management (require authentication)
router.delete("/delete/:userId", authenticateUser, deleteUser); // Consider adding role checks (e.g., only admin or self)
router.put("/edit/:userId", authenticateUser, editUser); // Consider adding role checks (e.g., only self)

// --- Money management routes (require authentication) ---
router.post("/:userId/add-money", authenticateUser, addMoneyToUser); // Consider role checks (e.g., admin only?)
router.post("/:userId/deduct-money", authenticateUser, deductMoneyFromUser); // Consider role checks (e.g., admin only?)
router.post("/:userId/transfer-to-admin", authenticateUser, transferToAdmin); // Should be authenticated as the user
router.post("/:userId/transfer-to-member", authenticateUser, transferToMember); // Should be authenticated as the user

// --- Bet management routes (require authentication) ---
router.post("/:userId/add-bet", authenticateUser, addBetToHistory); // Likely okay for user self-service
router.get("/:userId/bet-history", authenticateUser, getBetHistory); // Likely okay for user self-service

module.exports = router;