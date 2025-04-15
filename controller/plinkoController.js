const { PlinkoGameSettings, GameSession, Transaction } = require("../models/gameModels");
const {GameController} = require("../controller/gameController");

class PlinkoController extends GameController {
  async getSettings(req, res) {
    try {
      const settings = await PlinkoGameSettings.findOne();
      res.json(settings || await PlinkoGameSettings.create({}));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async placeBet(req, res) {
    try {
      const { userId, role } = req.user;
      const { betAmount, dropPosition } = req.body;
      
      // Get settings
      const settings = await PlinkoGameSettings.findOne();
      
      // Validate bet
      if (betAmount < settings.minBet || betAmount > settings.maxBet) {
        return res.status(400).json({ message: `Bet must be between ${settings.minBet} and ${settings.maxBet}` });
      }
      
      // Deduct bet amount
      const user = await this.updateUserBalance(userId, role, -betAmount);
      await this.createTransaction(userId, role, -betAmount, "game_bet");
      
      // Create game session
      const session = await this.createGameSession("plinko", userId, role, betAmount);
      
      // Simulate ball drop using the same physics as frontend
      const { finalSlot, path } = this.simulateBallPath(dropPosition, settings);
      const winAmount = betAmount * settings.slots[finalSlot];
      
      // Update user balance if won
      if (winAmount > 0) {
        await this.updateUserBalance(userId, role, winAmount);
        await this.createTransaction(userId, role, winAmount, "game_win", session.sessionId);
      } else {
        await this.createTransaction(userId, role, -betAmount, "game_loss", session.sessionId);
      }
      
      // Update session
      session.state = "completed";
      session.outcome = { 
        dropPosition, 
        finalSlot,
        path, // Store the path for potential debugging/replay
        multiplier: settings.slots[finalSlot]
      };
      session.winAmount = winAmount;
      session.completedAt = new Date();
      await session.save();
      
      res.json({
        finalSlot,
        winAmount,
        newBalance: user.money,
        multiplier: settings.slots[finalSlot],
        path // Optional: send path back to frontend for verification
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Physics simulation matching frontend logic
  simulateBallPath(dropPosition, settings) {
    const path = [];
    const slotCount = settings.slots.length;
    const slotWidth = settings.boardWidth / slotCount;
    
    // Physics parameters (should match frontend)
    const physics = {
      gravity: 0.2,
      friction: 0.92,
      restitution: 0.65,
      randomness: 0.15,
      terminalVelocity: 5,
    };
    
    // Ball state
    const ball = {
      x: dropPosition / 100 * settings.boardWidth, // Convert % to px
      y: 0,
      vx: 0,
      vy: 0.1,
      radius: settings.ballSize / 2,
    };
    
    path.push({ x: ball.x, y: ball.y });
    
    // Generate pegs (same layout as frontend)
    const pegs = this.generatePegPositions(settings);
    
    // Organize pegs by row for efficient collision detection
    const pegsByRow = {};
    pegs.forEach(peg => {
      const row = Math.round(peg.y / (settings.boardHeight / settings.rows));
      if (!pegsByRow[row]) pegsByRow[row] = [];
      pegsByRow[row].push(peg);
    });
    
    let currentRow = 0;
    const maxRow = Math.max(...Object.keys(pegsByRow).map(Number));
    
    while (ball.y < settings.boardHeight) {
      // Apply forces (same as frontend)
      ball.vy = Math.min(ball.vy + physics.gravity, physics.terminalVelocity);
      
      // Update position
      ball.x += ball.vx;
      ball.y += ball.vy;
      
      // Check for collisions with current row
      if (currentRow <= maxRow && pegsByRow[currentRow]) {
        for (const peg of pegsByRow[currentRow]) {
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = ball.radius + settings.pegSize / 2;
          
          if (distance < minDistance) {
            // Collision response (same as frontend)
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Position correction
            const overlap = minDistance - distance;
            ball.x += nx * overlap * 0.5;
            ball.y += ny * overlap * 0.5;
            
            // Calculate impulse
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx = (ball.vx - 2 * dot * nx) * physics.restitution;
            ball.vy = (ball.vy - 2 * dot * ny) * physics.restitution;
            
            // Add randomness
            ball.vx += (Math.random() - 0.5) * physics.randomness;
            ball.vy += (Math.random() - 0.1) * physics.randomness;
          }
        }
      }
      
      // Move to next row if we've passed it
      if (ball.y > (currentRow + 1) * (settings.boardHeight / settings.rows)) {
        currentRow++;
      }
      
      // Boundary collisions (same as frontend)
      if (ball.x < ball.radius) {
        ball.x = ball.radius;
        ball.vx = -ball.vx * physics.friction;
      } else if (ball.x > settings.boardWidth - ball.radius) {
        ball.x = settings.boardWidth - ball.radius;
        ball.vx = -ball.vx * physics.friction;
      }
      
      // Apply friction
      ball.vx *= physics.friction;
      ball.vy *= physics.friction;
      
      // Record position (with decimation to optimize)
      if (path.length < 2 || 
          Math.abs(ball.x - path[path.length-1].x) > 1 || 
          Math.abs(ball.y - path[path.length-1].y) > 1) {
        path.push({ x: ball.x, y: ball.y });
      }
    }
    
    // Determine final slot (same as frontend)
    const finalSlot = Math.min(
      Math.floor(ball.x / slotWidth), 
      slotCount - 1
    );
    
    // Add final position
    path.push({ 
      x: (finalSlot + 0.5) * slotWidth, 
      y: settings.boardHeight 
    });
    
    return { 
      finalSlot,
      path: path.map(p => ({
        x: (p.x / settings.boardWidth) * 100, // Convert back to %
        y: (p.y / settings.boardHeight) * 100
      }))
    };
  }

  // Peg generation matching frontend logic
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
      const history = await GameSession.find({ 
        userId, 
        userType: role,
        gameType: "plinko"
      }).sort({ createdAt: -1 }).limit(20);
      
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PlinkoController();