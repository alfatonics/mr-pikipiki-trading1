import { query } from "../config/database.js";

/**
 * Migration to add composite indexes for dashboard queries
 * These indexes optimize date-based queries used in the dashboard stats endpoint
 */
async function migrate() {
  try {
    console.log("🚀 Starting dashboard indexes migration...");

    // Index for contracts date queries (type, status, date)
    console.log("📊 Creating index for contracts date queries...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_contracts_type_status_date 
      ON contracts(type, status, date)
    `);

    // Index for contracts created_at queries
    console.log("📊 Creating index for contracts created_at queries...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_contracts_created_at 
      ON contracts(created_at)
    `);

    // Index for repairs completion_date queries
    console.log("📊 Creating index for repairs completion_date queries...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_repairs_status_completion_date 
      ON repairs(status, completion_date)
    `);

    // Index for documents created_at queries
    console.log("📊 Creating index for documents created_at queries...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_documents_created_at 
      ON documents(created_at)
    `);

    // Index for motorcycles sale_date queries
    console.log("📊 Creating index for motorcycles sale_date queries...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_motorcycles_status_sale_date 
      ON motorcycles(status, sale_date)
    `);

    // Index for motorcycles created_at queries
    console.log("📊 Creating index for motorcycles created_at queries...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_motorcycles_created_at 
      ON motorcycles(created_at)
    `);

    // Index for meetings scheduled_date queries
    console.log("📊 Creating index for meetings scheduled_date queries...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_date 
      ON meetings(scheduled_date)
    `);

    console.log("✅ Dashboard indexes migration completed successfully!");
  } catch (error) {
    console.error("❌ Dashboard indexes migration failed:", error);
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
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export default migrate;







