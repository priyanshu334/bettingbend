// routes/playerRunsBetRoutes.js

const express = require("express");
const router = express.Router();

const {
  placePlayerRunsBet,
  settlePlayerRunsBets,
} = require("../controllers/playerRunsBetController");

// 🔹 POST: Place a Player Runs Bet
router.post("/place", placePlayerRunsBet);

// 🔹 POST: Settle Player Runs Bets
router.post("/settle", async (req, res) => {
  const { fixtureId, matchId } = req.body;

  if (!fixtureId || !matchId) {
    return res.status(400).json({ message: "fixtureId and matchId are required." });
  }

  try {
    const result = await settlePlayerRunsBets(fixtureId, matchId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
