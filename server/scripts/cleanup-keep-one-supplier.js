import { query, closePool } from "../config/database.js";

/**
 * Development-only cleanup script.
 *
 * Keeps ONLY the supplier linked to the remaining motorcycle
 * (dfghbcv / chassis 2343) and deletes all other suppliers.
 *
 * WARNING: Run in development only.
 */

const KEEP_BRAND = "dfghbcv";
const KEEP_CHASSIS = "2343";

async function cleanupSuppliers() {
  console.log(
    "🚨 DEV CLEANUP: Keeping only one supplier (for kept motorcycle)"
  );

  try {
    // 1) Find the kept motorcycle
    const motoRes = await query(
      `
      SELECT id, supplier_id
      FROM motorcycles
      WHERE brand = $1 AND chassis_number = $2
      LIMIT 1
    `,
      [KEEP_BRAND, KEEP_CHASSIS]
    );

    if (motoRes.rows.length === 0) {
      console.error(
        "❌ No motorcycle found with the specified brand + chassis_number."
      );
      return;
    }

    const keptSupplierId = motoRes.rows[0].supplier_id;
    if (!keptSupplierId) {
      console.error("❌ Kept motorcycle has no supplier_id set.");
      return;
    }

    console.log("✅ Will keep supplier id:", keptSupplierId);

    await query("BEGIN");
    console.log("🔄 Transaction started");

    const res = await query("DELETE FROM suppliers WHERE id <> $1", [
      keptSupplierId,
    ]);
    console.log("   Deleted other suppliers:", res.rowCount);

    await query("COMMIT");
    console.log("✅ Supplier cleanup committed");
  } catch (error) {
    console.error("❌ Supplier cleanup failed:", error);
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
  cleanupSuppliers().catch((err) => {
    console.error("❌ Unhandled error in supplier cleanup script:", err);
    process.exit(1);
  });
}

export default cleanupSuppliers;
