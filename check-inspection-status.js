import Inspection from "./server/models/Inspection.js";
import { closePool } from "./server/config/database.js";

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: node check-inspection-status.js <inspectionId>");
    process.exit(1);
  }

  try {
    const inspection = await Inspection.findById(id);
    if (!inspection) {
      console.log("Inspection not found for id:", id);
    } else {
      console.log("Inspection status from database:", {
        id: inspection.id,
        status: inspection.status,
        workflowStatus: inspection.workflowStatus,
        inspectionDate: inspection.inspectionDate,
      });
    }
  } catch (err) {
    console.error("Error reading inspection from database:", err);
  } finally {
    await closePool();
  }
}

main();




