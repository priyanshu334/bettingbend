const express = require("express");
const router = express.Router();
const { placeBet, getUserBets } = require("../controller/betController");
const authenticateUser = require("../middleware/userAuth");

// POST /api/bet/place
router.post("/place", authenticateUser, placeBet);

// ✅ GET /api/bet/user/:userId — fetch bets of a user
router.get("/user/:userId", authenticateUser, getUserBets);

module.exports = router;
