const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const Member = require("../models/member");

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ✅ Use env variable

    let user = await Admin.findById(decoded.id);
    if (!user) {
      user = await Member.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found or invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ success: false, message: "Authentication failed" });
  }
};

const authorizeRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  };
};

module.exports = { authenticateUser, authorizeRole };
