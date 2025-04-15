const { PlinkoGameSettings, GameSession, Transaction } = require("../models/gameModels");
const User = require("../models/user");
const { BadRequestError, NotFoundError } = require("../errors/customErrors");

class PlinkoController {
  constructor() {
    this.simulateBallPath = this.simulateBallPath.bind(this);
    this.generatePegPositions = this.generatePegPositions.bind(this);
  }

  async getSettings(req, res) {
    try {
      let settings = await PlinkoGameSettings.findOne();
      
      if (!settings) {
        settings = await PlinkoGameSettings.create({});
      }
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error("Failed to get Plinko settings:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to retrieve Plinko settings",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async placeBet(req, res) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      
      const { userId, role } = req.user;
      const { betAmount } = req.body;
      
      // Get settings with session
      const settings = await PlinkoGameSettings.findOne().session(session);
      if (!settings) throw new NotFoundError("Plinko settings not found");
      
      // Validate bet amount
      if (betAmount < settings.minBet || betAmount > settings.maxBet) {
        throw new BadRequestError(`Bet must be between ${settings.minBet} and ${settings.maxBet}`);
      }
      
      // Get user with session
      const user = await User.findOne({ userId }).session(session);
      if (!user) throw new NotFoundError("User not found");
      
      // Check balance
      if (user.money < betAmount) {
        throw new BadRequestError("Insufficient balance");
      }
      
      // Deduct bet amount
      user.money -= betAmount;
      user.totalBets += betAmount;
      await user.save({ session });
      
      // Create bet transaction
      const betTransaction = new Transaction({
        transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId,
        userType: role,
        amount: -betAmount,
        type: "game_bet",
        gameType: "plinko",
        status: "completed"
      });
      await betTransaction.save({ session });
      
      // Simulate ball drop
      const { finalSlot, path } = this.simulateBallPath(settings.fixedDropPosition, settings);
      const multiplier = settings.slots[finalSlot];
      const winAmount = betAmount * multiplier;
      
      // Create game session
      const gameSession = new GameSession({
        sessionId: `plinko_${Date.now()}_${userId}`,
        gameType: "plinko",
        userId,
        userType: role,
        betAmount,
        state: "completed",
        outcome: { multiplier, winAmount },
        winAmount,
        plinkoDetails: {
          path,
          finalSlot,
          multiplier
        },
        completedAt: new Date()
      });
      await gameSession.save({ session });
      
      // Update user if won
      if (winAmount > 0) {
        user.money += winAmount;
        await user.save({ session });
        
        // Add to bet history
        user.betHistory.push({
          player: "plinko",
          odds: `${multiplier}x`,
          amount: betAmount,
          result: "win",
          winnings: winAmount
        });
        await user.save({ session });
        
        // Create win transaction
        const winTransaction = new Transaction({
          transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          userId,
          userType: role,
          amount: winAmount,
          type: "game_win",
          gameType: "plinko",
          gameSessionId: gameSession.sessionId,
          status: "completed",
          metadata: { multiplier }
        });
        await winTransaction.save({ session });
      } else {
        // Add to bet history for loss
        user.betHistory.push({
          player: "plinko",
          odds: `${multiplier}x`,
          amount: betAmount,
          result: "lose",
          winnings: 0
        });
        await user.save({ session });
        
        // Create loss transaction
        const lossTransaction = new Transaction({
          transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          userId,
          userType: role,
          amount: -betAmount,
          type: "game_loss",
          gameType: "plinko",
          gameSessionId: gameSession.sessionId,
          status: "completed"
        });
        await lossTransaction.save({ session });
      }
      
      await session.commitTransaction();
      
      res.json({
        success: true,
        data: {
          finalSlot,
          winAmount,
          multiplier,
          newBalance: user.money,
          path
        }
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Plinko bet error:", error);
      
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || "Failed to place Plinko bet",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      session.endSession();
    }
  }

  simulateBallPath(dropPosition, settings) {
    const path = [];
    const slotCount = settings.slots.length;
    const slotWidth = settings.boardWidth / slotCount;
    
    const physics = settings.physics || {
      gravity: 0.2,
      friction: 0.92,
      restitution: 0.65,
      randomness: 0.15,
      terminalVelocity: 5
    };
    
    const ball = {
      x: dropPosition / 100 * settings.boardWidth,
      y: 0,
      vx: 0,
      vy: 0.1,
      radius: settings.ballSize / 2,
    };
    
    path.push({ x: ball.x, y: ball.y });
    
    const pegs = this.generatePegPositions(settings);
    const pegsByRow = {};
    
    pegs.forEach(peg => {
      const row = Math.round(peg.y / (settings.boardHeight / settings.rows));
      if (!pegsByRow[row]) pegsByRow[row] = [];
      pegsByRow[row].push(peg);
    });
    
    let currentRow = 0;
    const maxRow = Math.max(...Object.keys(pegsByRow).map(Number));
    
    while (ball.y < settings.boardHeight) {
      ball.vy = Math.min(ball.vy + physics.gravity, physics.terminalVelocity);
      ball.x += ball.vx;
      ball.y += ball.vy;
      
      if (currentRow <= maxRow && pegsByRow[currentRow]) {
        for (const peg of pegsByRow[currentRow]) {
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = ball.radius + settings.pegSize / 2;
          
          if (distance < minDistance) {
            const nx = dx / distance;
            const ny = dy / distance;
            const overlap = minDistance - distance;
            
            ball.x += nx * overlap * 0.5;
            ball.y += ny * overlap * 0.5;
            
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx = (ball.vx - 2 * dot * nx) * physics.restitution;
            ball.vy = (ball.vy - 2 * dot * ny) * physics.restitution;
            
            ball.vx += (Math.random() - 0.5) * physics.randomness;
            ball.vy += (Math.random() - 0.1) * physics.randomness;
          }
        }
      }
      
      if (ball.y > (currentRow + 1) * (settings.boardHeight / settings.rows)) {
        currentRow++;
      }
      
      if (ball.x < ball.radius) {
        ball.x = ball.radius;
        ball.vx = -ball.vx * physics.friction;
      } else if (ball.x > settings.boardWidth - ball.radius) {
        ball.x = settings.boardWidth - ball.radius;
        ball.vx = -ball.vx * physics.friction;
      }
      
      ball.vx *= physics.friction;
      ball.vy *= physics.friction;
      
      if (path.length < 2 || 
          Math.abs(ball.x - path[path.length-1].x) > 1 || 
          Math.abs(ball.y - path[path.length-1].y) > 1) {
        path.push({ x: ball.x, y: ball.y });
      }
    }
    
    const finalSlot = Math.min(
      Math.floor(ball.x / slotWidth), 
      slotCount - 1
    );
    
    path.push({ 
      x: (finalSlot + 0.5) * slotWidth, 
      y: settings.boardHeight 
    });
    
    return { 
      finalSlot,
      path: path.map(p => ({
        x: (p.x / settings.boardWidth) * 100,
        y: (p.y / settings.boardHeight) * 100
      }))
    };
  }

  generatePegPositions(settings) {
    const pegs = [];
    const { rows, boardWidth, boardHeight, pegSize } = settings;
    
    const verticalSpacing = boardHeight / rows;
    const horizontalPadding = pegSize * 2;
    
    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 1;
      const availableWidth = boardWidth - horizontalPadding * 2;
      const horizontalSpacing = availableWidth / pegsInRow;
      
      for (let col = 0; col < pegsInRow; col++) {
        pegs.push({
          x: horizontalPadding + col * horizontalSpacing + horizontalSpacing / 2,
          y: (row + 1) * verticalSpacing,
        });
      }
    }
    
    return pegs;
  }

  async getHistory(req, res) {
    try {
      const { userId, role } = req.user;
      const { limit = 20, page = 1 } = req.query;
      
      const history = await GameSession.find({ 
        userId, 
        userType: role,
        gameType: "plinko"
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
      
      const total = await GameSession.countDocuments({ 
        userId, 
        userType: role,
        gameType: "plinko" 
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
      console.error("Failed to get Plinko history:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to retrieve Plinko history",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new PlinkoController();