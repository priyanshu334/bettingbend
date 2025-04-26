// routes/boundaryBetRoutes.js

const express = require("express");
const router = express.Router();

const {
  placeBoundaryBet,
  settleBoundaryBets,
} = require("../controller/BoundryBetController");
const authenticateUser = require("../middleware/userAuth");

// 🔹 POST: Place a Boundary Bet
router.post("/place",authenticateUser, placeBoundaryBet);

// 🔹 POST: Settle Boundary Bets
router.post("/settle", async (req, res) => {
  const {  matchId } = req.body;

  if ( !matchId) {
    return res.status(400).json({ message: "fixtureId and matchId are required." });
  }

  try {
    const result = await settleBoundaryBets( matchId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
