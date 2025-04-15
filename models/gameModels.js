const mongoose = require("mongoose");

// Base Game Settings Schema
const GameSettingsSchema = new mongoose.Schema({
  gameType: { 
    type: String, 
    enum: ["color-prediction", "mines", "plinko"], 
    required: true 
  },
  minBet: { type: Number, default: 10 },
  maxBet: { type: Number, default: 10000 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
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

// Plinko Game Specific Settings
const PlinkoGameSettingsSchema = new mongoose.Schema({
  ...GameSettingsSchema.obj,
  rows: { type: Number, default: 16 },
  slots: { 
    type: [Number], 
    default: [110, 41, 10, 1.2, 1, 0.8, 0.6, 0.5, 0.3, 0.5, 0.6, 0.8, 1, 1.2, 10, 41, 110] 
  },
  ballSize: { type: Number, default: 16 },
  pegSize: { type: Number, default: 6 },
  boardWidth: { type: Number, default: 100 }, // Percentage based
  boardHeight: { type: Number, default: 80 }, // Percentage based
  animationDuration: { type: Number, default: 3 }, // In seconds
  fixedDropPosition: { type: Number, default: 50 }, // Percentage (center)
  physics: {
    gravity: { type: Number, default: 0.2 },
    friction: { type: Number, default: 0.92 },
    restitution: { type: Number, default: 0.65 },
    randomness: { type: Number, default: 0.15 },
    terminalVelocity: { type: Number, default: 5 }
  }
});

// Enhanced Game Session Schema
const GameSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  gameType: { 
    type: String, 
    enum: ["color-prediction", "mines", "plinko"], 
    required: true 
  },
  userId: { type: String, required: true },
  userType: { type: String, enum: ["admin", "member", "user"], required: true },
  betAmount: { type: Number, required: true },
  state: { 
    type: String, 
    enum: ["active", "completed", "cashed_out", "lost"], 
    required: true,
    default: "active"
  },
  outcome: mongoose.Schema.Types.Mixed,
  winAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  // Plinko specific fields
  plinkoDetails: {
    path: [{
      x: Number,
      y: Number
    }],
    finalSlot: Number,
    multiplier: Number
  }
});

// Enhanced Transaction Schema
const TransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userType: { type: String, enum: ["admin", "member", "user"], required: true },
  amount: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ["deposit", "withdrawal", "game_bet", "game_win", "game_loss", "referral", "plinko"],
    required: true 
  },
  gameSessionId: { type: String },
  gameType: { type: String, enum: ["color-prediction", "mines", "plinko"] },
  status: { 
    type: String, 
    enum: ["pending", "completed", "failed"], 
    default: "completed" 
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

// Create models
const ColorGameSettings = mongoose.model("ColorGameSettings", ColorGameSettingsSchema);
const MinesGameSettings = mongoose.model("MinesGameSettings", MinesGameSettingsSchema);
const PlinkoGameSettings = mongoose.model("PlinkoGameSettings", PlinkoGameSettingsSchema);
const GameSession = mongoose.model("GameSession", GameSessionSchema);
const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = {
  ColorGameSettings,
  MinesGameSettings,
  PlinkoGameSettings,
  GameSession,
  Transaction
};