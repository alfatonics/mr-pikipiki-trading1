import { query } from "../config/database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

async function migrate() {
  console.log(
    "🔄 Starting migration: Adding inspections and finance tables..."
  );

  try {
    // Check if inspections table exists
    const inspectionsCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'inspections'
      );
    `);

    if (!inspectionsCheck.rows[0].exists) {
      console.log("📄 Creating inspections table...");
      await query(`
        CREATE TABLE inspections (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          motorcycle_id UUID NOT NULL REFERENCES motorcycles(id) ON DELETE RESTRICT,
          contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
          customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
          inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
          staff_name VARCHAR(255),
          staff_signature TEXT,
          mechanic_name VARCHAR(255),
          mechanic_signature TEXT,
          external_appearance JSONB DEFAULT '{}',
          electrical_system JSONB DEFAULT '{}',
          engine_system JSONB DEFAULT '{}',
          seller_phone VARCHAR(50),
          seller_passport_image TEXT,
          seller_id_type VARCHAR(50),
          seller_id_number VARCHAR(100),
          seller_phone_called BOOLEAN DEFAULT false,
          seller_account_access VARCHAR(255),
          seller_account_password VARCHAR(255),
          seller_otp_phone VARCHAR(50),
          brought_by VARCHAR(255),
          origin_location VARCHAR(255),
          broker_number VARCHAR(50),
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
          overall_result VARCHAR(50) CHECK (overall_result IN ('pass', 'fail', 'conditional')),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        CREATE INDEX idx_inspections_motorcycle ON inspections(motorcycle_id);
        CREATE INDEX idx_inspections_contract ON inspections(contract_id);
        CREATE INDEX idx_inspections_status ON inspections(status);
      `);

      await query(`
        CREATE TRIGGER update_inspections_updated_at 
        BEFORE UPDATE ON inspections 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log("✅ Inspections table created successfully!");
    } else {
      console.log("ℹ️  Inspections table already exists, skipping...");
    }

    // Check if finance_transactions table exists
    const financeCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'finance_transactions'
      );
    `);

    if (!financeCheck.rows[0].exists) {
      console.log("📄 Creating finance_transactions table...");
      await query(`
        CREATE TABLE finance_transactions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('cash_in', 'cash_out')),
          category VARCHAR(100) NOT NULL CHECK (category IN (
            'fuel', 'transport', 'broker_fees', 'repairs', 'debts', 
            'refunds', 'plates', 'registration', 'sales_income', 
            'purchase_expense', 'other_income', 'other_expense'
          )),
          amount DECIMAL(15, 2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'TZS' CHECK (currency IN ('TZS', 'USD', 'EUR')),
          description TEXT NOT NULL,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
          motorcycle_id UUID REFERENCES motorcycles(id) ON DELETE SET NULL,
          repair_id UUID REFERENCES repairs(id) ON DELETE SET NULL,
          supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
          customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
          proof_image TEXT,
          proof_document TEXT,
          department VARCHAR(50),
          created_by UUID NOT NULL REFERENCES users(id),
          status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'rejected')),
          approved_by UUID REFERENCES users(id),
          approved_at TIMESTAMP,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        CREATE INDEX idx_finance_transactions_type ON finance_transactions(transaction_type);
        CREATE INDEX idx_finance_transactions_category ON finance_transactions(category);
        CREATE INDEX idx_finance_transactions_date ON finance_transactions(date);
        CREATE INDEX idx_finance_transactions_contract ON finance_transactions(contract_id);
        CREATE INDEX idx_finance_transactions_created_by ON finance_transactions(created_by);
      `);

      await query(`
        CREATE TRIGGER update_finance_transactions_updated_at 
        BEFORE UPDATE ON finance_transactions 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log("✅ Finance transactions table created successfully!");
    } else {
      console.log("ℹ️  Finance transactions table already exists, skipping...");
    }

    // Check if finance_categories table exists
    const categoriesCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'finance_categories'
      );
    `);

    if (!categoriesCheck.rows[0].exists) {
      console.log("📄 Creating finance_categories table...");
      await query(`
        CREATE TABLE finance_categories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL UNIQUE,
          type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Finance categories table created successfully!");
    } else {
      console.log("ℹ️  Finance categories table already exists, skipping...");
    }

    console.log("✅ Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  }
}

// Run if executed directly
if (
  process.argv[1] === __filename ||
  process.argv[1].includes("migrate-add-inspections-finance.js")
) {
  migrate()
    .then(() => {
      console.log("✅ Migration process complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

export default migrate;
