require("dotenv").config();
const cron = require("node-cron");
const { settleBowlerRunsBets } = require("../controller/BowlerRunsController");

function startBowlerRunsCron(matchId = process.env.MATCH_ID) {
  if (!matchId) {
    throw new Error("❌ BOWLER_MATCH_ID must be provided or set in environment variables.");
  }

  cron.schedule("*/5 * * * *", async () => {
    console.log(`🎯 Running bowler runs settlement cron for matchId: ${matchId}...`);

    try {
      const result = await settleBowlerRunsBets(matchId);
      console.log(result.message);
    } catch (err) {
      console.error("❌ Error in bowler runs cron job:", err.message);
    }
  });

  console.log(`✅ Bowler runs cron job scheduled for matchId: ${matchId}`);
}

module.exports = { startBowlerRunsCron };
