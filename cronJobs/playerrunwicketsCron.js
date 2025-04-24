require("dotenv").config();
const cron = require("node-cron");
const { settlePlayerWicketsBets } = require("../controller/PlayerWicketsController");

const fixtureId = process.env.PLAYERRUNS_FIXTURE_ID;
const matchId = process.env.PLAYERRUNS_MATCH_ID;

if (!fixtureId || !matchId) {
  throw new Error("❌ PLAYERRUNS_FIXTURE_ID and PLAYERRUNS_MATCH_ID must be set in environment.");
}

cron.schedule("*/5 * * * *", async () => {
  console.log("📊 Running player wickets settlement cron...");

  try {
    const result = await settlePlayerWicketsBets(fixtureId, matchId);
    console.log(result.message);
  } catch (err) {
    console.error("❌ Error in player wickets cron:", err.message);
  }
});
