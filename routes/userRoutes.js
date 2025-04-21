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
  getAllUsers,
  getUserById
} = require("../controller/userController");
const authenticateUser = require("../middleware/userAuth");
const authenticateAdmin = require("../middleware/adminAuth"); // Add this if you have admin auth

const router = express.Router();

// --- Public routes ---
router.post("/signup", signup);
router.post("/login", login);

// --- User verification ---
router.get("/check-id/:userId", checkUserIdExists);
// Remove the duplicate phone check route

// --- User data routes ---
router.get("/", authenticateAdmin, getAllUsers); // Admin-only
router.get("/:userId", authenticateUser, getUserById);
router.get("/phone/:phone", authenticateUser, findUserByPhoneNumber);

// --- Balance routes ---
router.get("/:userId/balance", authenticateUser, getUserBalance);
router.post("/add-money", authenticateUser, addMoney);
router.post("/withdraw-money", authenticateUser, withdrawMoney);

// --- User management ---
router.delete("/:userId", authenticateUser, deleteUser);
router.put("/:userId", authenticateUser, editUser);

// --- Bet management ---
router.post("/:userId/bets", authenticateUser, addBetToHistory);
router.get("/:userId/bets", authenticateUser, getBetHistory);

module.exports = router;