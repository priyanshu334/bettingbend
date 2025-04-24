const express = require("express");
const router = express.Router();
const userBetsController = require("../controller/userBetsController");
const authenticateUser = require("../middleware/userAuth");
// Apply only authentication middleware
router.get("/userBets/:userId", authenticateUser, userBetsController.getUserBets);

module.exports = router;
