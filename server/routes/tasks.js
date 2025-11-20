import express from "express";
import Task from "../models/Task.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all tasks
router.get("/", authenticate, async (req, res) => {
  try {
    const filters = {
      assignedTo: req.query.assignedTo,
      assignedBy: req.query.assignedBy,
      status: req.query.status,
      taskType: req.query.taskType,
      motorcycleId: req.query.motorcycleId,
    };

    const tasks = await Task.findAll(filters);
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Get single task
router.get("/:id", authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// Create task (Gidion/Admin)
router.post(
  "/",
  authenticate,
  authorize("admin", "transport", "sales"),
  async (req, res) => {
    try {
      const task = await Task.create({
        ...req.body,
        assignedBy: req.user.id,
      });
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  }
);

// Update task (status changes, reassignment)
router.put(
  "/:id",
  authenticate,
  authorize("admin", "transport", "mechanic"),
  async (req, res) => {
    try {
      const task = await Task.update(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  }
);

// Delete task
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const task = await Task.delete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;

