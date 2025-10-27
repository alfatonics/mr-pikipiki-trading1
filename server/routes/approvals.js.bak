import express from "express";
import Approval from "../models/Approval.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get my approval requests
router.get("/my-requests", authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { requestedBy: req.user.id };

    if (status) {
      filter.status = status;
    }

    const requests = await Approval.findAll(filter);
    res.json(requests);
  } catch (error) {
    console.error("Error fetching my requests:", error);
    res.status(500).json({ error: "Failed to fetch your requests" });
  }
});

// Get all approval requests
router.get("/", authenticate, authorize("admin", "sales"), async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (type) {
      filter.approvalType = type;
    }

    const approvals = await Approval.findAll(filter);
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch approvals" });
  }
});

// Get single approval
router.get("/:id", authenticate, async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id);

    if (!approval) {
      return res.status(404).json({ error: "Approval not found" });
    }

    res.json(approval);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch approval" });
  }
});

// Create approval request
router.post("/", authenticate, async (req, res) => {
  try {
    const approvalData = {
      ...req.body,
      requestedBy: req.user.id,
      status: "pending_sales",
    };

    const approval = await Approval.create(approvalData);
    res.status(201).json(approval);
  } catch (error) {
    res.status(500).json({ error: "Failed to create approval request" });
  }
});

// Approve by sales
router.post(
  "/:id/approve-sales",
  authenticate,
  authorize("sales", "admin"),
  async (req, res) => {
    try {
      const approval = await Approval.update(req.params.id, {
        status: "pending_admin",
        salesApprovedBy: req.user.id,
        salesApprovedAt: new Date(),
        salesComments: req.body.comments,
      });

      res.json(approval);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve" });
    }
  }
);

// Approve by admin
router.post(
  "/:id/approve-admin",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const approval = await Approval.update(req.params.id, {
        status: "approved",
        adminApprovedBy: req.user.id,
        adminApprovedAt: new Date(),
        adminComments: req.body.comments,
      });

      res.json(approval);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve" });
    }
  }
);

// Reject approval
router.post(
  "/:id/reject",
  authenticate,
  authorize("admin", "sales"),
  async (req, res) => {
    try {
      const approval = await Approval.update(req.params.id, {
        status: "rejected",
        rejectedBy: req.user.id,
        rejectedAt: new Date(),
        rejectionReason: req.body.reason,
      });

      res.json(approval);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject" });
    }
  }
);

export default router;
