const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes")
const memberRoutes = require("./routes/memberRoutes")
const adminRoutes = require("./routes/adminRoutes")

dotenv.config();
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
// Configure CORS to allow requests from multiple origins
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Allow sending cookies and authentication headers
  })
);

app.use("/api/user", userRoutes);
app.use("/api/members",memberRoutes)
app.use("/api/admin",adminRoutes)
app.get("/",(req,res)=>{
    res.send("Hello")
})
app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
