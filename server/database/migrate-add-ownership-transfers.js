import { query } from "../config/database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

async function migrate() {
  try {
    console.log("🔄 Starting ownership transfers migration...");

    // Check if ownership_transfers table exists
    const transfersCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ownership_transfers'
      );
    `);

    if (!transfersCheck.rows[0].exists) {
      console.log("📄 Creating ownership_transfers table...");
      await query(`
        CREATE TABLE ownership_transfers (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          transfer_number VARCHAR(100) UNIQUE NOT NULL,
          motorcycle_id UUID REFERENCES motorcycles(id) ON DELETE SET NULL,
          motorcycle_number VARCHAR(100),
          
          -- Previous Owner Information
          previous_owner_name VARCHAR(255) NOT NULL,
          previous_owner_tin VARCHAR(100),
          previous_owner_phone VARCHAR(50),
          previous_owner_id_type VARCHAR(50),
          previous_owner_id_number VARCHAR(100),
          previous_owner_passport_image TEXT,
          previous_owner_account_password TEXT, -- Stored in plain text as requested
          
          -- New Owner Information
          new_owner_name VARCHAR(255) NOT NULL,
          new_owner_tin VARCHAR(100),
          new_owner_phone VARCHAR(50),
          new_owner_id_type VARCHAR(50),
          new_owner_id_number VARCHAR(100),
          new_owner_passport_image TEXT,
          
          -- Transfer Details
          transfer_cost DECIMAL(15, 2) DEFAULT 0,
          is_paid BOOLEAN DEFAULT false,
          payment_date DATE,
          payment_proof TEXT,
          
          -- Status
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
            'pending', 
            'waiting_for_approval', 
            'waiting_payment', 
            'completed', 
            'cancelled'
          )),
          
          -- Source Information (where motorcycle is coming from)
          source_location VARCHAR(255),
          source_description TEXT,
          
          -- Created by Rama (registration role)
          created_by UUID NOT NULL REFERENCES users(id),
          approved_by UUID REFERENCES users(id),
          approved_at TIMESTAMP,
          
          -- Notes
          notes TEXT,
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        CREATE INDEX idx_ownership_transfers_status ON ownership_transfers(status);
        CREATE INDEX idx_ownership_transfers_created_by ON ownership_transfers(created_by);
        CREATE INDEX idx_ownership_transfers_motorcycle ON ownership_transfers(motorcycle_id);
        CREATE INDEX idx_ownership_transfers_transfer_number ON ownership_transfers(transfer_number);
      `);

      await query(`
        CREATE TRIGGER update_ownership_transfers_updated_at 
        BEFORE UPDATE ON ownership_transfers 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log("✅ Ownership transfers table created successfully!");
    } else {
      console.log("ℹ️  Ownership transfers table already exists, skipping...");
    }

    console.log("✅ Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("migrate-add-ownership-transfers.js")) {
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


