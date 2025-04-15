const express = require("express");
const router = express.Router();
const { placeBet } = require("../controller/betController");

// POST /api/bet/place
router.post("/place", placeBet);

module.exports = router;