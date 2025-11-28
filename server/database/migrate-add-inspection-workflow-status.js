import { query } from "../config/database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

async function migrate() {
  try {
    console.log(
      "🔄 Starting migration: Adding workflow status to inspections..."
    );

    // Add workflow_status to inspections table
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inspections' 
      AND column_name = 'workflow_status'
    `);

    if (checkColumn.rows.length === 0) {
      console.log("📄 Adding workflow_status column to inspections...");
      await query(`
        ALTER TABLE inspections
        ADD COLUMN workflow_status VARCHAR(50) DEFAULT 'rama_pending' 
        CHECK (workflow_status IN ('rama_pending', 'rama_completed', 'gidioni_pending', 'gidioni_completed', 'completed'))
      `);

      await query(`
        CREATE INDEX idx_inspections_workflow_status ON inspections(workflow_status);
      `);

      // Update existing inspections to have appropriate workflow_status
      await query(`
        UPDATE inspections 
        SET workflow_status = CASE 
          WHEN inspection_type = 'rama' AND status = 'completed' THEN 'rama_completed'
          WHEN inspection_type = 'rama' THEN 'rama_pending'
          WHEN inspection_type = 'gidi' AND status = 'completed' THEN 'gidioni_completed'
          WHEN inspection_type = 'gidi' THEN 'gidioni_pending'
          ELSE 'rama_pending'
        END
      `);

      console.log("✅ Workflow status column added successfully!");
    } else {
      console.log("ℹ️  Workflow status column already exists, skipping...");
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
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("migrate-add-inspection-workflow-status.js")
) {
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






