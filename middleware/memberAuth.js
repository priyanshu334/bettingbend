const jwt = require("jsonwebtoken");
const Member = require("../models/member");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const member = await Member.findOne({ MemberId: decoded.MemberId });

    if (!member) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    req.member = member;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = authMiddleware;