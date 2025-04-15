// gameController.js
const mongoose = require("mongoose");
const User = require("../models/user");
const {
  ColorGameSettings,
  MinesGameSettings,
  GameSession,
  Transaction
} = require("../models/gameModels");

// Base game controller with shared methods
class GameController {
  constructor() {
    this.createTransaction = this.createTransaction.bind(this);
    this.createGameSession = this.createGameSession.bind(this);
    this.updateUserBalance = this.updateUserBalance.bind(this);
  }

  async createTransaction(userId, userType, amount, type, sessionId = null) {
    const transaction = new Transaction({
      transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId,
      userType,
      amount,
      type,
      gameSessionId: sessionId,
      status: "completed"
    });
    await transaction.save();
    return transaction;
  }

  async createGameSession(gameType, userId, userType, betAmount) {
    const session = new GameSession({
      sessionId: `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      gameType,
      userId,
      userType,
      betAmount,
      state: "active"
    });
    await session.save();
    return session;
  }

  async updateUserBalance(userId, amount) {
    const user = await User.findOneAndUpdate(
      { userId },
      { 
        $inc: { 
          money: amount,
          ...(amount < 0 && { totalBets: Math.abs(amount) })
        } 
      },
      { new: true }
    );
    
    if (!user) throw new Error("User not found");
    return user;
  }

  async addToBetHistory(userId, gameData) {
    await User.findOneAndUpdate(
      { userId },
      { $push: { betHistory: gameData } }
    );
  }
}

// Color Prediction Game Controller
class ColorGameController extends GameController {
  async getSettings(req, res) {
    try {
      const settings = await ColorGameSettings.findOne();
      res.json({
        success: true,
        data: settings || await ColorGameSettings.create({})
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async placeBet(req, res) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      
      const { userId, role } = req.user;
      const { betAmount, selectedColor } = req.body;
      
      // Get settings
      const settings = await ColorGameSettings.findOne().session(session);
      if (!settings) throw new Error("Color game settings not found");
      
      // Validate bet
      if (betAmount < settings.minBet || betAmount > settings.maxBet) {
        throw new Error(`Bet must be between ${settings.minBet} and ${settings.maxBet}`);
      }
      
      // Deduct bet amount
      const user = await this.updateUserBalance(userId, -betAmount);
      await this.createTransaction(userId, role, -betAmount, "game_bet");
      
      // Create game session
      const gameSession = await this.createGameSession("color-prediction", userId, role, betAmount);
      
      // Determine outcome
      const predictedColor = settings.nextColor === "random" 
        ? settings.colors[Math.floor(Math.random() * settings.colors.length)]
        : settings.nextColor;
      
      const isWin = selectedColor === predictedColor;
      let winAmount = 0;
      
      if (isWin) {
        winAmount = betAmount * settings.multipliers[selectedColor];
        await this.updateUserBalance(userId, winAmount);
        await this.createTransaction(userId, role, winAmount, "game_win", gameSession.sessionId);
        
        // Add to bet history
        await this.addToBetHistory(userId, {
          player: "color-prediction",
          odds: `${settings.multipliers[selectedColor]}x`,
          amount: betAmount,
          result: "win",
          winnings: winAmount,
          createdAt: new Date()
        });
      } else {
        await this.createTransaction(userId, role, -betAmount, "game_loss", gameSession.sessionId);
        
        // Add to bet history
        await this.addToBetHistory(userId, {
          player: "color-prediction",
          odds: `${settings.multipliers[selectedColor]}x`,
          amount: betAmount,
          result: "lose",
          winnings: 0,
          createdAt: new Date()
        });
      }
      
      // Update session
      gameSession.state = isWin ? "completed" : "lost";
      gameSession.outcome = { selectedColor, predictedColor };
      gameSession.winAmount = winAmount;
      gameSession.completedAt = new Date();
      await gameSession.save({ session });
      
      await session.commitTransaction();
      
      res.json({
        success: true,
        data: {
          predictedColor,
          isWin,
          winAmount,
          newBalance: user.money
        }
      });
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    } finally {
      session.endSession();
    }
  }

  async getHistory(req, res) {
    try {
      const { userId, role } = req.user;
      const { limit = 20, page = 1 } = req.query;
      
      const history = await GameSession.find({ 
        userId, 
        userType: role,
        gameType: "color-prediction"
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
      
      const total = await GameSession.countDocuments({ 
        userId, 
        userType: role,
        gameType: "color-prediction" 
      });
      
      res.json({
        success: true,
        data: history,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

// Mines Game Controller
class MinesController extends GameController {
  async getSettings(req, res) {
    try {
      const settings = await MinesGameSettings.findOne();
      res.json({
        success: true,
        data: settings || await MinesGameSettings.create({})
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async startGame(req, res) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      
      const { userId, role } = req.user;
      const { betAmount } = req.body;
      
      // Get settings
      const settings = await MinesGameSettings.findOne().session(session);
      if (!settings) throw new Error("Mines game settings not found");
      
      // Validate bet
      if (betAmount < settings.minBet || betAmount > settings.maxBet) {
        throw new Error(`Bet must be between ${settings.minBet} and ${settings.maxBet}`);
      }
      
      // Deduct bet amount
      const user = await this.updateUserBalance(userId, -betAmount);
      await this.createTransaction(userId, role, -betAmount, "game_bet");
      
      // Generate bomb positions
      const bombPositions = [];
      const totalTiles = settings.gridSize * settings.gridSize;
      
      while (bombPositions.length < settings.bombCount) {
        const row = Math.floor(Math.random() * settings.gridSize);
        const col = Math.floor(Math.random() * settings.gridSize);
        
        if (!bombPositions.some(pos => pos.row === row && pos.col === col)) {
          bombPositions.push({ row, col });
        }
      }
      
      // Create game session
      const gameSession = await this.createGameSession("mines", userId, role, betAmount);
      gameSession.outcome = { bombPositions, revealedTiles: [], multiplier: settings.baseMultiplier };
      await gameSession.save({ session });
      
      await session.commitTransaction();
      
      res.json({
        success: true,
        data: {
          sessionId: gameSession.sessionId,
          gridSize: settings.gridSize,
          currentBalance: user.money
        }
      });
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    } finally {
      session.endSession();
    }
  }

  async revealTile(req, res) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      
      const { userId, role } = req.user;
      const { sessionId, row, col } = req.body;
      
      // Get session
      const gameSession = await GameSession.findOne({ 
        sessionId, 
        userId, 
        userType: role 
      }).session(session);
      
      if (!gameSession || gameSession.state !== "active") {
        throw new Error("Invalid session");
      }
      
      // Check if tile is already revealed
      if (gameSession.outcome.revealedTiles.some(t => t.row === row && t.col === col)) {
        throw new Error("Tile already revealed");
      }
      
      // Check if tile is a bomb
      const isBomb = gameSession.outcome.bombPositions.some(
        pos => pos.row === row && pos.col === col
      );
      
      // Update revealed tiles
      const newRevealedTiles = [
        ...gameSession.outcome.revealedTiles, 
        { row, col, isBomb }
      ];
      
      if (isBomb) {
        // Game over - player loses
        gameSession.state = "lost";
        gameSession.completedAt = new Date();
        await gameSession.save({ session });
        
        await this.createTransaction(
          userId, 
          role, 
          -gameSession.betAmount, 
          "game_loss", 
          gameSession.sessionId
        );
        
        // Add to bet history
        await this.addToBetHistory(userId, {
          player: "mines",
          odds: `${gameSession.outcome.multiplier}x`,
          amount: gameSession.betAmount,
          result: "lose",
          winnings: 0,
          createdAt: new Date()
        });
        
        await session.commitTransaction();
        
        return res.json({
          success: true,
          data: {
            result: "lost",
            revealedTile: { row, col, isBomb: true },
            bombPositions: gameSession.outcome.bombPositions
          }
        });
      } else {
        // Update multiplier
        const settings = await MinesGameSettings.findOne().session(session);
        const newMultiplier = gameSession.outcome.multiplier + settings.multiplierIncrement;
        gameSession.outcome.multiplier = newMultiplier;
        gameSession.outcome.revealedTiles = newRevealedTiles;
        await gameSession.save({ session });
        
        await session.commitTransaction();
        
        return res.json({
          success: true,
          data: {
            result: "safe",
            revealedTile: { row, col, isBomb: false },
            currentMultiplier: newMultiplier,
            potentialReward: gameSession.betAmount * newMultiplier
          }
        });
      }
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    } finally {
      session.endSession();
    }
  }

  async cashOut(req, res) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      
      const { userId, role } = req.user;
      const { sessionId } = req.body;
      
      // Get session
      const gameSession = await GameSession.findOne({ 
        sessionId, 
        userId, 
        userType: role 
      }).session(session);
      
      if (!gameSession || gameSession.state !== "active") {
        throw new Error("Invalid session");
      }
      
      // Calculate winnings
      const winnings = gameSession.betAmount * gameSession.outcome.multiplier;
      
      // Update user balance
      const user = await this.updateUserBalance(userId, winnings);
      await this.createTransaction(
        userId, 
        role, 
        winnings, 
        "game_win", 
        gameSession.sessionId
      );
      
      // Add to bet history
      await this.addToBetHistory(userId, {
        player: "mines",
        odds: `${gameSession.outcome.multiplier}x`,
        amount: gameSession.betAmount,
        result: "win",
        winnings: winnings,
        createdAt: new Date()
      });
      
      // Update session
      gameSession.state = "cashed_out";
      gameSession.winAmount = winnings;
      gameSession.completedAt = new Date();
      await gameSession.save({ session });
      
      await session.commitTransaction();
      
      res.json({
        success: true,
        data: {
          winnings,
          newBalance: user.money,
          multiplier: gameSession.outcome.multiplier
        }
      });
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    } finally {
      session.endSession();
    }
  }
}

// Admin Game Controller
class AdminGameController {
  async updateColorSettings(req, res) {
    try {
      const updates = req.body;
      const settings = await ColorGameSettings.findOneAndUpdate(
        {}, 
        updates, 
        { new: true, upsert: true }
      );
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async updateMinesSettings(req, res) {
    try {
      const updates = req.body;
      const settings = await MinesGameSettings.findOneAndUpdate(
        {}, 
        updates, 
        { new: true, upsert: true }
      );
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async getGameSessions(req, res) {
    try {
      const { gameType, userId, limit = 50 } = req.query;
      const query = {};
      if (gameType) query.gameType = gameType;
      if (userId) query.userId = userId;
      
      const sessions = await GameSession.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async getGameStats(req, res) {
    try {
      const { gameType } = req.query;
      const match = {};
      if (gameType) match.gameType = gameType;
      
      const stats = await GameSession.aggregate([
        { $match: match },
        { 
          $group: {
            _id: "$gameType",
            totalBets: { $sum: 1 },
            totalBetAmount: { $sum: "$betAmount" },
            totalWins: { $sum: { $cond: [{ $gt: ["$winAmount", 0] }, 1, 0] } },
            totalWinAmount: { $sum: "$winAmount" },
            houseEdge: { 
              $avg: { 
                $subtract: ["$betAmount", "$winAmount"] 
              } 
            }
          }
        }
      ]);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

module.exports = {
  GameController,
  ColorGameController,
  MinesController,
  AdminGameController,
  colorGame: new ColorGameController(),
  minesGame: new MinesController(),
  adminGame: new AdminGameController()
};