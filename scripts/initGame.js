// scripts/initGames.js
const connectDB = require('../config/db');
const { ColorGameSettings, MinesGameSettings, PlinkoGameSettings } = require('../models/gameModels');

async function initGameSettings() {
  let db;
  try {
    db = await connectDB();
    
    // Initialize Color Game Settings
    await ColorGameSettings.findOneAndUpdate(
      {},
      {
        gameType: "color-prediction",
        colors: ["red", "green", "blue"],
        multipliers: { red: 2, green: 3, blue: 1.5 },
        minBet: 10,
        maxBet: 10000,
        adminControlEnabled: false,
        nextColor: "random"
      },
      { upsert: true, new: true }
    );

    // Initialize Mines Game Settings
    await MinesGameSettings.findOneAndUpdate(
      {},
      {
        gameType: "mines",
        gridSize: 5,
        bombCount: 5,
        baseMultiplier: 1,
        multiplierIncrement: 0.2,
        minBet: 10,
        maxBet: 10000
      },
      { upsert: true, new: true }
    );

    // Initialize Plinko Game Settings
    await PlinkoGameSettings.findOneAndUpdate(
      {},
      {
        gameType: "plinko",
        rows: 16,
        slots: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
        minBet: 10,
        maxBet: 10000,
        ballSize: 16,
        pegSize: 6,
        boardWidth: 100,
        boardHeight: 80,
        animationDuration: 3
      },
      { upsert: true, new: true }
    );

    console.log("Game settings initialized successfully");
  } catch (error) {
    console.error("Error initializing game settings:", error);
    process.exit(1);
  } finally {
    // Only try to close if db connection was established
    if (db && process.env.NODE_ENV !== 'production') {
      try {
        await db.close();
        console.log('Database connection closed');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
}

// If run directly (not required), execute the function
if (require.main === module) {
  initGameSettings().then(() => process.exit(0));
}

module.exports = initGameSettings;