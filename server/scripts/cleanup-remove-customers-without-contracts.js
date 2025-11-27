import { query, closePool } from "../config/database.js";

/**
 * Development-only cleanup script.
 *
 * Deletes all customers who do NOT appear in any contract
 * (party_model = 'Customer'). After this, only customers that
 * are linked to at least one contract will remain.
 *
 * WARNING: Run in development only.
 */

async function cleanupCustomers() {
  console.log(
    "🚨 DEV CLEANUP: Removing customers without any linked contracts"
  );

  try {
    // Find all customer ids that are referenced in contracts
    const usedRes = await query(
      `
      SELECT DISTINCT party_id
      FROM contracts
      WHERE party_model = 'Customer'
    `
    );

    const usedIds = usedRes.rows.map((r) => r.party_id).filter(Boolean);

    if (usedIds.length === 0) {
      console.log(
        "⚠️ No customers referenced in contracts. Skipping delete to be safe."
      );
      await closePool();
      return;
    }

    console.log("✅ Customers referenced in contracts:", usedIds.length);

    await query("BEGIN");
    console.log("🔄 Transaction started");

    // Build parameterized IN clause
    const placeholders = usedIds.map((_, idx) => `$${idx + 1}`).join(", ");
    const deleteSql = `DELETE FROM customers WHERE id NOT IN (${placeholders})`;

    const res = await query(deleteSql, usedIds);
    console.log("   Deleted customers without contracts:", res.rowCount);

    await query("COMMIT");
    console.log("✅ Customer cleanup committed");
  } catch (error) {
    console.error("❌ Customer cleanup failed:", error);
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

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupCustomers().catch((err) => {
    console.error("❌ Unhandled error in customer cleanup script:", err);
    process.exit(1);
  });
}

export default cleanupCustomers;
