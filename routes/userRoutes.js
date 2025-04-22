const express = require("express");
const {
  signup,
  login,
  deleteUser,
  editUser,
  findUserByPhoneNumber,
  checkUserIdExists,
  addMoneyByPhone,
  withdrawMoneyByPhone,
  addBetToHistory,
  getBetHistory,
  getUserBalance,
  getAllUsers,
  getUserById,
  changePassword, // <- added this
} = require("../controller/userController");

const authenticateUser = require("../middleware/userAuth");
const authenticateAdmin = require("../middleware/AuthMiddleware");

const router = express.Router();

// --- Public routes ---
router.post("/signup", signup);
router.post("/login", login);

// --- User verification ---
router.get("/check-id/:userId", checkUserIdExists);

// --- User data routes ---
router.get("/", getAllUsers); // Admin-only
router.get("/:userId", authenticateUser, getUserById);
router.get("/phone/:phone", authenticateUser, findUserByPhoneNumber);

// --- Balance routes ---
router.get("/:userId/balance", authenticateUser, getUserBalance);
router.post("/add-money", addMoneyByPhone);
router.post("/withdraw-money", withdrawMoneyByPhone);

// --- User management ---
router.delete("/:userId", authenticateUser, deleteUser);
router.put("/:userId", authenticateUser, editUser);
router.post("/change-password", authenticateUser, changePassword); // <- added this

// --- Bet management ---
router.post("/:userId/bets", authenticateUser, addBetToHistory);
router.get("/:userId/bets", authenticateUser, getBetHistory);

module.exports = router;
