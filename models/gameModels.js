const mongoose = require("mongoose");

// Game Settings Schema
const GameSettingsSchema = new mongoose.Schema({
  gameType: { type: String, enum: ["color-prediction", "mines"], required: true },
  minBet: { type: Number, default: 10 },
  maxBet: { type: Number, default: 10000 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Color Game Specific Settings
const ColorGameSettingsSchema = new mongoose.Schema({
  ...GameSettingsSchema.obj,
  colors: {
    type: [String],
    default: ["red", "green", "blue"],
    enum: ["red", "green", "blue"]
  },
  multipliers: {
    red: { type: Number, default: 2 },
    green: { type: Number, default: 3 },
    blue: { type: Number, default: 1.5 }
  },
  adminControlEnabled: { type: Boolean, default: false },
  nextColor: { type: String, enum: ["red", "green", "blue", "random"], default: "random" }
});

// Mines Game Specific Settings
const MinesGameSettingsSchema = new mongoose.Schema({
  ...GameSettingsSchema.obj,
  gridSize: { type: Number, default: 5 },
  bombCount: { type: Number, default: 5 },
  baseMultiplier: { type: Number, default: 1 },
  multiplierIncrement: { type: Number, default: 0.2 }
});

// Game Session Schema
const GameSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  gameType: { type: String, enum: ["color-prediction", "mines"], required: true },
  userId: { type: String, required: true },
  userType: { type: String, enum: ["admin", "member", "user"], required: true },
  betAmount: { type: Number, required: true },
  state: { 
    type: String, 
    enum: ["active", "completed", "cashed_out", "lost"], 
    required: true 
  },
  outcome: mongoose.Schema.Types.Mixed,
  winAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userType: { type: String, enum: ["admin", "member", "user"], required: true },
  amount: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ["deposit", "withdrawal", "game_bet", "game_win", "game_loss", "referral"],
    required: true 
  },
  gameSessionId: { type: String },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
  createdAt: { type: Date, default: Date.now }
});
// Add to your existing game models
const PlinkoGameSettingsSchema = new mongoose.Schema({
    ...GameSettingsSchema.obj,
    rows: { type: Number, default: 16 },
    slots: { type: [Number], default: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110] },
    ballSize: { type: Number, default: 16 },
    pegSize: { type: Number, default: 6 },
    boardWidth: { type: Number, default: 100 },
    boardHeight: { type: Number, default: 80 },
    animationDuration: { type: Number, default: 3 }
  });
  
 
  
  // Add to your exports
  

// Create models
const ColorGameSettings = mongoose.model("ColorGameSettings", ColorGameSettingsSchema);
const MinesGameSettings = mongoose.model("MinesGameSettings", MinesGameSettingsSchema);
const GameSession = mongoose.model("GameSession", GameSessionSchema);
const Transaction = mongoose.model("Transaction", TransactionSchema);
const PlinkoGameSettings = mongoose.model("PlinkoGameSettings", PlinkoGameSettingsSchema);

module.exports = {
  ColorGameSettings,
  MinesGameSettings,
  GameSession,
  Transaction,
  PlinkoGameSettings
};