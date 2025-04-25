require("dotenv").config(); // Always load env at top
const cron = require("node-cron");
const { settleBoundaryBets } = require("../controller/BoundryBetController");

function startBoundaryBetCron(matchId = process.env.MATCH_ID) {
  if (!matchId) {
    throw new Error("❌ MATCH_ID must be provided or set in environment variables.");
  }

  cron.schedule("*/1 * * * *", async () => {
    console.log(`🔄 Running boundary bet settlement cron for matchId: ${matchId}...`);

    try {
      const result = await settleBoundaryBets(matchId);
      console.log(result.message);
    } catch (err) {
      console.error(`❌ Failed to settle boundary bets for ${matchId}:`, err.message);
    }
  });

  console.log(`✅ Boundary bet cron job scheduled for matchId: ${matchId}`);
}

module.exports = { startBoundaryBetCron };
