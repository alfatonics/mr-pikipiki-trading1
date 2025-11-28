import express from "express";
import Contract from "../models/Contract.js";
import { authenticate, authorize } from "../middleware/auth.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";
import Motorcycle from "../models/Motorcycle.js";
import Inspection from "../models/Inspection.js";
import Repair from "../models/Repair.js";
import RepairBill from "../models/RepairBill.js";
import { query } from "../config/database.js";

const router = express.Router();

// Generate contract number
const generateContractNumber = async (type) => {
  const prefix = type === "purchase" ? "PC" : "SC";
  const year = new Date().getFullYear();

  // Always base the next number on the current MAX contract_number for this type + year
  // This avoids duplicates when some rows have been deleted or imported manually.
  const sql = `
    SELECT contract_number
    FROM contracts
    WHERE type = $1
      AND contract_number LIKE $2
    ORDER BY contract_number DESC
    LIMIT 1
  `;

  const likePattern = `${prefix}-${year}-%`;
  const result = await query(sql, [type, likePattern]);

  let nextSequence = 1;

  if (result.rows[0]?.contract_number) {
    const lastNumber = result.rows[0].contract_number;
    const parts = lastNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  return `${prefix}-${year}-${String(nextSequence).padStart(4, "0")}`;
};

// Get all contracts
router.get("/", authenticate, async (req, res) => {
  try {
    const { type, status, motorcycleId } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (motorcycleId) filter.motorcycleId = motorcycleId;

    // Check if we need minimal data (for BikeForInspection page)
    const minimal = req.query.minimal === "true";

    if (minimal) {
      // For BikeForInspection, return contracts with basic data only (no full population)
      // Limit to 500 contracts to prevent timeout
      filter.limit = 500;
      const contracts = await Contract.findAll(filter);
      res.json(contracts);
      return;
    }

    const contracts = await Contract.findAll(filter);

    // Limit population to prevent timeout - only populate first 100 contracts
    // If more are needed, implement pagination
    const contractsToPopulate = contracts.slice(0, 100);
    const remainingContracts = contracts.slice(100);

    // Populate party and motorcycle data for contracts (limited to prevent timeout)
    const populatedContracts = await Promise.all(
      contractsToPopulate.map(async (contract) => {
        const populated = { ...contract };

        // Get motorcycle data
        if (contract.motorcycleId) {
          try {
            const motorcycle = await Motorcycle.findById(contract.motorcycleId);
            populated.motorcycle = motorcycle || null;
          } catch (err) {
            console.error(
              `Error fetching motorcycle ${contract.motorcycleId}:`,
              err
            );
            populated.motorcycle = null;
          }
        }

        // Get party data (customer or supplier)
        if (contract.partyId && contract.partyModel) {
          try {
            if (contract.partyModel === "Customer") {
              const customer = await Customer.findById(contract.partyId);
              populated.party = customer || null;
            } else if (contract.partyModel === "Supplier") {
              const supplier = await Supplier.findById(contract.partyId);
              populated.party = supplier || null;
            }
          } catch (err) {
            console.error(`Error fetching party ${contract.partyId}:`, err);
            populated.party = null;
          }
        }

        // Ensure _id is set for frontend compatibility
        populated._id = contract.id;

        return populated;
      })
    );

    // Add remaining contracts without full population
    const allContracts = [...populatedContracts, ...remainingContracts];

    res.json(allContracts);
  } catch (error) {
    console.error("Contracts API error:", error);
    res.status(500).json({ error: "Failed to fetch contracts" });
  }
});

// Search contract by motorcycle chassis/engine number (optimized for large datasets)
router.get("/search/by-motorcycle", authenticate, async (req, res) => {
  try {
    const { chassisNumber, engineNumber, type = "purchase" } = req.query;

    if (!chassisNumber && !engineNumber) {
      return res.status(400).json({
        error: "Either chassisNumber or engineNumber is required",
      });
    }

    // Use direct SQL query for better performance
    let sql = `
      SELECT c.id, c.contract_number as "contractNumber", c.type, c.motorcycle_id as "motorcycleId",
             c.party_id as "partyId", c.party_model as "partyModel", c.amount, c.currency,
             c.date, c.effective_date as "effectiveDate", c.expiry_date as "expiryDate",
             c.payment_method as "paymentMethod", c.status, c.priority,
             c.rama_inspection_status as "ramaInspectionStatus",
             c.notes, c.internal_notes as "internalNotes",
             c.created_at as "createdAt", c.updated_at as "updatedAt",
             m.chassis_number as "motorcycleChassisNumber",
             m.engine_number as "motorcycleEngineNumber",
             m.brand as "motorcycleBrand",
             m.model as "motorcycleModel"
      FROM contracts c
      LEFT JOIN motorcycles m ON c.motorcycle_id = m.id
      WHERE c.type = $1 AND (
        (m.chassis_number = $2) OR (m.engine_number = $3)
        OR (c.notes::text LIKE $4) OR (c.notes::text LIKE $5)
        OR (c.notes::text LIKE $6) OR (c.notes::text LIKE $7)
      )
      ORDER BY c.created_at DESC
      LIMIT 1
    `;

    const chassisPattern1 = `%"chassisNumber":"${chassisNumber || ""}"%`;
    const chassisPattern2 = `%"motorcycleChassisNumber":"${
      chassisNumber || ""
    }"%`;
    const enginePattern1 = `%"engineNumber":"${engineNumber || ""}"%`;
    const enginePattern2 = `%"motorcycleEngineNumber":"${engineNumber || ""}"%`;

    const result = await query(sql, [
      type,
      chassisNumber || null,
      engineNumber || null,
      chassisPattern1,
      chassisPattern2,
      enginePattern1,
      enginePattern2,
    ]);

    const contract = result.rows[0] || null;

    if (contract) {
      // Populate party data
      if (contract.partyId && contract.partyModel) {
        try {
          if (contract.partyModel === "Customer") {
            const customer = await Customer.findById(contract.partyId);
            contract.party = customer || null;
          } else if (contract.partyModel === "Supplier") {
            const supplier = await Supplier.findById(contract.partyId);
            contract.party = supplier || null;
          }
        } catch (err) {
          console.error(`Error fetching party ${contract.partyId}:`, err);
          contract.party = null;
        }
      }

      // Populate motorcycle data
      if (contract.motorcycleId) {
        try {
          const motorcycle = await Motorcycle.findById(contract.motorcycleId);
          contract.motorcycle = motorcycle || null;
        } catch (err) {
          console.error(
            `Error fetching motorcycle ${contract.motorcycleId}:`,
            err
          );
          contract.motorcycle = null;
        }
      }

      contract._id = contract.id;
    }

    res.json(contract);
  } catch (error) {
    console.error("Error searching contract by motorcycle:", error);
    res.status(500).json({ error: "Failed to search contract" });
  }
});

// Get single contract
router.get("/:id", authenticate, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contract" });
  }
});

