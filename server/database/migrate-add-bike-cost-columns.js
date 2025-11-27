import { query } from "../config/database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

async function migrate() {
  console.log(
    "🔄 Adding maintenance_cost and total_cost columns to motorcycles..."
  );

  try {
    await query(`
      ALTER TABLE motorcycles
      ADD COLUMN IF NOT EXISTS maintenance_cost DECIMAL(15, 2) DEFAULT 0;
    `);

    await query(`
      ALTER TABLE motorcycles
      ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15, 2) DEFAULT 0;
    `);

    await query(`
      UPDATE motorcycles
      SET total_cost = purchase_price + COALESCE(maintenance_cost, 0)
      WHERE total_cost = 0;
    `);

    console.log("✅ Columns added successfully!");
    return true;
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  }
}

if (
  process.argv[1] === __filename ||
  process.argv[1].includes("migrate-add-bike-cost-columns.js")
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



