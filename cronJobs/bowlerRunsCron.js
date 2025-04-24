require("dotenv").config();
const cron = require("node-cron");
const { settleBowlerRunsBets } = require("../controller/BowlerRunsController");

const fixtureId = process.env.BOWLER_FIXTURE_ID;
const matchId = process.env.BOWLER_MATCH_ID;

if (!fixtureId || !matchId) {
  throw new Error("❌ BOWLER_FIXTURE_ID and BOWLER_MATCH_ID must be set in the environment.");
}

cron.schedule("*/5 * * * *", async () => {
  console.log("🎯 Running bowler runs settlement cron...");

  try {
    const result = await settleBowlerRunsBets(fixtureId, matchId);
    console.log(result.message);
  } catch (err) {
    console.error("❌ Error in cron job:", err.message);
  }
});
