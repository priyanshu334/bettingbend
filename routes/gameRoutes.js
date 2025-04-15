const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/AuthMiddleware");
const { colorGame, minesGame, adminGame } = require("../controller/gameController");
const plinkoGame = require("../controller/plinkoController");


// Color Prediction Game Routes
router.get("/color/settings", colorGame.getSettings);
router.post("/color/bet", authenticateUser, colorGame.placeBet);
router.get("/color/history", authenticateUser, colorGame.getHistory);

// Mines Game Routes
router.get("/mines/settings", minesGame.getSettings);
router.post("/mines/start", authenticateUser, minesGame.startGame);
router.post("/mines/reveal", authenticateUser, minesGame.revealTile);
router.post("/mines/cashout", authenticateUser, minesGame.cashOut);

// Admin Game Management Routes
router.put("/admin/color/settings", authenticateUser, authorizeRole(["admin"]), adminGame.updateColorSettings);
router.put("/admin/mines/settings", authenticateUser, authorizeRole(["admin"]), adminGame.updateMinesSettings);
router.get("/admin/sessions", authenticateUser, authorizeRole(["admin"]), adminGame.getGameSessions);
router.get("/admin/stats", authenticateUser, authorizeRole(["admin"]), adminGame.getGameStats);

router.get("/plinko/settings", plinkoGame.getSettings);
router.post("/plinko/bet", authenticateUser, plinkoGame.placeBet);
router.get("/plinko/history", authenticateUser, plinkoGame.getHistory);

module.exports = router;