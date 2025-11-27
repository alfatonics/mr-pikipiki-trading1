import { query } from "../config/database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

async function migrate() {
  console.log(
    "🔄 Starting migration: Adding inspection types and price fields..."
  );

  try {
    // Add inspection_type to inspections table
    console.log("📄 Adding inspection_type to inspections table...");
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'inspections' 
          AND column_name = 'inspection_type'
        ) THEN
          ALTER TABLE inspections 
          ADD COLUMN inspection_type VARCHAR(50) CHECK (inspection_type IN ('gidi', 'rama'));
        END IF;
      END $$;
    `);

    // Add price_in, price_out, profit to motorcycles table
    console.log(
      "💰 Adding price_in, price_out, profit to motorcycles table..."
    );
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'motorcycles' 
          AND column_name = 'price_in'
        ) THEN
          ALTER TABLE motorcycles 
          ADD COLUMN price_in DECIMAL(15, 2);
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'motorcycles' 
          AND column_name = 'price_out'
        ) THEN
          ALTER TABLE motorcycles 
          ADD COLUMN price_out DECIMAL(15, 2);
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'motorcycles' 
          AND column_name = 'profit'
        ) THEN
          ALTER TABLE motorcycles 
          ADD COLUMN profit DECIMAL(15, 2);
        END IF;
      END $$;
    `);

    // Update existing motorcycles: set price_in = purchase_price + maintenance_cost
    console.log("🔄 Updating existing motorcycles with price_in...");
    await query(`
      UPDATE motorcycles 
      SET price_in = COALESCE(purchase_price, 0) + COALESCE(maintenance_cost, 0)
      WHERE price_in IS NULL;
    `);

    // Update existing motorcycles: set price_out = selling_price
    console.log("🔄 Updating existing motorcycles with price_out...");
    await query(`
      UPDATE motorcycles 
      SET price_out = selling_price
      WHERE price_out IS NULL AND selling_price IS NOT NULL;
    `);

    // Calculate profit for existing motorcycles
    console.log("🔄 Calculating profit for existing motorcycles...");
    await query(`
      UPDATE motorcycles 
      SET profit = price_out - price_in
      WHERE price_out IS NOT NULL AND price_in IS NOT NULL AND profit IS NULL;
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

