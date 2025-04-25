require("dotenv").config();
const cron = require("node-cron");
const { settlePlayerWicketsBets } = require("../controller/PlayerWicketsController");

function startPlayerWicketsCron(matchId = process.env.MATCH_ID) {
  if (!matchId) {
    throw new Error("❌ MATCH_ID must be provided or set in environment variables.");
  }

  cron.schedule("*/5 * * * *", async () => {
    console.log(`📊 Running player wickets settlement cron for matchId: ${matchId}...`);

    try {
      const result = await settlePlayerWicketsBets(matchId);
      console.log(result.message);
    } catch (err) {
      console.error("❌ Error in player wickets cron:", err.message);
    }
  });

  console.log(`✅ Player wickets cron job scheduled for matchId: ${matchId}`);
}

module.exports = { startPlayerWicketsCron };
