const BoundaryBet = require("../models/BoundaryBet");
const User = require("../models/user");
const axios = require("axios");
const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

// 1️⃣ Place a Boundary Bet
const placeBoundaryBet = async (req, res) => {
  try {
    const { userId, matchId, teamName, playerName, predictedBoundaries, betAmount } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.money < betAmount) return res.status(400).json({ message: "Insufficient balance" });

    // Deduct bet amount
    user.money -= betAmount;const Bet = require("../models/MatchdataModel");
    const User = require("../models/user");
    
    const axios = require("axios");
    const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
    
    // 1️⃣ Place a Bet
    const placeBet = async (req, res) => {const Bet = require("../models/MatchdataModel");
      const User = require("../models/user");
      
      const axios = require("axios");
      const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
      
      // 1️⃣ Place a Bet
      const placeBet = async (req, res) => {
        try {
          const { userId, matchId, teamId, marketType, betCondition, overs, statType, odds, amount } = req.body;
      
          // Check if user exists
          const user = await User.findById(userId);
          if (!user) return res.status(404).json({ message: "User not found" });
      
          if (user.money < amount) return res.status(400).json({ message: "Insufficient balance" });
      
          // Deduct money from user
          user.money -= amount;
          await user.save();
      
          // Create the bet
          const newBet = new Bet({
            userId,
            matchId,
            teamId,
            marketType,
            betCondition,
            overs,
            statType,
            odds,
            amount,
          });
      
          await newBet.save();
      
          res.status(201).json({ message: "Bet placed successfully", bet: newBet });
        } catch (err) {
          console.error("Error placing bet:", err);
          res.status(500).json({ error: err.message });
        }
      };
      
      const settleMatchBets = async (fixtureId, matchId) => {
        try {
          const { data } = await axios.get(
            `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureId}?include=tosswon,winner&api_token=${SPORTMONKS_API_TOKEN}`
          );
      
          const matchData = data.data;
          const tossWinnerId = matchData.tosswon_id;
          const matchWinnerId = matchData.winner_team_id;
      
          const allUnsettledBets = await Bet.find({ matchId, resultChecked: false });
      
          let settledCount = 0;
      
          for (const bet of allUnsettledBets) {
            const user = await User.findById(bet.userId);
            if (!user) continue;
      
            let isWin = false;
            let canSettle = false;
      
            switch (bet.marketType) {
              case "toss":
                if (tossWinnerId !== null && tossWinnerId !== undefined) {
                  canSettle = true;
                  isWin = bet.betCondition === tossWinnerId.toString();
                }
                break;
      
              case "match_odds":
              case "winner":
                if (matchWinnerId !== null && matchWinnerId !== undefined) {
                  canSettle = true;
                  isWin = bet.betCondition === matchWinnerId.toString();
                }
                break;
      
              // Add cases for other market types as needed
              default:
                console.warn(`⚠️ Unknown or unsupported marketType: ${bet.marketType}`);
            }
      
            if (!canSettle) {
              console.log(`⏳ Skipping bet (${bet.marketType}) – result not available yet`);
              continue;
            }
      
            // Mark bet as settled
            bet.status = isWin ? "won" : "lost";
            bet.resultChecked = true;
            await bet.save();
      
            // Update user balance
            if (isWin) {
              const winnings = bet.amount * bet.odds;
              user.money += winnings;
              await user.save();
            }
      
            settledCount++;
          }
      
          return {
            message: `✅ Settled ${settledCount} bets for match ${matchId}`,
          };
        } catch (err) {
          console.error("❌ Error settling bets:", err.message);
          throw new Error("Failed to settle bets. Please check logs.");
        }
      };
      
      module.exports = {
        placeBet,
        settleMatchBets
      };
      try {
        const { userId, matchId, teamId, marketType, betCondition, overs, statType, odds, amount } = req.body;
    
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
    
        if (user.money < amount) return res.status(400).json({ message: "Insufficient balance" });
    
        // Deduct money from user
        user.money -= amount;
        await user.save();
    
        // Create the bet
        const newBet = new Bet({
          userId,
          matchId,
          teamId,
          marketType,
          betCondition,
          overs,
          statType,
          odds,
          amount,
        });
    
        await newBet.save();
    
        res.status(201).json({ message: "Bet placed successfully", bet: newBet });
      } catch (err) {
        console.error("Error placing bet:", err);
        res.status(500).json({ error: err.message });
      }
    };
    
    const settleMatchBets = async (fixtureId, matchId) => {
      try {
        const { data } = await axios.get(
          `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureId}?include=tosswon,winner&api_token=${SPORTMONKS_API_TOKEN}`
        );
    
        const matchData = data.data;
        const tossWinnerId = matchData.tosswon_id;
        const matchWinnerId = matchData.winner_team_id;
    
        const allUnsettledBets = await Bet.find({ matchId, resultChecked: false });
    
        let settledCount = 0;
    
        for (const bet of allUnsettledBets) {
          const user = await User.findById(bet.userId);
          if (!user) continue;
    
          let isWin = false;
          let canSettle = false;
    
          switch (bet.marketType) {
            case "toss":
              if (tossWinnerId !== null && tossWinnerId !== undefined) {
                canSettle = true;
                isWin = bet.betCondition === tossWinnerId.toString();
              }
              break;
    
            case "match_odds":
            case "winner":
              if (matchWinnerId !== null && matchWinnerId !== undefined) {
                canSettle = true;
                isWin = bet.betCondition === matchWinnerId.toString();
              }
              break;
    
            // Add cases for other market types as needed
            default:
              console.warn(`⚠️ Unknown or unsupported marketType: ${bet.marketType}`);
          }
    
          if (!canSettle) {
            console.log(`⏳ Skipping bet (${bet.marketType}) – result not available yet`);
            continue;
          }
    
          // Mark bet as settled
          bet.status = isWin ? "won" : "lost";
          bet.resultChecked = true;
          await bet.save();
    
          // Update user balance
          if (isWin) {
            const winnings = bet.amount * bet.odds;
            user.money += winnings;
            await user.save();
          }
    
          settledCount++;
        }
    
        return {
          message: `✅ Settled ${settledCount} bets for match ${matchId}`,
        };
      } catch (err) {
        console.error("❌ Error settling bets:", err.message);
        throw new Error("Failed to settle bets. Please check logs.");
      }
    };
    
    module.exports = {
      placeBet,
      settleMatchBets
    };
    await user.save();

    const newBet = new BoundaryBet({
      userId,
      matchId,
      teamName,
      playerName,
      predictedBoundaries,
      betAmount,
    });

    await newBet.save();

    res.status(201).json({ message: "Boundary bet placed successfully", bet: newBet });
  } catch (err) {
    console.error("Error placing boundary bet:", err.message);
    res.status(500).json({ error: err.message });
  }
};


