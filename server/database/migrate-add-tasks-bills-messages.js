import { query } from "../config/database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

async function migrate() {
  console.log(
    "🔄 Starting migration: Adding tasks, repair_bills, and messages tables..."
  );

  try {
    // Check if tasks table exists
    const tasksCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      );
    `);

    if (!tasksCheck.rows[0].exists) {
      console.log("📄 Creating tasks table...");
      await query(`
        CREATE TABLE tasks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          task_number VARCHAR(100) UNIQUE NOT NULL,
          task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('inspection', 'repair', 'delivery', 'registration', 'other')),
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          source VARCHAR(100),
          motorcycle_id UUID REFERENCES motorcycles(id) ON DELETE SET NULL,
          inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
          repair_id UUID REFERENCES repairs(id) ON DELETE SET NULL,
          contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
          assigned_by UUID NOT NULL REFERENCES users(id),
          assigned_to UUID REFERENCES users(id),
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
          priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          due_date TIMESTAMP,
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          problem_description TEXT,
          location VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
        CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
        CREATE INDEX idx_tasks_status ON tasks(status);
        CREATE INDEX idx_tasks_motorcycle ON tasks(motorcycle_id);
        CREATE INDEX idx_tasks_type ON tasks(task_type);
      `);

      await query(`
        CREATE TRIGGER update_tasks_updated_at 
        BEFORE UPDATE ON tasks 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log("✅ Tasks table created successfully!");
    } else {
      console.log("ℹ️  Tasks table already exists, skipping...");
    }

    // Check if repair_bills table exists
    const billsCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'repair_bills'
      );
    `);

    if (!billsCheck.rows[0].exists) {
      console.log("📄 Creating repair_bills table...");
      await query(`
        CREATE TABLE repair_bills (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          bill_number VARCHAR(100) UNIQUE NOT NULL,
          repair_id UUID NOT NULL REFERENCES repairs(id) ON DELETE RESTRICT,
          motorcycle_id UUID NOT NULL REFERENCES motorcycles(id) ON DELETE RESTRICT,
          mechanic_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
          labor_cost DECIMAL(15, 2) NOT NULL,
          spare_parts_cost DECIMAL(15, 2) NOT NULL,
          total_amount DECIMAL(15, 2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'TZS',
          description TEXT NOT NULL,
          proof_of_work TEXT,
          repair_date DATE NOT NULL,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent_to_cashier', 'payment_approved', 'payment_rejected', 'paid', 'cancelled')),
          sent_to_cashier_at TIMESTAMP,
          sent_by UUID NOT NULL REFERENCES users(id),
          payment_approved_by UUID REFERENCES users(id),
          payment_approved_at TIMESTAMP,
          payment_rejected_by UUID REFERENCES users(id),
          payment_rejected_at TIMESTAMP,
          rejection_reason TEXT,
          paid_at TIMESTAMP,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        CREATE INDEX idx_repair_bills_repair ON repair_bills(repair_id);
        CREATE INDEX idx_repair_bills_mechanic ON repair_bills(mechanic_id);
        CREATE INDEX idx_repair_bills_status ON repair_bills(status);
        CREATE INDEX idx_repair_bills_motorcycle ON repair_bills(motorcycle_id);
      `);

      await query(`
        CREATE TRIGGER update_repair_bills_updated_at 
        BEFORE UPDATE ON repair_bills 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log("✅ Repair bills table created successfully!");
    } else {
      console.log("ℹ️  Repair bills table already exists, skipping...");
    }

    // Check if messages table exists
    const messagesCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
      );
    `);

    if (!messagesCheck.rows[0].exists) {
      console.log("📄 Creating messages table...");
      await query(`
        CREATE TABLE messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          subject VARCHAR(255),
          message TEXT NOT NULL,
          related_entity_type VARCHAR(50),
          related_entity_id UUID,
          is_read BOOLEAN DEFAULT false,
          read_at TIMESTAMP,
          priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        CREATE INDEX idx_messages_sender ON messages(sender_id);
        CREATE INDEX idx_messages_receiver ON messages(receiver_id);
        CREATE INDEX idx_messages_read ON messages(is_read);
        CREATE INDEX idx_messages_related ON messages(related_entity_type, related_entity_id);
      `);

      console.log("✅ Messages table created successfully!");
    } else {
      console.log("ℹ️  Messages table already exists, skipping...");
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
  process.argv[1].includes("migrate-add-tasks-bills-messages.js")
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
