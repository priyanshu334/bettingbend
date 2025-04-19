const express = require("express");
const {
  signup,
  login,
  deleteUser,
  editUser,
  findUserByPhoneNumber,
  checkUserIdExists,
  addMoney,
  withdrawMoney,
  addBetToHistory,
  getBetHistory,
  getUserBalance,
  getAllUsers,          // Add this
  getUserById           // Add this
} = require("../controller/userController");
const authenticateUser = require("../middleware/userAuth");

const router = express.Router();

// --- Public routes ---
router.post("/signup", signup);
router.post("/login", login);

// --- User verification ---
router.get("/check-id/:userId", checkUserIdExists);
router.get("/check-phone/:phone", authenticateUser, findUserByPhoneNumber); // Alternative phone check

// --- User data routes ---
router.get("/", getAllUsers); // Admin-only route to get all users
router.get("/:userId", authenticateUser, getUserById); // Get user by ID
router.get("/phone/:phone", authenticateUser, findUserByPhoneNumber); // Get user by phone

// --- Balance routes ---
router.get("/:userId/balance", authenticateUser, getUserBalance); // Get balance by user ID
router.post("/add-money", authenticateUser, addMoney); // Uses phone from request body
router.post("/withdraw-money", authenticateUser, withdrawMoney); // Uses phone from request body

// --- User management ---
router.delete("/:userId", authenticateUser, deleteUser);
router.put("/:userId", authenticateUser, editUser);

// --- Bet management ---
router.post("/:userId/bets", authenticateUser, addBetToHistory); // Add bet for specific user
router.get("/:userId/bets", authenticateUser, getBetHistory); // Get bet history for user

module.exports = router;