// Get contract with printable-ready data
router.get("/:id/detailed", authenticate, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    const motorcycle = contract.motorcycleId
      ? await Motorcycle.findById(contract.motorcycleId)
      : null;

    let party = null;
    if (contract.partyId) {
      if (
        contract.partyModel &&
        contract.partyModel.toLowerCase() === "customer"
      ) {
        party = await Customer.findById(contract.partyId);
      } else if (
        contract.partyModel &&
        contract.partyModel.toLowerCase() === "supplier"
      ) {
        party = await Supplier.findById(contract.partyId);
      }
    }

    const companyProfile = {
      name: "MR PIKIPIKI TRADING",
      registrationNumber: "518309",
      tin: "54888667",
      address: "Ubungo Riverside, Dar es Salaam",
      phone: "0744 882 955",
      representative: "Emanwely Patrick Mwamlima",
      representativePhone: "0676 238 482",
    };

    res.json({
      contract,
      motorcycle,
      party,
      partyType: contract.partyModel,
      company: companyProfile,
    });
  } catch (error) {
    console.error("Error fetching detailed contract:", error);
    res.status(500).json({ error: "Failed to fetch contract details" });
  }
});

// Create new contract
router.post(
  "/",
  authenticate,
  authorize("admin", "sales", "secretary"),
  async (req, res) => {
    try {
      // Validate required fields
      if (!req.body.type) {
        return res.status(400).json({ error: "Contract type is required" });
      }
      if (!req.body.motorcycleId) {
        return res.status(400).json({ error: "Motorcycle ID is required" });
      }
      if (!req.body.partyId) {
        return res
          .status(400)
          .json({ error: "Party ID (customer/supplier) is required" });
      }
      if (!req.body.partyModel) {
        return res
          .status(400)
          .json({ error: "Party model (Customer/Supplier) is required" });
      }

      const contractNumber = await generateContractNumber(req.body.type);

      // Use date from request body if provided, otherwise use current date
      // Convert to ISO string format for database consistency
      const contractDate = req.body.date
        ? typeof req.body.date === "string"
          ? req.body.date
          : new Date(req.body.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const contractData = {
        ...req.body,
        contractNumber,
        date: contractDate,
        effectiveDate: req.body.effectiveDate || contractDate,
        createdBy: req.user.id,
        // Ensure required fields have defaults
        terms: req.body.terms || "Standard contract terms apply",
        status: req.body.status || "draft",
        priority: req.body.priority || "medium",
      };

      // Ensure notes is a string if it's an object (JSON.stringify was already done on client)
      if (contractData.notes && typeof contractData.notes === "object") {
        contractData.notes = JSON.stringify(contractData.notes);
      }

      const contract = await Contract.create(contractData);
      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      console.error("Error stack:", error.stack);
      console.error("Request body keys:", Object.keys(req.body || {}));

      // Handle specific database errors
      if (error.code === "23503") {
        // Foreign key violation
        return res.status(400).json({
          error:
            "Invalid reference. Please check motorcycle, customer, or supplier IDs.",
          details: error.detail,
        });
      }

      if (error.code === "23505") {
        // Unique violation
        return res.status(400).json({
          error: "Contract number already exists. Please try again.",
        });
      }

      if (error.message && error.message.includes("entity too large")) {
        return res.status(413).json({
          error:
            "Request payload too large. Please reduce image sizes or remove unnecessary data.",
        });
      }

      res.status(500).json({
        error: "Failed to create contract",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Please check server logs for details",
        code: error.code,
      });
    }
  }
);

// Update contract
router.put(
  "/:id",
  authenticate,
  authorize("admin", "sales"),
  async (req, res) => {
    try {
      const contract = await Contract.update(req.params.id, req.body);

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to update contract" });
    }
  }
);

// Delete contract
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const contract = await Contract.delete(req.params.id);

    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    res.json({ message: "Contract deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete contract" });
  }
});

