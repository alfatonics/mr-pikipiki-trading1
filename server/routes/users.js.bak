import express from "express";
import User from "../models/User.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all users (Admin only)
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create new user (Admin only)
router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error.code === "23505") {
      // PostgreSQL unique violation
      return res.status(400).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user (Admin only)
router.put("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    console.log("Updating user:", req.params.id, "with data:", {
      ...updateData,
      password: password ? "[PROVIDED]" : "[NOT PROVIDED]",
    });

    // If password is provided and not empty, add it to updateData
    if (password && password.trim() !== "") {
      console.log("Password will be hashed in User.update");
      updateData.password = password;
    } else {
      console.log("No password provided, keeping existing password");
    }

    const user = await User.update(req.params.id, updateData);

    if (!user) {
      console.log("User not found:", req.params.id);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User updated successfully:", user.username);
    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);

    if (error.code === "23505") {
      // PostgreSQL unique violation
      return res.status(400).json({ error: "Username already exists" });
    }

    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user (Admin only)
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const user = await User.delete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Get users by role
router.get("/by-role/:role", authenticate, async (req, res) => {
  try {
    const users = await User.findAll({ role: req.params.role, isActive: true });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
