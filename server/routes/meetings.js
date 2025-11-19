import express from "express";
import Meeting from "../models/Meeting.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all meetings
router.get(
  "/",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const meetings = await Meeting.findAll(req.query);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  }
);

// Get meeting by ID
router.get(
  "/:id",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const meeting = await Meeting.findById(req.params.id);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      console.error("Error fetching meeting:", error);
      res.status(500).json({ error: "Failed to fetch meeting" });
    }
  }
);

// Create new meeting
router.post(
  "/",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const meeting = await Meeting.create({
        ...req.body,
        organizedBy: req.user.id,
      });
      res.status(201).json(meeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(500).json({ error: "Failed to create meeting" });
    }
  }
);

// Update meeting
router.put(
  "/:id",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const meeting = await Meeting.update(req.params.id, req.body);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      console.error("Error updating meeting:", error);
      res.status(500).json({ error: "Failed to update meeting" });
    }
  }
);

// Delete meeting
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      await Meeting.delete(req.params.id);
      res.json({ message: "Meeting deleted successfully" });
    } catch (error) {
      console.error("Error deleting meeting:", error);
      res.status(500).json({ error: "Failed to delete meeting" });
    }
  }
);

export default router;
