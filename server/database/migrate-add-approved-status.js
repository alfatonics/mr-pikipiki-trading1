import { query } from "../config/database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

async function migrate() {
  console.log(
    "🔄 Starting migration: Adding 'approved' status to finance_transactions..."
  );

  try {
    // Check current constraint
    const checkConstraint = await query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%finance_transactions_status%'
    `);

    if (checkConstraint.rows.length > 0) {
      // Drop existing constraint
      const constraintName = checkConstraint.rows[0].constraint_name;
      console.log(`📄 Dropping existing constraint: ${constraintName}...`);
      await query(
        `ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS ${constraintName}`
      );
    }

    // Add new constraint with 'approved' status
    console.log("✅ Adding new constraint with 'approved' status...");
    await query(`
      ALTER TABLE finance_transactions
      ADD CONSTRAINT finance_transactions_status_check
      CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled'))
    `);

    // Update default status to 'pending'
    console.log("🔄 Updating default status to 'pending'...");
    await query(`
      ALTER TABLE finance_transactions
      ALTER COLUMN status SET DEFAULT 'pending'
    `);

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration error:", error);
      process.exit(1);
    });
}

export default migrate;







