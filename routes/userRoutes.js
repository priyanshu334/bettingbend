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
  changePassword,
  getAllUsersBetHistory,
  getUserAccountHistory,
  getAllUsersAccountHistory
} = require("../controller/userController");

const authenticateUser = require("../middleware/userAuth");
const authenticateAdmin = require("../middleware/AuthMiddleware");

const router = express.Router();

// --- Public routes ---
router.post("/signup", signup);
router.post("/login", login);

// --- Admin routes ---
router.get("/", getAllUsers);

// --- User verification ---
router.get("/check-id/:userId", checkUserIdExists);

// --- User data routes ---
router.get("/phone/:phone", authenticateUser, findUserByPhoneNumber);

// --- Balance routes ---
router.get("/:userId/balance", authenticateUser, getUserBalance);
router.post("/add-money", addMoneyByPhone);
router.post("/withdraw-money", withdrawMoneyByPhone);

// --- Password management ---
router.post("/change-password", authenticateUser, changePassword);

// --- Bet management ---
router.post("/:userId/bets", authenticateUser, addBetToHistory);
router.get("/:userId/bets",  getBetHistory);
router.get("/bets", getAllUsersBetHistory);

// Add this with your other admin routes
router.get("/account-history",  getAllUsersAccountHistory);
router.get("/:userId/account-history",  getUserAccountHistory);
// --- User management ---
router.put("/:userId", authenticateUser, editUser);
router.delete("/:userId", authenticateUser, deleteUser);
router.get("/:userId", authenticateUser, getUserById); // keep this last

module.exports = router;
