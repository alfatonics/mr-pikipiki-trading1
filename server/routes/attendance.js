import express from "express";
import StaffAttendance from "../models/StaffAttendance.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all attendance records
router.get(
  "/",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const attendance = await StaffAttendance.findAll(req.query);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  }
);

// Get attendance by ID
router.get(
  "/:id",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const record = await StaffAttendance.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Attendance record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching attendance record:", error);
      res.status(500).json({ error: "Failed to fetch attendance record" });
    }
  }
);

// Create or update attendance record
router.post("/", authenticate, async (req, res) => {
  try {
    // Staff can only create their own attendance, secretary/admin can create for anyone
    const userId =
      req.user.role === "secretary" || req.user.role === "admin"
        ? req.body.userId || req.user.id
        : req.user.id;

    const record = await StaffAttendance.create({
      ...req.body,
      userId,
    });
    res.status(201).json(record);
  } catch (error) {
    console.error("Error creating attendance record:", error);
    res.status(500).json({ error: "Failed to create attendance record" });
  }
});

// Update attendance record
router.put("/:id", authenticate, async (req, res) => {
  try {
    const record = await StaffAttendance.update(req.params.id, req.body);
    if (!record) {
      return res.status(404).json({ error: "Attendance record not found" });
    }
    res.json(record);
  } catch (error) {
    console.error("Error updating attendance record:", error);
    res.status(500).json({ error: "Failed to update attendance record" });
  }
});

// Approve leave request
router.post(
  "/:id/approve",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const record = await StaffAttendance.update(req.params.id, {
        approvedBy: req.user.id,
        approvedAt: new Date(),
      });
      if (!record) {
        return res.status(404).json({ error: "Attendance record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error approving leave:", error);
      res.status(500).json({ error: "Failed to approve leave" });
    }
  }
);

// Delete attendance record
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      await StaffAttendance.delete(req.params.id);
      res.json({ message: "Attendance record deleted successfully" });
    } catch (error) {
      console.error("Error deleting attendance record:", error);
      res.status(500).json({ error: "Failed to delete attendance record" });
    }
  }
);

export default router;



