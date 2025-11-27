import { query } from "../config/database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

async function migrate() {
  try {
    console.log("🔄 Starting migration: Adding Rama inspection status to contracts...");

    // Add rama_inspection_status to contracts table
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' 
      AND column_name = 'rama_inspection_status'
    `);

    if (checkColumn.rows.length === 0) {
      console.log("📄 Adding rama_inspection_status column to contracts...");
      await query(`
        ALTER TABLE contracts
        ADD COLUMN rama_inspection_status VARCHAR(50) DEFAULT 'pending' 
        CHECK (rama_inspection_status IN ('pending', 'verified', 'rejected', 'not_required'))
      `);

      await query(`
        CREATE INDEX idx_contracts_rama_inspection ON contracts(rama_inspection_status);
      `);

      console.log("✅ Rama inspection status column added successfully!");
    } else {
      console.log("ℹ️  Rama inspection status column already exists, skipping...");
    }

    // Add rama_inspected_by and rama_inspected_at
    const checkInspectedBy = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' 
      AND column_name = 'rama_inspected_by'
    `);

    if (checkInspectedBy.rows.length === 0) {
      console.log("📄 Adding rama_inspected_by and rama_inspected_at columns...");
      await query(`
        ALTER TABLE contracts
        ADD COLUMN rama_inspected_by UUID REFERENCES users(id),
        ADD COLUMN rama_inspected_at TIMESTAMP
      `);

      console.log("✅ Rama inspection tracking columns added successfully!");
    } else {
      console.log("ℹ️  Rama inspection tracking columns already exist, skipping...");
    }

    console.log("✅ Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("migrate-add-rama-inspection-status.js")) {
  migrate()
    .then(() => {
      console.log("✅ Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

export default migrate;





