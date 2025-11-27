import express from "express";
import Inspection from "../models/Inspection.js";
import Task from "../models/Task.js";
import Repair from "../models/Repair.js";
import User from "../models/User.js";
import Motorcycle from "../models/Motorcycle.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all inspections
router.get("/", authenticate, async (req, res) => {
  try {
    const { motorcycleId, contractId, status, workflowStatus } = req.query;
    const filter = {};

    if (motorcycleId) filter.motorcycleId = motorcycleId;
    if (contractId) filter.contractId = contractId;
    if (status) filter.status = status;
    if (workflowStatus) filter.workflowStatus = workflowStatus;

    const inspections = await Inspection.findAll(filter);
    res.json(inspections);
  } catch (error) {
    console.error("Inspections API error:", error);
    res.status(500).json({ error: "Failed to fetch inspections" });
  }
});

// Get single inspection
router.get("/:id", authenticate, async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id);

    // Temporary debug log so we can confirm DB status/workflowStatus
    if (inspection) {
      console.log("🔍 Inspection status check:", {
        id: inspection.id,
        status: inspection.status,
        workflowStatus: inspection.workflowStatus,
      });
    }

    if (!inspection) {
      return res.status(404).json({ error: "Inspection not found" });
    }

    res.json(inspection);
  } catch (error) {
    console.error("Inspection API error:", error);
    res.status(500).json({ error: "Failed to fetch inspection" });
  }
});

