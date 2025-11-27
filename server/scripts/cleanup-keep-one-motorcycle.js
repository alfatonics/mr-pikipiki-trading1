import { query, closePool } from "../config/database.js";

/**
 * Development-only cleanup script.
 *
 * Keeps ONE motorcycle (identified by brand + chassis_number)
 * and deletes all other motorcycles and their related records
 * (contracts, repairs, repair_bills, transport, inspections, tasks,
 * finance_transactions, approvals linked to those contracts).
 *
 * WARNING: Only run this in development!
 */

const KEEP_BRAND = "dfghbcv";
const KEEP_CHASSIS = "2343";

async function cleanup() {
  console.log("🚨 DEV CLEANUP: Keeping only one motorcycle");
  console.log(`   Brand: ${KEEP_BRAND}, Chassis: ${KEEP_CHASSIS}`);

  try {
    // 1) Find the motorcycle to keep
    const motoRes = await query(
      `
      SELECT id, brand, chassis_number
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

    const keptId = motoRes.rows[0].id;
    console.log("✅ Will keep motorcycle id:", keptId);

    // 2) Begin transaction
    await query("BEGIN");
    console.log("🔄 Transaction started");

    // Helper to run and log deletes
    const runDelete = async (label, sql, params = []) => {
      const res = await query(sql, params);
      console.log(`   ${label}:`, res.rowCount, "rows affected");
    };

    // 3) Delete dependent data for other motorcycles
    await runDelete(
      "repair_bills (other motorcycles)",
      "DELETE FROM repair_bills WHERE motorcycle_id <> $1",
      [keptId]
    );

    await runDelete(
      "repairs (other motorcycles)",
      "DELETE FROM repairs WHERE motorcycle_id <> $1",
      [keptId]
    );

    await runDelete(
      "transport (other motorcycles)",
      "DELETE FROM transport WHERE motorcycle_id <> $1",
      [keptId]
    );

    await runDelete(
      "inspections (other motorcycles)",
      "DELETE FROM inspections WHERE motorcycle_id <> $1",
      [keptId]
    );

    await runDelete(
      "tasks (other motorcycles)",
      "DELETE FROM tasks WHERE motorcycle_id <> $1",
      [keptId]
    );

    await runDelete(
      "finance_transactions (contracts of other motorcycles)",
      `
        DELETE FROM finance_transactions
        WHERE contract_id IN (
          SELECT id FROM contracts WHERE motorcycle_id <> $1
        )
      `,
      [keptId]
    );

    await runDelete(
      "approvals (contracts of other motorcycles)",
      `
        DELETE FROM approvals
        WHERE entity_type = 'Contract'
          AND entity_id IN (
            SELECT id FROM contracts WHERE motorcycle_id <> $1
          )
      `,
      [keptId]
    );

    await runDelete(
      "contracts (other motorcycles)",
      "DELETE FROM contracts WHERE motorcycle_id <> $1",
      [keptId]
    );

    await runDelete(
      "motorcycles (other than kept one)",
      "DELETE FROM motorcycles WHERE id <> $1",
      [keptId]
    );

    // 4) Commit
    await query("COMMIT");
    console.log("✅ Cleanup completed and transaction committed");
  } catch (error) {
    console.error("❌ Cleanup failed, rolling back transaction:", error);
    try {
      await query("ROLLBACK");
      console.log("↩️ Transaction rolled back");
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
  cleanup().catch((err) => {
    console.error("❌ Unhandled error in cleanup script:", err);
    process.exit(1);
  });
}

export default cleanup;

