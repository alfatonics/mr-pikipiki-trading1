import { query } from "../config/database.js";

async function migrate() {
  try {
    console.log("🔄 Starting loans/debts migration...");

    // Check if loans table exists
    const loansCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'loans'
      );
    `);

    if (!loansCheck.rows[0].exists) {
      console.log("📄 Creating loans table...");
      await query(`
        CREATE TABLE loans (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          loan_type VARCHAR(50) NOT NULL CHECK (loan_type IN ('we_owe', 'owe_us')),
          person_name VARCHAR(255) NOT NULL,
          person_phone VARCHAR(50),
          person_email VARCHAR(255),
          person_type VARCHAR(50) CHECK (person_type IN ('customer', 'supplier', 'staff', 'other')),
          amount DECIMAL(15, 2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'TZS' CHECK (currency IN ('TZS', 'USD', 'EUR')),
          description TEXT NOT NULL,
          due_date DATE,
          interest_rate DECIMAL(5, 2) DEFAULT 0,
          created_by UUID NOT NULL REFERENCES users(id),
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue', 'cancelled')),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        CREATE INDEX idx_loans_type ON loans(loan_type);
        CREATE INDEX idx_loans_status ON loans(status);
        CREATE INDEX idx_loans_person_type ON loans(person_type);
        CREATE INDEX idx_loans_created_by ON loans(created_by);
      `);

      await query(`
        CREATE TRIGGER update_loans_updated_at 
        BEFORE UPDATE ON loans 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log("✅ Loans table created successfully!");
    } else {
      console.log("ℹ️  Loans table already exists, skipping...");
    }

    // Check if loan_payments table exists
    const paymentsCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'loan_payments'
      );
    `);

    if (!paymentsCheck.rows[0].exists) {
      console.log("📄 Creating loan_payments table...");
      await query(`
        CREATE TABLE loan_payments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
          amount DECIMAL(15, 2) NOT NULL,
          payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
          notes TEXT,
          created_by UUID NOT NULL REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        CREATE INDEX idx_loan_payments_loan ON loan_payments(loan_id);
        CREATE INDEX idx_loan_payments_date ON loan_payments(payment_date);
      `);

      console.log("✅ Loan payments table created successfully!");
    } else {
      console.log("ℹ️  Loan payments table already exists, skipping...");
    }

    console.log("✅ Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  }
}

// Run if executed directly
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("migrate-add-loans.js")
) {
  migrate()
    .then(() => {
      console.log("✅ Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

export default migrate;
