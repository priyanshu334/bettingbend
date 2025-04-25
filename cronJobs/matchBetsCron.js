require("dotenv").config();
const cron = require("node-cron");
const { settleMatchBets } = require("../controller/RunsAndWicketsController");

function startMatchBetsCron(matchId = process.env.MATCH_ID) {
  if (!matchId) {
    throw new Error("❌ MATCH_ID must be provided or set in environment variables.");
  }

  cron.schedule("*/5 * * * *", async () => {
    console.log(`📊 Running match bets settlement cron for matchId: ${matchId}...`);

    try {
      const result = await settleMatchBets(matchId);
      console.log(result.message);
    } catch (err) {
      console.error("❌ Error in match bets cron:", err.message);
    }
  });

  console.log(`✅ Match bets cron job scheduled for matchId: ${matchId}`);
}

module.exports = { startMatchBetsCron };
