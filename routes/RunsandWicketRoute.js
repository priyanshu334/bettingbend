const express = require("express");
const router = express.Router();
const { placeBet } = require("../controller/RunsAndWicketsController");
const { settleMatchBets } = require("../controller/RunsAndWicketsController");
const authenticateUser = require("../middleware/userAuth");

// 1️⃣ Route to place a bet
router.post("/place", authenticateUser ,placeBet);

// 2️⃣ Admin route to settle bets for a match
router.post("/settle", async (req, res) => {
  const { fixtureId, matchId } = req.body;

  if (!fixtureId || !matchId) {
    return res.status(400).json({ message: "fixtureId and matchId are required" });
  }

  try {
    const result = await settleMatchBets(fixtureId, matchId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
