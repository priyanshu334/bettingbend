const express = require('express');
const { placeBet } = require('../controller/MatchdataController');
const { settleMatchBets } = require('../controller/MatchdataController');  
const authenticateUser = require("../middleware/userAuth");

const router = express.Router();

// Route to place a bet
router.post('/bet',authenticateUser ,placeBet);

// Route to settle match bets (based on match result)
router.post('/settle', async (req, res) => {
  try {
    const {matchId } = req.body;
    console.log(matchId)

    if (!matchId) {
      return res.status(400).json({ message: 'fixtureId and matchId are required' });
    }

    const result = await settleMatchBets( matchId);
    console.log(result)
    res.status(200).json(result);
  } catch (error) {
    console.error('Settle API Error:', error.message);
    res.status(500).json({ message: 'Error settling bets', error: error.message });
  }
});

module.exports = router;
