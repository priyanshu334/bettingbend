// scripts/initGames.js
const connectDB = require('../config/db');
const { 
  ColorGameSettings, 
  MinesGameSettings, 
  PlinkoGameSettings // Import PlinkoGameSettings
} = require('../models/gameModels');

console.log(connectDB)
async function initGameSettings() {
  let db;
  try {
    db = await connectDB();
    console.log(db)
    console.log("Database connected for initialization...");

    // Initialize Color Game Settings
    console.log("Initializing Color Game settings...");
    await ColorGameSettings.findOneAndUpdate(
      {}, // Find any document (or create one if none exists)
      {
        // Set these default values
        $setOnInsert: { // Only set these on initial insert if upsert creates the doc
          gameType: "color-prediction",
          colors: ["red", "green", "blue"],
          multipliers: { red: 2, green: 3, blue: 1.5 },
          minBet: 10,
          maxBet: 10000,
          adminControlEnabled: false,
          nextColor: "random"
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } // Create if doesn't exist, return updated doc
    );
    console.log("Color Game settings ensured.");

    // Initialize Mines Game Settings
    console.log("Initializing Mines Game settings...");
    await MinesGameSettings.findOneAndUpdate(
      {},
      {
        $setOnInsert: {
          gameType: "mines",
          gridSize: 5,
          bombCount: 5,
          baseMultiplier: 1,
          multiplierIncrement: 0.2,
          minBet: 10,
          maxBet: 10000
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("Mines Game settings ensured.");

    // Initialize Plinko Game Settings
    console.log("Initializing Plinko Game settings...");
    await PlinkoGameSettings.findOneAndUpdate(
      {},
      {
        $setOnInsert: {
          gameType: "plinko",
          rows: 16, // Number of peg rows
          // Multipliers for each slot at the bottom (should match rows + 1)
          slots: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110], 
          minBet: 10,
          maxBet: 10000,
          ballSize: 16, // Size of the ball (e.g., in pixels or relative units)
          pegSize: 6,   // Size of the pegs
          boardWidth: 100, // Width of the board (often used as a percentage)
          boardHeight: 80, // Height of the board (often used as a percentage)
          fixedDropPosition: 50, // Default drop position (e.g., 50% from left)
          // Physics settings used in simulation
          physics: {
            gravity: 0.2,
            friction: 0.92,       // Air/peg friction
            restitution: 0.65,    // Bounciness off pegs/walls
            randomness: 0.15,     // Adds slight unpredictable movement on collision
            terminalVelocity: 5  // Max falling speed
          },
          animationDuration: 3 // Example: Duration in seconds for animation
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } // Create if doesn't exist
    );
    console.log("Plinko Game settings ensured.");

    console.log("Game settings initialization process completed successfully.");

  } catch (error) {
    console.error("Error during game settings initialization:", error);
    // Exit with error code if initialization fails critical setup
    process.exit(1); 
  } finally {
    // Only try to close if db connection was established
    if (db) {
      try {
        await db.close();
        console.log('Database connection closed after initialization.');
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}

// If run directly (e.g., `node scripts/initGames.js`), execute the function
if (require.main === module) {
  initGameSettings().then(() => {
    console.log("Initialization script finished.");
    process.exit(0); // Exit successfully
  }).catch(err => {
    // Catch any potential unhandled promise rejection from initGameSettings
    console.error("Unhandled error running initialization script:", err);
    process.exit(1); // Exit with error
  });
}

// Export the function in case it needs to be called programmatically
module.exports = initGameSettings;