// Create new inspection
router.post("/", authenticate, async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.motorcycleId) {
      return res.status(400).json({ error: "Motorcycle ID is required" });
    }

    // Clean up the data - remove undefined values and frontend-only fields
    const inspectionData = {
      ...req.body,
      inspectionDate:
        req.body.inspectionDate || new Date().toISOString().split("T")[0],
      // customerId can be null for purchase contracts
      customerId: req.body.customerId || null,
      // Ensure workflow status is set
      workflowStatus: req.body.workflowStatus || "rama_pending",
      status: req.body.status || "pending",
      // Ensure inspection type is set
      inspectionType:
        req.body.inspectionType ||
        (req.body.workflowStatus?.includes("rama") ? "rama" : "gidi"),
      // Ensure JSON fields are objects, not strings
      externalAppearance:
        typeof req.body.externalAppearance === "string"
          ? JSON.parse(req.body.externalAppearance)
          : req.body.externalAppearance || {},
      electricalSystem:
        typeof req.body.electricalSystem === "string"
          ? JSON.parse(req.body.electricalSystem)
          : req.body.electricalSystem || {},
      engineSystem:
        typeof req.body.engineSystem === "string"
          ? JSON.parse(req.body.engineSystem)
          : req.body.engineSystem || {},
    };

    // Remove frontend-only fields that shouldn't be sent to database
    delete inspectionData.motorcycleName;
    delete inspectionData.motorcycleType;
    delete inspectionData.motorcycleEngineNumber;
    delete inspectionData.motorcycleChassisNumber;
    delete inspectionData.customerName;
    delete inspectionData.customerPhone;

    console.log("Creating inspection with data:", {
      motorcycleId: inspectionData.motorcycleId,
      contractId: inspectionData.contractId,
      customerId: inspectionData.customerId,
      inspectionType: inspectionData.inspectionType,
      workflowStatus: inspectionData.workflowStatus,
    });

    const inspection = await Inspection.create(inspectionData);
    res.status(201).json(inspection);
  } catch (error) {
    console.error("Error creating inspection:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to create inspection",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Update inspection
router.put("/:id", authenticate, async (req, res) => {
  try {
    // Get current inspection to check if workflow status is changing
    const currentInspection = await Inspection.findById(req.params.id);
    if (!currentInspection) {
      return res.status(404).json({ error: "Inspection not found" });
    }

    // Clean up the data - remove undefined values and frontend-only fields
    const updateData = {
      ...req.body,
    };

    // Remove frontend-only fields that shouldn't be sent to database
    delete updateData.motorcycleName;
    delete updateData.motorcycleType;
    delete updateData.motorcycleEngineNumber;
    delete updateData.motorcycleChassisNumber;
    delete updateData.customerName;
    delete updateData.customerPhone;
    delete updateData.motorcycleId; // Should not be updated via this endpoint
    delete updateData.contractId; // Should not be updated via this endpoint
    delete updateData.customerId; // Should not be updated via this endpoint

    // Remove undefined/null/empty string values
    Object.keys(updateData).forEach((key) => {
      if (
        updateData[key] === undefined ||
        updateData[key] === null ||
        updateData[key] === ""
      ) {
        delete updateData[key];
      }
    });

    console.log("Updating inspection:", {
      inspectionId: req.params.id,
      updateFields: Object.keys(updateData),
      workflowStatus: updateData.workflowStatus,
    });

    const inspection = await Inspection.update(req.params.id, updateData);

    if (!inspection) {
      return res.status(404).json({ error: "Inspection not found" });
    }

    // Check if workflow status changed from rama_pending to rama_completed
    // If so, create a task for GIDIONI (transport role)
    const previousWorkflowStatus =
      currentInspection.workflowStatus ||
      currentInspection.workflow_status ||
      "rama_pending";
    const newWorkflowStatus =
      updateData.workflowStatus ||
      inspection.workflowStatus ||
      inspection.workflow_status ||
      "rama_pending";

    console.log("Workflow status change:", {
      previous: previousWorkflowStatus,
      new: newWorkflowStatus,
      inspectionId: inspection.id,
      hasUpdateData: !!updateData.workflowStatus,
    });

    // 1) RAMA -> GIDIONI: create inspection task for GIDIONI
    if (
      previousWorkflowStatus === "rama_pending" &&
      newWorkflowStatus === "rama_completed"
    ) {
      try {
        // Find a GIDIONI user (transport role) to assign the task
        const gidioniUsers = await User.findAll({
          role: "transport",
          isActive: true,
        });

        if (gidioniUsers.length > 0) {
          // Get motorcycle details for task description
          const motorcycle = inspection.motorcycleId
            ? await Motorcycle.findById(inspection.motorcycleId)
            : null;

          const motorcycleInfo = motorcycle
            ? `${motorcycle.brand || ""} ${motorcycle.model || ""}`.trim()
            : "Pikipiki";

          // Prefer user whose username contains "gidion" if available
          const preferredGidioniUser =
            gidioniUsers.find((u) =>
              u.username?.toLowerCase().includes("gidion")
            ) || gidioniUsers[0];

          const gidioniUserId = preferredGidioniUser?.id;

          if (!gidioniUserId) {
            console.warn(
              "⚠️  Unable to determine GIDIONI user ID for task assignment"
            );
          }

          console.log(
            `Creating task for GIDIONI user: ${gidioniUserId} (${preferredGidioniUser?.username})`
          );
          console.log(
            `Inspection ID: ${inspection.id}, Motorcycle ID: ${inspection.motorcycleId}`
          );

          // Create task for GIDIONI
          const task = await Task.create({
            taskType: "inspection",
            title: `Ukaguzi wa GIDIONI - ${motorcycleInfo}`,
            description: `Ukaguzi wa RAMA umekamilika. Sasa inahitaji ukaguzi wa GIDIONI (Sehemu A, B, na C) kwa ${motorcycleInfo}.`,
            source: "RAMA Inspection",
            motorcycleId: inspection.motorcycleId,
            inspectionId: inspection.id,
            contractId: inspection.contractId || null,
            assignedBy: req.user.id, // RAMA who verified
            assignedTo: gidioniUserId, // Assign to first available GIDIONI user
            priority: "high",
            problemDescription: `Ukaguzi wa GIDIONI unahitajika baada ya RAMA kukamilisha ukaguzi wa Sehemu D.`,
            location: "Inspection Area",
            notes: `Ukaguzi huu umekamilika na RAMA. GIDIONI anatakiwa akague Sehemu A (Muonekano wa Nje), B (Mfumo wa Umeme), na C (Mfumo wa Engine).`,
          });

          console.log(
            `✅ Task created for GIDIONI: ${task.taskNumber}, assignedTo: ${task.assignedTo}`
          );
        } else {
          console.log("⚠️  No GIDIONI users found to assign task");
        }
      } catch (taskError) {
        console.error("Error creating task for GIDIONI:", taskError);
        // Don't fail the inspection update if task creation fails
      }
    }

    // 2) GIDIONI completes technical inspection: create repair task for mechanic (Dito)
    if (
      (previousWorkflowStatus === "rama_completed" ||
        previousWorkflowStatus === "gidioni_pending") &&
      newWorkflowStatus === "gidioni_completed"
    ) {
      try {
        // Find active mechanics
        const mechanics = await User.findAll({
          role: "mechanic",
          isActive: true,
        });

        if (mechanics.length > 0) {
          // Prefer mechanic whose username contains "dito" if available
          const preferredMechanic =
            mechanics.find((u) => u.username?.toLowerCase().includes("dito")) ||
            mechanics[0];

          const mechanicId = preferredMechanic?.id;

          if (!mechanicId) {
            console.warn(
              "⚠️  Unable to determine mechanic (Dito) user ID for repair task assignment"
            );
          } else {
            // Get motorcycle details for descriptions
            const motorcycle = inspection.motorcycleId
              ? await Motorcycle.findById(inspection.motorcycleId)
              : null;

            const motorcycleInfo = motorcycle
              ? `${motorcycle.brand || ""} ${motorcycle.model || ""}`.trim()
              : "Pikipiki";

            console.log(
              `Creating repair & task for mechanic (Dito): ${mechanicId} (${preferredMechanic?.username})`
            );

            // Create repair record for mechanic workflow
            const repair = await Repair.create({
              motorcycleId: inspection.motorcycleId,
              mechanicId,
              inspectionId: inspection.id,
              description:
                inspection.notes ||
                `Repair task from GIDIONI inspection ${inspection.id.substring(
                  0,
                  6
                )}`,
              repairType: "engine_repair",
              startDate: new Date(),
              status: "pending",
              notes:
                inspection.notes ||
                "Matengenezo kutokana na ukaguzi wa GIDIONI (Sehemu A, B, C).",
              // Pre-fill issuesFound on repair with GIDIONI report so Dito can see it
              issuesFound:
                inspection.notes ||
                "Maelezo ya matatizo kutoka ukaguzi wa GIDIONI.",
            });

            // Create task for mechanic (repair task)
            const repairTask = await Task.create({
              taskType: "repair",
              title: `Matengenezo baada ya ukaguzi wa GIDIONI - ${motorcycleInfo}`,
              description:
                inspection.notes ||
                `Matengenezo yanahitajika baada ya ukaguzi wa GIDIONI kwa ${motorcycleInfo}.`,
              source: "GIDIONI Inspection",
              motorcycleId: inspection.motorcycleId,
              inspectionId: inspection.id,
              repairId: repair.id,
              assignedBy: req.user.id,
              assignedTo: mechanicId,
              priority: "high",
              problemDescription:
                inspection.notes ||
                inspection.status ||
                "Matengenezo kutoka ukaguzi wa GIDIONI",
              location: inspection.originLocation || "Workshop",
              notes:
                inspection.notes ||
                "Matengenezo kutokana na ukaguzi wa GIDIONI (Sehemu A, B, C).",
            });

            console.log(
              `✅ Repair & task created for mechanic: repairId=${repair.id}, taskNumber=${repairTask.taskNumber}`
            );
          }
        } else {
          console.log("⚠️  No mechanics found to assign repair task");
        }
      } catch (repairError) {
        console.error(
          "Error creating repair/task for mechanic after GIDIONI completion:",
          repairError
        );
        // Do not fail inspection update if repair task creation fails
      }
    }

    res.json(inspection);
  } catch (error) {
    console.error("Error updating inspection:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to update inspection",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Delete inspection
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const inspection = await Inspection.delete(req.params.id);

    if (!inspection) {
      return res.status(404).json({ error: "Inspection not found" });
    }

    res.json({ message: "Inspection deleted successfully" });
  } catch (error) {
    console.error("Error deleting inspection:", error);
    res.status(500).json({ error: "Failed to delete inspection" });
  }
});

// Create repair task from inspection (Gidion -> Dito)
router.post(
  "/:id/assign-task",
  authenticate,
  authorize("admin", "transport"),
  async (req, res) => {
    try {
      const inspection = await Inspection.findById(req.params.id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }

      const { mechanicId, problemDescription, priority, dueDate, notes } =
        req.body;

      if (!mechanicId) {
        return res.status(400).json({ error: "Mechanic ID is required" });
      }

      // Create repair record for mechanic workflow
      const repair = await Repair.create({
        motorcycleId: inspection.motorcycleId,
        mechanicId,
        description:
          problemDescription ||
          `Repair task for inspection ${inspection.id.substring(0, 6)}`,
        repairType: "engine_repair",
        startDate: new Date(),
        status: "pending",
        notes,
      });

      // Create task for task management
      const task = await Task.create({
        taskType: "repair",
        title: `Repair ${inspection.motorcycle?.brand || ""} ${
          inspection.motorcycle?.model || ""
        }`,
        description:
          problemDescription ||
          inspection.notes ||
          "Repair task generated from inspection",
        source: inspection.originLocation || "Inspection",
        motorcycleId: inspection.motorcycleId,
        inspectionId: inspection.id,
        repairId: repair.id,
        assignedBy: req.user.id,
        assignedTo: mechanicId,
        priority: priority || "medium",
        dueDate,
        problemDescription:
          problemDescription || inspection.notes || inspection.status,
        location: inspection.originLocation || inspection.status,
        notes,
      });

      res.status(201).json({ task, repair });
    } catch (error) {
      console.error("Error creating task from inspection:", error);
      res
        .status(500)
        .json({ error: "Failed to create repair task from inspection" });
    }
  }
);

export default router;
