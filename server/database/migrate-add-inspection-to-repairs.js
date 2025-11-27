import { query } from "../config/database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

async function migrate() {
  console.log(
    "🔄 Starting migration: Adding inspection_id to repairs table..."
  );

  try {
    // Check if inspection_id column exists
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'repairs' 
      AND column_name = 'inspection_id';
    `);

    if (columnCheck.rows.length === 0) {
      console.log("📄 Adding inspection_id column to repairs table...");

      await query(`
        ALTER TABLE repairs
        ADD COLUMN inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL;
      `);

      await query(`
        CREATE INDEX idx_repairs_inspection ON repairs(inspection_id);
      `);

      console.log("✅ inspection_id column added successfully!");
    } else {
      console.log("ℹ️  inspection_id column already exists, skipping...");
    }

    console.log("✅ Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  }
}

// Run if executed directly
if (
  process.argv[1] === __filename ||
  process.argv[1].includes("migrate-add-inspection-to-repairs.js")
) {
  migrate()
    .then(() => {
      console.log("✅ Migration process complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

export default migrate;




