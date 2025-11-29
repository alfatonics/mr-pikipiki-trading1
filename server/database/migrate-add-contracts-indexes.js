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
    console.log("🚀 Starting migration: Add contracts performance indexes...");

    await client.query("BEGIN");

    // Add indexes for contracts table for better query performance
    console.log("Creating indexes on contracts table...");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contracts_created_at 
      ON contracts(created_at DESC);
    `);
    console.log("✅ Index idx_contracts_created_at created!");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contracts_motorcycle_id 
      ON contracts(motorcycle_id);
    `);
    console.log("✅ Index idx_contracts_motorcycle_id created!");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contracts_party_id 
      ON contracts(party_id);
    `);
    console.log("✅ Index idx_contracts_party_id created!");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contracts_type_status 
      ON contracts(type, status);
    `);
    console.log("✅ Index idx_contracts_type_status created!");

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
