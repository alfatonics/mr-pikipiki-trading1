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
      "🚀 Starting migration: Add customer purchase tracking fields..."
    );

    await client.query("BEGIN");

    // Add total_spent column to customers table
    console.log("Adding total_spent column to customers table...");
    await client.query(`
      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS total_spent DECIMAL(15, 2) DEFAULT 0;
    `);

    console.log("✅ Column total_spent added successfully!");

    // Add last_purchase_date column to customers table
    console.log("Adding last_purchase_date column to customers table...");
    await client.query(`
      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS last_purchase_date DATE;
    `);

    console.log("✅ Column last_purchase_date added successfully!");

    // Create indexes for better query performance
    console.log("Creating indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_total_spent 
      ON customers(total_spent DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_total_purchases 
      ON customers(total_purchases DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_last_purchase_date 
      ON customers(last_purchase_date DESC);
    `);

    console.log("✅ Indexes created successfully!");

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
