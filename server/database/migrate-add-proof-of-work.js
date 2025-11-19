import { query } from "../config/database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

async function migrate() {
  console.log("🔄 Adding proof_of_work column to repairs table...");

  try {
    // Check if column exists
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'repairs' AND column_name = 'proof_of_work'
    `);

    if (checkColumn.rows.length === 0) {
      console.log("📄 Adding proof_of_work column...");
      await query(`
        ALTER TABLE repairs
        ADD COLUMN proof_of_work TEXT;
      `);
      console.log("✅ proof_of_work column added successfully!");
    } else {
      console.log("ℹ️  proof_of_work column already exists, skipping...");
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
  process.argv[1].includes("migrate-add-proof-of-work.js")
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
