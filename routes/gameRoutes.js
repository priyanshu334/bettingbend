const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/AuthMiddleware"); // Ensure path is correct
// Ensure controller paths are correct
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
// Add Mines history route if needed
// router.get("/mines/history", authenticateUser, minesGame.getHistory); // Example if you add this method

// Plinko Game Routes
router.get("/plinko/settings", plinkoGame.getSettings);
router.post("/plinko/bet", authenticateUser, plinkoGame.placeBet);
router.get("/plinko/history", authenticateUser, plinkoGame.getHistory);

// Admin Game Management Routes
// Ensure roles like "admin" are correctly defined and checked in authorizeRole middleware
router.put("/admin/color/settings", authenticateUser, authorizeRole(["admin"]), adminGame.updateColorSettings);
router.put("/admin/mines/settings", authenticateUser, authorizeRole(["admin"]), adminGame.updateMinesSettings);
// Add admin route for Plinko settings if needed
// router.put("/admin/plinko/settings", authenticateUser, authorizeRole(["admin"]), adminGame.updatePlinkoSettings); // Example if you add this method
router.get("/admin/sessions", authenticateUser, authorizeRole(["admin"]), adminGame.getGameSessions);
router.get("/admin/stats", authenticateUser, authorizeRole(["admin"]), adminGame.getGameStats);

module.exports = router;