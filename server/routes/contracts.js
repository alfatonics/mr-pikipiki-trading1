import express from "express";
import Contract from "../models/Contract.js";
import { authenticate, authorize } from "../middleware/auth.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";
import Motorcycle from "../models/Motorcycle.js";

const router = express.Router();

// Generate contract number
const generateContractNumber = async (type) => {
  const prefix = type === "purchase" ? "PC" : "SC";
  const year = new Date().getFullYear();
  const count = await Contract.count({ type });
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
};

// Get all contracts
router.get("/", authenticate, async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;

    const contracts = await Contract.findAll(filter);
    res.json(contracts);
  } catch (error) {
    console.error("Contracts API error:", error);
    res.status(500).json({ error: "Failed to fetch contracts" });
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
  authorize("admin", "sales"),
  async (req, res) => {
    try {
      const contractNumber = await generateContractNumber(req.body.type);

      const contractData = {
        ...req.body,
        contractNumber,
        date: new Date(),
        createdBy: req.user.id,
      };

      const contract = await Contract.create(contractData);
      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({ error: "Failed to create contract" });
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

export default router;
