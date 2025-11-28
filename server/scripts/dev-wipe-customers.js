import { query, closePool } from "../config/database.js";

// Development-only helper: remove all customers.

async function wipeCustomers() {
  console.log("🚨 DEV WIPE: Deleting ALL customers");
  try {
    await query("BEGIN");
    const res = await query("DELETE FROM customers");
    console.log("   Deleted customers:", res.rowCount);
    await query("COMMIT");
    console.log("✅ Customers table cleared");
  } catch (error) {
    console.error("❌ Failed to wipe customers:", error);
    try {
      await query("ROLLBACK");
      console.log("↩️ Rolled back transaction");
    } catch (rbError) {
      console.error("❌ Failed to rollback transaction:", rbError);
    }
  } finally {
    await closePool();
    console.log("🔚 Database pool closed");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  wipeCustomers().catch((err) => {
    console.error("❌ Unhandled error in dev-wipe-customers:", err);
    process.exit(1);
  });
}

export default wipeCustomers;



