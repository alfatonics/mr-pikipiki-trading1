import { query } from "../config/database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

async function migrate() {
  console.log(
    "🔄 Starting migration: Adding costing columns to motorcycles table..."
  );

  try {
    // Add purchase_price if not exists
    const purchasePriceCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'motorcycles' 
      AND column_name = 'purchase_price';
    `);

    if (purchasePriceCheck.rows.length === 0) {
      console.log("📄 Adding purchase_price column...");
      await query(`
        ALTER TABLE motorcycles
        ADD COLUMN purchase_price DECIMAL(10, 2) DEFAULT 0;
      `);
    }

    // Add repair_cost if not exists
    const repairCostCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'motorcycles' 
      AND column_name = 'repair_cost';
    `);

    if (repairCostCheck.rows.length === 0) {
      console.log("📄 Adding repair_cost column...");
      await query(`
        ALTER TABLE motorcycles
        ADD COLUMN repair_cost DECIMAL(10, 2) DEFAULT 0;
      `);
    }

    // Add other_costs if not exists
    const otherCostsCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'motorcycles' 
      AND column_name = 'other_costs';
    `);

    if (otherCostsCheck.rows.length === 0) {
      console.log("📄 Adding other_costs column...");
      await query(`
        ALTER TABLE motorcycles
        ADD COLUMN other_costs DECIMAL(10, 2) DEFAULT 0;
      `);
    }

    // Add total_cost if not exists
    const totalCostCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'motorcycles' 
      AND column_name = 'total_cost';
    `);

    if (totalCostCheck.rows.length === 0) {
      console.log("📄 Adding total_cost column...");
      await query(`
        ALTER TABLE motorcycles
        ADD COLUMN total_cost DECIMAL(10, 2) DEFAULT 0;
      `);
    }

    // Add profit_margin if not exists
    const profitMarginCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'motorcycles' 
      AND column_name = 'profit_margin';
    `);

    if (profitMarginCheck.rows.length === 0) {
      console.log("📄 Adding profit_margin column...");
      await query(`
        ALTER TABLE motorcycles
        ADD COLUMN profit_margin DECIMAL(5, 2) DEFAULT 0;
      `);
    }

    // Add sale_price if not exists
    const salePriceCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'motorcycles' 
      AND column_name = 'sale_price';
    `);

    if (salePriceCheck.rows.length === 0) {
      console.log("📄 Adding sale_price column...");
      await query(`
        ALTER TABLE motorcycles
        ADD COLUMN sale_price DECIMAL(10, 2) DEFAULT 0;
      `);
    }

    // Add pricing_status if not exists (pending_pricing, priced, approved)
    const pricingStatusCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'motorcycles' 
      AND column_name = 'pricing_status';
    `);

    if (pricingStatusCheck.rows.length === 0) {
      console.log("📄 Adding pricing_status column...");
      await query(`
        ALTER TABLE motorcycles
        ADD COLUMN pricing_status VARCHAR(50) DEFAULT 'pending_pricing';
      `);
    }

    // Add approved_by if not exists
    const approvedByCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'motorcycles' 
      AND column_name = 'approved_by';
    `);

    if (approvedByCheck.rows.length === 0) {
      console.log("📄 Adding approved_by column...");
      await query(`
        ALTER TABLE motorcycles
        ADD COLUMN approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
      `);
    }

    // Add approved_at if not exists
    const approvedAtCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'motorcycles' 
      AND column_name = 'approved_at';
    `);

    if (approvedAtCheck.rows.length === 0) {
      console.log("📄 Adding approved_at column...");
      await query(`
        ALTER TABLE motorcycles
        ADD COLUMN approved_at TIMESTAMP;
      `);
    }

    console.log("✅ Motorcycle costing columns added successfully!");
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
  process.argv[1].includes("migrate-add-motorcycle-costing.js")
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



