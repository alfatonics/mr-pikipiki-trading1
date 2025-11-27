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

    console.log("Fetching tasks with filters:", filters);
    console.log("Requesting user:", req.user.id, "Role:", req.user.role);

    const tasks = await Task.findAll(filters);

    console.log(`Found ${tasks.length} tasks`);
    if (tasks.length > 0) {
      console.log("Sample task:", {
        id: tasks[0].id,
        title: tasks[0].title,
        assignedTo: tasks[0].assignedTo,
        assignedToName: tasks[0].assignedToName,
      });
    }

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to fetch tasks",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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

// Create task - Admin can assign to anyone, Secretary can assign to rama, gidi, shedrack, cashier, and everyone
router.post("/", authenticate, async (req, res) => {
  try {
    // Admin can assign to anyone
    if (req.user.role === "admin") {
      const task = await Task.create({
        ...req.body,
        assignedBy: req.user.id,
      });
      return res.status(201).json(task);
    }

    // Secretary can assign to rama, gidi, shedrack, cashier, and everyone
    if (req.user.role === "secretary") {
      const task = await Task.create({
        ...req.body,
        assignedBy: req.user.id,
      });
      return res.status(201).json(task);
    }

    // Others cannot create tasks
    return res
      .status(403)
      .json({ error: "Insufficient permissions to create tasks" });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Update task - Everyone can update their own tasks, admin/secretary can update any task
router.put("/:id", authenticate, async (req, res) => {
  try {
    // Check if task exists and get current task
    const currentTask = await Task.findById(req.params.id);
    if (!currentTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Admin and secretary can update any task
    if (req.user.role === "admin" || req.user.role === "secretary") {
      const task = await Task.update(req.params.id, req.body);
      return res.json(task);
    }

    // Others can only update tasks assigned to them
    if (currentTask.assignedTo === req.user.id) {
      const task = await Task.update(req.params.id, req.body);
      return res.json(task);
    }

    return res
      .status(403)
      .json({ error: "You can only update tasks assigned to you" });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

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
