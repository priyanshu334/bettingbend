const express = require("express");
const router = express.Router();
const { placeBet } = require("../controller/betController");
const authenticateUser = require("../middleware/userAuth");


// POST /api/bet/place
router.post("/place",authenticateUser, placeBet);

module.exports = router;