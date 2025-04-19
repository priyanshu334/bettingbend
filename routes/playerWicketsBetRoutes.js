// routes/playerWicketsBetRoutes.js

const express = require("express");
const router = express.Router();

const {
  placePlayerWicketsBet,
  settlePlayerWicketsBets,
} = require("../controller/PlayerWicketsController");

// 🔹 POST: Place a Player Wickets Bet
router.post("/place", placePlayerWicketsBet);

// 🔹 POST: Settle Player Wickets Bets (admin/internal)
router.post("/settle", async (req, res) => {
  const { fixtureId, matchId } = req.body;

  if (!fixtureId || !matchId) {
    return res.status(400).json({ message: "fixtureId and matchId are required." });
  }

  try {
    const result = await settlePlayerWicketsBets(fixtureId, matchId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
