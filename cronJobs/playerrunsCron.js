require("dotenv").config();
const cron = require("node-cron");
const { settlePlayerRunsBets } = require("../controller/PlayerRunsController");

const fixtureId = process.env.PLAYERRUNS_FIXTURE_ID;
const matchId = process.env.PLAYERRUNS_MATCH_ID;

if (!fixtureId || !matchId) {
  throw new Error("❌ PLAYERRUNS_FIXTURE_ID and PLAYERRUNS_MATCH_ID must be set in environment.");
}

cron.schedule("*/5 * * * *", async () => {
  console.log("📊 Running player runs settlement cron...");

  try {
    const result = await settlePlayerRunsBets(fixtureId, matchId);
    console.log(result.message);
  } catch (err) {
    console.error("❌ Error in player runs cron:", err.message);
  }
});
