import express from "express";
import Message from "../models/Message.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get messages for user
router.get("/", authenticate, async (req, res) => {
  try {
    const filters = {};
    if (req.query.type === "sent") {
      filters.senderId = req.user.id;
    } else {
      filters.receiverId = req.user.id;
    }

    if (req.query.isRead !== undefined) {
      filters.isRead = req.query.isRead === "true";
    }

    const messages = await Message.findAll(filters);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send message
router.post("/", authenticate, async (req, res) => {
  try {
    const message = await Message.create({
      ...req.body,
      senderId: req.user.id,
    });
    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Mark as read
router.post("/:id/read", authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (message.receiverId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const updated = await Message.markAsRead(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ error: "Failed to update message" });
  }
});

// Delete message
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (
      message.senderId !== req.user.id &&
      message.receiverId !== req.user.id
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }
    await Message.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;

