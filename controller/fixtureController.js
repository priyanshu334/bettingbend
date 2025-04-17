// controllers/fixtureController.js
const Match = require('../models/Match');
const mongoose = require('mongoose');

// Define roles considered bowlers (adjust as needed)
const bowlingRoles = ['Bowler', 'Allrounder', 'Bowling Allrounder'];

// @desc    Get Bowler Runs Conceded Odds for a specific match
// @route   GET /api/fixtures/:matchId/odds/bowler-runs
// @access  Public (adjust as needed)
exports.getBowlerRunsOdds = async (req, res) => {
  try {
    const matchId = req.params.matchId;

    // Validate if matchId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Invalid Match ID format' });
    }

    // Find the match and populate player names within the embedded odds
    // We only need player names here, so specify 'fullName'
    const match = await Match.findById(matchId)
      .populate('bowlerRunsOdds.playerId', 'fullName'); // Populate only player name

    if (!match) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    // Structure the response
    const response = {
      localTeam: {
        teamId: match.localTeam.teamId,
        teamName: match.localTeam.name,
        bowlers: []
      },
      visitorTeam: {
        teamId: match.visitorTeam.teamId,
        teamName: match.visitorTeam.name,
        bowlers: []
      }
    };

    // Process the embedded bowlerRunsOdds data
    if (match.bowlerRunsOdds && match.bowlerRunsOdds.length > 0) {
      match.bowlerRunsOdds.forEach(odd => {
        // Ensure the player was successfully populated (might be null if player doc deleted)
        if (odd.playerId && odd.playerId.fullName) {
           const bowlerData = {
             // Use the actual ObjectId as playerId, frontend might not need it, but good practice
             playerId: odd.playerId._id,
             name: odd.playerId.fullName, // Get the populated name
             predictedRunsConceded: odd.predictedRunsConceded,
             odds: odd.odds
           };

           // Add to the correct team's array
           if (odd.teamId === response.localTeam.teamId) {
             response.localTeam.bowlers.push(bowlerData);
           } else if (odd.teamId === response.visitorTeam.teamId) {
             response.visitorTeam.bowlers.push(bowlerData);
           }
        } else {
            console.warn(`Could not populate player data for odds entry in match ${matchId}. Player ID may be invalid or deleted.`);
        }
      });
    } else {
        // --- Optional: Alternative Logic if bowlerRunsOdds is empty ---
        // If you want to dynamically find bowlers from the lineup and return
        // *placeholder* odds when no pre-calculated odds exist, add that logic here.
        // This involves populating the lineup players first:
        // const matchWithLineup = await Match.findById(matchId).populate('lineup.playerId', 'fullName position');
        // Then filter matchWithLineup.lineup for non-substitutes whose position is in bowlingRoles.
        // Then generate placeholder odds for them.
        console.log(`No pre-calculated bowler odds found in DB for match ${matchId}. Returning empty arrays.`);
        // For now, we just return the empty arrays initialized above.
    }


    res.status(200).json(response);

  } catch (err) {
    console.error('Error fetching bowler runs odds:', err);
    res.status(500).json({ message: 'Server error while fetching bowler runs odds.' });
  }
};