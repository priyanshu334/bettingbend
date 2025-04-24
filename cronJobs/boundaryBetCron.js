require("dotenv").config(); // Make sure this is at the top if not already
const cron = require("node-cron");
const { settleBoundaryBets } = require("../controller/BoundryBetController");

const fixtureId = process.env.FIXTURE_ID;
const matchId = process.env.MATCH_ID;

if (!fixtureId || !matchId) {
  throw new Error("❌ FIXTURE_ID and MATCH_ID must be set in the environment variables.");
}

cron.schedule("*/5 * * * *", async () => {
  console.log("🔄 Running boundary bet settlement cron...");

  try {
    const result = await settleBoundaryBets(fixtureId, matchId);
    console.log(result.message);
  } catch (err) {
    console.error(`❌ Failed to settle for ${matchId}:`, err.message);
  }
});
