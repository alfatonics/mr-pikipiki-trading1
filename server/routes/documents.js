import express from "express";
import Document from "../models/Document.js";
import { authenticate, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import path from "path";
import fs from "fs";

const router = express.Router();

// Get all documents
router.get(
  "/",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const documents = await Document.findAll(req.query);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  }
);

// Get document by ID
router.get(
  "/:id",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  }
);

// Upload new document
router.post(
  "/",
  authenticate,
  authorize("admin", "secretary"),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "File is required" });
      }

      const document = await Document.create({
        title: req.body.title || req.file.originalname,
        description: req.body.description,
        documentType: req.body.documentType || "other",
        category: req.body.category,
        filePath: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        relatedEntityType: req.body.relatedEntityType,
        relatedEntityId: req.body.relatedEntityId,
        uploadedBy: req.user.id,
        isConfidential: req.body.isConfidential === "true",
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        notes: req.body.notes,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  }
);

// Download document file
router.get(
  "/:id/download",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const filePath = path.join(
        process.cwd(),
        "server",
        document.filePath.replace("/uploads/", "uploads/")
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      res.download(filePath, document.fileName);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  }
);

// Update document metadata
router.put(
  "/:id",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const document = await Document.update(req.params.id, req.body);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  }
);

// Delete document
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "secretary"),
  async (req, res) => {
    try {
      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Delete file from filesystem
      const filePath = path.join(
        process.cwd(),
        "server",
        document.filePath.replace("/uploads/", "uploads/")
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await Document.delete(req.params.id);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  }
);

export default router;
