// routes/playerRunsBetRoutes.js

const express = require("express");
const router = express.Router();

const {
  placePlayerRunsBet,
  settlePlayerRunsBets,
} = require("../controller/PlayerRunsController");
const authenticateUser = require("../middleware/userAuth");

// 🔹 POST: Place a Player Runs Bet
router.post("/place",authenticateUser ,placePlayerRunsBet);

// 🔹 POST: Settle Player Runs Bets
router.post("/settle", async (req, res) => {
  const {  matchId } = req.body;

  if ( !matchId) {
    return res.status(400).json({ message: "fixtureId and matchId are required." });
  }

  try {
    const result = await settlePlayerRunsBets( matchId);
    
    res.json(result);
    console.log(result)
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