const settleBoundaryBets = async (fixtureId, matchId) => {
    try {
      const { data } = await axios.get(
        `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureId}?include=batting,team,stage,scoreboards&api_token=${SPORTMONKS_API_TOKEN}`
      );
  
      const matchData = data.data;
      const playerStats = matchData.batting;
  
      const bets = await BoundaryBet.find({ matchId, resultChecked: false });
  
      let settled = 0;
  
      for (const bet of bets) {
        const user = await User.findById(bet.userId);
        if (!user) continue;
  
        const player = playerStats.find(
          (p) =>
            p.team.name.toLowerCase() === bet.teamName.toLowerCase() &&
            p.batsman && p.batsman.fullname.toLowerCase() === bet.playerName.toLowerCase()
        );
  
        if (!player) {
          console.log(`Player stats not found for ${bet.playerName}`);
          continue;
        }
  
        const boundariesHit = player.fours + player.sixes;
  
        const isWin = boundariesHit === bet.predictedBoundaries;
  
        bet.isWon = isWin;
        bet.resultChecked = true;
  
        if (isWin) {
          const winnings = bet.betAmount * 2; // double payout
          bet.payoutAmount = winnings;
          user.money += winnings;
        }
  
        await bet.save();
        await user.save();
        settled++;
      }
  
      return {
        message: `✅ Settled ${settled} boundary bets for match ${matchId}`,
      };
    } catch (err) {
      console.error("❌ Error settling boundary bets:", err.message);
      throw new Error("Failed to settle boundary bets.");
    }
  };
  

  module.exports = {
    placeBoundaryBet,
    settleBoundaryBets,
  };
  