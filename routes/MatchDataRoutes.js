const express = require('express');
const { placeBet } = require('../controller/MatchdataController');
const { settleMatchBets } = require('../controller/MatchdataController');  

const router = express.Router();

// Route to place a bet
router.post('/bet', placeBet);

// Route to settle match bets (based on match result)
router.post('/settle', async (req, res) => {
  try {
    const { fixtureId, matchId } = req.body;

    if (!fixtureId || !matchId) {
      return res.status(400).json({ message: 'fixtureId and matchId are required' });
    }

    const result = await settleMatchBets(fixtureId, matchId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Settle API Error:', error.message);
    res.status(500).json({ message: 'Error settling bets', error: error.message });
  }
});

module.exports = router;
