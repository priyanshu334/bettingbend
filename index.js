const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes")
const memberRoutes = require("./routes/memberRoutes")
const adminRoutes = require("./routes/adminRoutes")
const gameRoutes = require("./routes/gameRoutes");
const betRoutes = require("./routes/bet");
const Matchdata = require("./routes/MatchDataRoutes");
const boundaryBet = require("./routes/boundaryBetRoutes");
const bowlerRunsBet = require("./routes/bowlerRunsBetRoutes");
const playerRunsBet = require("./routes/playerRunsBetRoutes");
const wicketBet = require("./routes/playerWicketsBetRoutes");
const RunsAndWickets = require("./routes/RunsandWicketRoute")

dotenv.config();
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
// Configure CORS to allow requests from multiple origins,
const allowedOrigins = [
  "https://yourdash-seven.vercel.app",
  "https://betdashboard-njy6.vercel.app",
  "https://memberdash.vercel.app",
  "https://bettingfront-1yrd.vercel.app",
  "http://localhost:3000",
  "https://bettingfrontend-blush.vercel.app",
  "https://bettingdash.vercel.app",
  "https://bettingmemberdash.vercel.app",
];


app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Allow sending cookies and authentication headers
  })
);

app.use("/api/users", userRoutes);
app.use("/api/members",memberRoutes)
app.use("/api/bet", betRoutes);
app.use("/api/admin",adminRoutes)
app.use("/api/games", gameRoutes);
app.use("/api/matchdata",Matchdata)
app.use("/api/boundarybet",boundaryBet)
app.use("/api/bowlerruns",bowlerRunsBet)
app.use("/api/playerruns",playerRunsBet)
app.use("/api/playerwicket",wicketBet)
app.use("/api/RunsAndWickets",RunsAndWickets)

app.get("/",(req,res)=>{
    res.send("Hello")
})
app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));