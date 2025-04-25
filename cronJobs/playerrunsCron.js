// crons/playerRunsCron.js
const cron = require("node-cron");
const { settlePlayerRunsBets } = require("../controller/PlayerRunsController");

const matchId = process.env.MATCH_ID;

if (!matchId) {
  throw new Error("❌ PLAYERRUNS_MATCH_ID must be set in environment.");
}

const startCronJob = () => {
  cron.schedule("*/1 * * * *", async () => {
    console.log("📊 Running player runs settlement cron...");

    try {
      const result = await settlePlayerRunsBets(matchId);
      console.log(result.message);
    } catch (err) {
      console.error("❌ Error in player runs cron:", err.message);
    }
  });
};

module.exports = startCronJob;  // Export the function
