// routes/bowlerRunsBetRoutes.js

const express = require("express");
const router = express.Router();

const {
  placeBowlerRunsBet,
  settleBowlerRunsBets,
} = require("../controller/BowlerRunsController");
const authenticateUser = require("../middleware/userAuth");

// 🔹 POST: Place a Bowler Runs Bet
router.post("/place",authenticateUser ,placeBowlerRunsBet);

// 🔹 POST: Settle Bowler Runs Bets
router.post("/settle", async (req, res) => {
  const { fixtureId, matchId } = req.body;

  if (!fixtureId || !matchId) {
    return res.status(400).json({ message: "fixtureId and matchId are required." });
  }

  try {
    const result = await settleBowlerRunsBets(fixtureId, matchId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
