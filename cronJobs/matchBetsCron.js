require("dotenv").config();
const cron = require("node-cron");
const { settleMatchBets } = require("../controller/RunsAndWicketsController");

const fixtureId = process.env.MATCH_FIXTURE_ID;
const matchId = process.env.MATCH_MATCH_ID;

if (!fixtureId || !matchId) {
  throw new Error("❌ MATCH_FIXTURE_ID and MATCH_MATCH_ID must be set in the environment.");
}

cron.schedule("*/5 * * * *", async () => {
  console.log("📊 Running match bets settlement cron...");

  try {
    const result = await settleMatchBets(fixtureId, matchId);
    console.log(result.message);
  } catch (err) {
    console.error("❌ Error in match bets cron:", err.message);
  }
});