// Rama verify inspection (registration role)
router.post(
  "/:id/verify-inspection",
  authenticate,
  authorize("registration", "admin"),
  async (req, res) => {
    try {
      const { status } = req.body; // 'verified' or 'rejected'

      if (!status || !["verified", "rejected"].includes(status)) {
        return res
          .status(400)
          .json({ error: "Invalid status. Must be 'verified' or 'rejected'" });
      }

      const contract = await Contract.update(req.params.id, {
        ramaInspectionStatus: status,
        ramaInspectedBy: req.user.id,
        ramaInspectedAt: new Date(),
      });

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      res.json(contract);
    } catch (error) {
      console.error("Error verifying inspection:", error);
      res.status(500).json({ error: "Failed to verify inspection" });
    }
  }
);

// Admin approve contract and create motorcycle in stock (after all inspections and payments)
router.post(
  "/:id/approve-and-create-motorcycle",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { priceIn, priceOut, profit } = req.body;
      const contract = await Contract.findById(req.params.id);

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Check if contract is purchase type
      if (contract.type !== "purchase") {
        return res
          .status(400)
          .json({ error: "Only purchase contracts can create motorcycles" });
      }

      // Check if Rama inspection is verified
      if (contract.ramaInspectionStatus !== "verified") {
        return res.status(400).json({
          error:
            "Rama inspection must be verified before creating motorcycle in stock",
        });
      }

      // Check if Gidi inspection is completed
      const allInspections = await Inspection.findAll({
        contractId: contract.id,
      });
      const gidiInspection = allInspections.filter(
        (ins) => ins.inspectionType === "gidi"
      );
      const hasGidiInspection =
        gidiInspection.length > 0 &&
        gidiInspection.some((ins) => ins.status === "completed");

      if (!hasGidiInspection) {
        return res.status(400).json({
          error:
            "Gidi inspection must be completed before creating motorcycle in stock",
        });
      }

      // Check if repairs are completed (if any)
      const repairs = await Repair.findAll({
        motorcycleId: contract.motorcycleId,
      });
      const incompleteRepairs = repairs.filter((r) => r.status !== "completed");
      if (incompleteRepairs.length > 0) {
        return res.status(400).json({
          error:
            "All repairs must be completed before creating motorcycle in stock",
        });
      }

      // Check if repair bills are paid (if any)
      let repairBills = [];
      if (contract.motorcycleId) {
        repairBills = await RepairBill.findAll({
          motorcycleId: contract.motorcycleId,
        });
        const unpaidBills = repairBills.filter((b) => b.status !== "paid");
        if (unpaidBills.length > 0) {
          return res.status(400).json({
            error:
              "All repair bills must be paid before creating motorcycle in stock",
          });
        }
      }

      // Calculate total costs
      const totalRepairCost = repairBills.reduce(
        (sum, bill) => sum + (parseFloat(bill.totalAmount) || 0),
        0
      );
      const purchasePrice = parseFloat(contract.amount) || 0;
      const finalPriceIn = priceIn || purchasePrice + totalRepairCost;
      const finalPriceOut = priceOut || contract.amount;
      const finalProfit = profit || finalPriceOut - finalPriceIn;

      // Get contract party (supplier) details
      let supplierId = null;
      if (contract.partyModel === "Supplier" && contract.partyId) {
        supplierId = contract.partyId;
      } else {
        // Try to find supplier from contract
        const supplier = await Supplier.findById(contract.partyId);
        if (supplier) {
          supplierId = supplier.id;
        }
      }

      if (!supplierId) {
        return res
          .status(400)
          .json({ error: "Supplier information is required" });
      }

      // Check if motorcycle already exists
      let motorcycle = null;
      if (contract.motorcycleId) {
        motorcycle = await Motorcycle.findById(contract.motorcycleId);
      }

      if (motorcycle) {
        // Update existing motorcycle
        await Motorcycle.update(contract.motorcycleId, {
          priceIn: finalPriceIn,
          priceOut: finalPriceOut,
          profit: finalProfit,
          sellingPrice: finalPriceOut,
          status: "in_stock",
        });
        motorcycle = await Motorcycle.findById(contract.motorcycleId);
      } else {
        // Create new motorcycle from contract
        // Get motorcycle details from contract or create basic entry
        // Note: In a real flow, motorcycle details should come from the contract/inspection
        const motorcycleData = {
          chassisNumber: `CH-${contract.contractNumber}-${Date.now()}`, // Temporary, should come from contract
          engineNumber: `ENG-${contract.contractNumber}-${Date.now()}`, // Temporary
          brand: contract.motorcycleBrand || "Unknown",
          model: contract.motorcycleModel || "Unknown",
          year: new Date().getFullYear(),
          color: "Unknown",
          purchasePrice: purchasePrice,
          sellingPrice: finalPriceOut,
          supplierId: supplierId,
          purchaseDate: contract.date || new Date().toISOString().split("T")[0],
          status: "in_stock",
          priceIn: finalPriceIn,
          priceOut: finalPriceOut,
          profit: finalProfit,
          maintenanceCost: totalRepairCost,
          totalCost: finalPriceIn,
        };

        motorcycle = await Motorcycle.create(motorcycleData);

        // Update contract with motorcycle ID
        await Contract.update(contract.id, {
          motorcycleId: motorcycle.id,
          status: "completed",
        });
      }

      res.json({
        message: "Motorcycle created/updated in stock successfully",
        motorcycle,
        contract: await Contract.findById(contract.id),
      });
    } catch (error) {
      console.error("Error approving contract and creating motorcycle:", error);
      res
        .status(500)
        .json({ error: "Failed to approve contract and create motorcycle" });
    }
  }
);

export default router;
