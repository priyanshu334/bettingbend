require("dotenv").config();
const cron = require("node-cron");
const { settleMatchBets } = require("../controller/MatchdataController");

const fixtureId = process.env.MATCHDATA_FIXTURE_ID;
const matchId = process.env.MATCHDATA_MATCH_ID;

if (!fixtureId || !matchId) {
  throw new Error("❌ MATCHDATA_FIXTURE_ID and MATCHDATA_MATCH_ID must be set in the environment.");
}

cron.schedule("*/5 * * * *", async () => {
  console.log("🎯 Running match data settlement cron...");

  try {
    const result = await settleMatchBets(fixtureId, matchId);
    console.log(result.message);
  } catch (err) {
    console.error("❌ Error in match data cron:", err.message);
  }
});
