import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ error: "Token expired. Please login again." });
      }
      return res.status(401).json({ error: "Invalid token" });
    }

    // Try to fetch user with retry logic for database connection issues
    let user;
    try {
      user = await User.findById(decoded.id);
    } catch (dbError) {
      console.error("Database error during authentication:", dbError);
      // If it's a connection error, return a more helpful message
      if (
        dbError.code === "ECONNRESET" ||
        dbError.code === "ETIMEDOUT" ||
        dbError.message.includes("Connection terminated") ||
        dbError.message.includes("timeout")
      ) {
        return res.status(503).json({
          error: "Database connection issue. Please try again.",
        });
      }
      return res
        .status(500)
        .json({ error: "Server error during authentication" });
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid authentication" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admin always has access
    if (req.user.role === "admin") {
      return next();
    }

    // Handle multi-role users (e.g., "secretary,cashier")
    const userRoles = req.user.role?.split(",") || [req.user.role];
    const hasPermission = roles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};
