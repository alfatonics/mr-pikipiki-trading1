import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log(
      "🚀 Starting migration: Add inspection_item_costs to repairs table..."
    );

    await client.query("BEGIN");

    // Add inspection_item_costs column to repairs table
    // This will store an array of items with their repair costs
    // Format: [{ itemKey: 'q1', section: 'externalAppearance', itemLabel: 'Mkasi sawa', spareParts: [...], laborCost: 0, notes: '' }, ...]
    console.log("Adding inspection_item_costs column to repairs table...");
    await client.query(`
      ALTER TABLE repairs
      ADD COLUMN IF NOT EXISTS inspection_item_costs JSONB DEFAULT '[]'::jsonb;
    `);

    console.log("✅ Column inspection_item_costs added successfully!");

    // Create index for faster queries
    console.log("Creating index on inspection_item_costs...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_repairs_inspection_item_costs 
      ON repairs USING gin (inspection_item_costs);
    `);

    console.log("✅ Index created successfully!");

    await client.query("COMMIT");
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
