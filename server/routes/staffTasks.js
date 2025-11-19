import express from "express";
import StaffTask from "../models/StaffTask.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all staff tasks
router.get("/", authenticate, async (req, res) => {
  try {
    // Staff can only see their own tasks, secretary/admin can see all
    const filters =
      req.user.role === "secretary" || req.user.role === "admin"
        ? req.query
        : { ...req.query, assignedTo: req.user.id };

    const tasks = await StaffTask.findAll(filters);
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching staff tasks:", error);
    res.status(500).json({ error: "Failed to fetch staff tasks" });
  }
});

// Get staff task by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const task = await StaffTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Staff task not found" });
    }

    // Staff can only view their own tasks, secretary/admin can view all
    if (
      req.user.role !== "secretary" &&
      req.user.role !== "admin" &&
      task.assignedTo !== req.user.id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error fetching staff task:", error);
    res.status(500).json({ error: "Failed to fetch staff task" });
  }
});

// Create new staff task
router.post(
  "/",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const task = await StaffTask.create({
        ...req.body,
        assignedBy: req.user.id,
      });
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating staff task:", error);
      res.status(500).json({ error: "Failed to create staff task" });
    }
  }
);

// Update staff task
router.put("/:id", authenticate, async (req, res) => {
  try {
    const task = await StaffTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Staff task not found" });
    }

    // Staff can only update their own tasks, secretary/admin can update all
    if (
      req.user.role !== "secretary" &&
      req.user.role !== "admin" &&
      task.assignedTo !== req.user.id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updatedTask = await StaffTask.update(req.params.id, req.body);
    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating staff task:", error);
    res.status(500).json({ error: "Failed to update staff task" });
  }
});

// Delete staff task
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      await StaffTask.delete(req.params.id);
      res.json({ message: "Staff task deleted successfully" });
    } catch (error) {
      console.error("Error deleting staff task:", error);
      res.status(500).json({ error: "Failed to delete staff task" });
    }
  }
);

export default router;
