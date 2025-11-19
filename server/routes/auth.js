import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("🔐 Login attempt for username:", username);

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    console.log("🔍 Looking up user:", username);
    const user = await User.findByUsername(username);
    
    if (!user) {
      console.log("❌ User not found:", username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      console.log("❌ User is inactive:", username);
      return res.status(401).json({ error: "Account is inactive" });
    }

    console.log("🔑 Comparing password for user:", username);
    const isMatch = await User.comparePassword(password, user.password);
    
    if (!isMatch) {
      console.log("❌ Password mismatch for user:", username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    console.log("📝 Updating last login for user:", username);
    await User.updateLastLogin(user.id);

    console.log("🎫 Generating JWT token for user:", username);
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("✅ Login successful for user:", username);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    console.error("📍 Error message:", error.message);
    console.error("📍 Error stack:", error.stack);
    console.error("📍 Error code:", error.code);
    
    // Check for specific database errors
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return res.status(500).json({ 
        error: "Database connection failed",
        message: "Unable to connect to database. Please check database configuration."
      });
    }
    
    res.status(500).json({ 
      error: "Server error",
      message: process.env.NODE_ENV === "development" ? error.message : "An error occurred during login"
    });
  }
});

// Get current user
router.get("/me", authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// Verify token
router.get("/verify", authenticate, async (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      fullName: req.user.fullName,
      role: req.user.role,
      email: req.user.email,
    },
  });
});

// Change password
router.post("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByUsername(req.user.username);
    const isMatch = await User.comparePassword(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    await User.update(user.id, { password: newPassword });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
