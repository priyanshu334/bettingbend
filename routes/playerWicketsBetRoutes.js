// routes/playerWicketsBetRoutes.js

const express = require("express");
const router = express.Router();

const {
  placePlayerWicketsBet,
  settlePlayerWicketsBets,
} = require("../controller/PlayerWicketsController");
const authenticateUser = require("../middleware/userAuth");

// 🔹 POST: Place a Player Wickets Bet
router.post("/place",authenticateUser ,placePlayerWicketsBet);

// 🔹 POST: Settle Player Wickets Bets (admin/internal)
router.post("/settle", async (req, res) => {
  const { matchId } = req.body;

  if ( !matchId) {
    return res.status(400).json({ message: "fixtureId and matchId are required." });
  }

  try {
    const result = await settlePlayerWicketsBets( matchId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
