require("dotenv").config();
const cron = require("node-cron");
const { settleMatchBets } = require("../controller/MatchdataController");

function startMatchDataCron(matchId = process.env.MATCH_ID) {
  if (!matchId) {
    throw new Error("❌ MATCH_ID must be provided or set in environment variables.");
  }

  cron.schedule("*/1 * * * *", async () => {
    console.log(`🎯 Running match data settlement cron for matchId: ${matchId}...`);

    try {
      const result = await settleMatchBets(matchId);
      console.log(result.message);
    } catch (err) {
      console.error("❌ Error in match data cron:", err.message);
    }
  });

  console.log(`✅ Match data cron job scheduled for matchId: ${matchId}`);
}

module.exports = { startMatchDataCron };
