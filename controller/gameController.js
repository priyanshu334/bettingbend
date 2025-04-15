const {
    ColorGameSettings,
    MinesGameSettings,
    GameSession,
    Transaction
  } = require("../models/gameModels");
  
  // Helper function to get user model based on type
  const getUserModel = (userType) => {
    switch(userType) {
      case "admin": return require("../models/admin");
      case "member": return require("../models/member");
      default: return require("../models/user");
    }
  };
  
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
  
    async updateUserBalance(userId, userType, amount) {
      const UserModel = getUserModel(userType);
      const idField = userType === "user" ? "userId" : `${userType}Id`;
      
      const user = await UserModel.findOneAndUpdate(
        { [idField]: userId },
        { $inc: { money: amount } },
        { new: true }
      );
      
      return user;
    }
  }
  
  // Color Prediction Game Controller
  class ColorGameController extends GameController {
    async getSettings(req, res) {
      try {
        const settings = await ColorGameSettings.findOne();
        res.json(settings || await ColorGameSettings.create({}));
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  
    async placeBet(req, res) {
      try {
        const { userId, role } = req.user;
        const { betAmount, selectedColor } = req.body;
        
        // Get settings
        const settings = await ColorGameSettings.findOne();
        
        // Validate bet
        if (betAmount < settings.minBet || betAmount > settings.maxBet) {
          return res.status(400).json({ message: `Bet must be between ${settings.minBet} and ${settings.maxBet}` });
        }
        
        // Deduct bet amount
        const user = await this.updateUserBalance(userId, role, -betAmount);
        await this.createTransaction(userId, role, -betAmount, "game_bet");
        
        // Create game session
        const session = await this.createGameSession("color-prediction", userId, role, betAmount);
        
        // Determine outcome
        const predictedColor = settings.nextColor === "random" 
          ? settings.colors[Math.floor(Math.random() * settings.colors.length)]
          : settings.nextColor;
        
        const isWin = selectedColor === predictedColor;
        let winAmount = 0;
        
        if (isWin) {
          winAmount = betAmount * settings.multipliers[selectedColor];
          await this.updateUserBalance(userId, role, winAmount);
          await this.createTransaction(userId, role, winAmount, "game_win", session.sessionId);
        } else {
          await this.createTransaction(userId, role, -betAmount, "game_loss", session.sessionId);
        }
        
        // Update session
        session.state = isWin ? "completed" : "lost";
        session.outcome = { selectedColor, predictedColor };
        session.winAmount = winAmount;
        session.completedAt = new Date();
        await session.save();
        
        res.json({
          predictedColor,
          isWin,
          winAmount,
          newBalance: user.money
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  
    async getHistory(req, res) {
      try {
        const { userId, role } = req.user;
        const history = await GameSession.find({ 
          userId, 
          userType: role,
          gameType: "color-prediction"
        }).sort({ createdAt: -1 }).limit(20);
        
        res.json(history);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  }
  
  // Mines Game Controller
  class MinesController extends GameController {
    async getSettings(req, res) {
      try {
        const settings = await MinesGameSettings.findOne();
        res.json(settings || await MinesGameSettings.create({}));
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  
    async startGame(req, res) {
      try {
        const { userId, role } = req.user;
        const { betAmount } = req.body;
        
        // Get settings
        const settings = await MinesGameSettings.findOne();
        
        // Validate bet
        if (betAmount < settings.minBet || betAmount > settings.maxBet) {
          return res.status(400).json({ message: `Bet must be between ${settings.minBet} and ${settings.maxBet}` });
        }
        
        // Deduct bet amount
        const user = await this.updateUserBalance(userId, role, -betAmount);
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
        const session = await this.createGameSession("mines", userId, role, betAmount);
        session.outcome = { bombPositions, revealedTiles: [], multiplier: settings.baseMultiplier };
        await session.save();
        
        res.json({
          sessionId: session.sessionId,
          gridSize: settings.gridSize,
          currentBalance: user.money
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  
    async revealTile(req, res) {
      try {
        const { userId, role } = req.user;
        const { sessionId, row, col } = req.body;
        
        // Get session
        const session = await GameSession.findOne({ sessionId, userId, userType: role });
        if (!session || session.state !== "active") {
          return res.status(400).json({ message: "Invalid session" });
        }
        
        // Get settings
        const settings = await MinesGameSettings.findOne();
        
        // Check if tile is already revealed
        if (session.outcome.revealedTiles.some(t => t.row === row && t.col === col)) {
          return res.status(400).json({ message: "Tile already revealed" });
        }
        
        // Check if tile is a bomb
        const isBomb = session.outcome.bombPositions.some(pos => pos.row === row && pos.col === col);
        
        // Update revealed tiles
        const newRevealedTiles = [
          ...session.outcome.revealedTiles, 
          { row, col, isBomb }
        ];
        
        if (isBomb) {
          // Game over - player loses
          session.state = "lost";
          session.completedAt = new Date();
          await session.save();
          
          await this.createTransaction(
            userId, 
            role, 
            -session.betAmount, 
            "game_loss", 
            session.sessionId
          );
          
          return res.json({
            result: "lost",
            revealedTile: { row, col, isBomb: true },
            bombPositions: session.outcome.bombPositions
          });
        } else {
          // Update multiplier
          const newMultiplier = session.outcome.multiplier + settings.multiplierIncrement;
          session.outcome.multiplier = newMultiplier;
          session.outcome.revealedTiles = newRevealedTiles;
          await session.save();
          
          return res.json({
            result: "safe",
            revealedTile: { row, col, isBomb: false },
            currentMultiplier: newMultiplier,
            potentialReward: session.betAmount * newMultiplier
          });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  
    async cashOut(req, res) {
      try {
        const { userId, role } = req.user;
        const { sessionId } = req.body;
        
        // Get session
        const session = await GameSession.findOne({ sessionId, userId, userType: role });
        if (!session || session.state !== "active") {
          return res.status(400).json({ message: "Invalid session" });
        }
        
        // Calculate winnings
        const winnings = session.betAmount * session.outcome.multiplier;
        
        // Update user balance
        const user = await this.updateUserBalance(userId, role, winnings);
        await this.createTransaction(
          userId, 
          role, 
          winnings, 
          "game_win", 
          session.sessionId
        );
        
        // Update session
        session.state = "cashed_out";
        session.winAmount = winnings;
        session.completedAt = new Date();
        await session.save();
        
        res.json({
          winnings,
          newBalance: user.money,
          multiplier: session.outcome.multiplier
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  }
  
  // Admin Game Controller
  class AdminGameController {
    async updateColorSettings(req, res) {
      try {
        const updates = req.body;
        const settings = await ColorGameSettings.findOneAndUpdate({}, updates, { new: true });
        res.json(settings);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  
    async updateMinesSettings(req, res) {
      try {
        const updates = req.body;
        const settings = await MinesGameSettings.findOneAndUpdate({}, updates, { new: true });
        res.json(settings);
      } catch (error) {
        res.status(500).json({ error: error.message });
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
        
        res.json(sessions);
      } catch (error) {
        res.status(500).json({ error: error.message });
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
              totalWinAmount: { $sum: "$winAmount" }
            }
          }
        ]);
        
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  }
  
// At the bottom of gameController.js, replace:


// With:
module.exports = {
  GameController, // Export the base class
  ColorGameController,
  MinesController,
  AdminGameController,
  // Keep the instances if you need them elsewhere
  colorGame: new ColorGameController(),
  minesGame: new MinesController(),
  adminGame: new AdminGameController()
};