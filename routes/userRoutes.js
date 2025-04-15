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
  transferToMember
} = require("../controller/userController");
const authenticateUser = require("../middleware/userAuth");

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// User verification
router.get("/check-id/:userId", checkUserIdExists);

// Authenticated user routes
router.get("/:userId", authenticateUser, findUserById);
router.delete("/delete/:userId", authenticateUser, deleteUser);
router.put("/edit/:userId", authenticateUser, editUser);

// Money management routes
router.post("/:userId/add-money", authenticateUser, addMoneyToUser);
router.post("/:userId/deduct-money", authenticateUser, deductMoneyFromUser);
router.post("/:userId/transfer-to-admin", authenticateUser, transferToAdmin);
router.post("/:userId/transfer-to-member", authenticateUser, transferToMember);

module.exports = router;