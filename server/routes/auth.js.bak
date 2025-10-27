import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const user = await User.findByUsername(username);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

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
    res.status(500).json({ error: "Server error" });
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
