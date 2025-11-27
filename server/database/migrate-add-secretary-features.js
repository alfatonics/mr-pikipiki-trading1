import { query, testConnection } from "../config/database.js";

async function migrate() {
  try {
    console.log("🔄 Starting Secretary Dashboard features migration...");
    await testConnection();

    // 1. Meetings Table
    console.log("📅 Creating meetings table...");
    await query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        meeting_number VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        agenda TEXT NOT NULL,
        scheduled_date TIMESTAMP NOT NULL,
        actual_date TIMESTAMP,
        location VARCHAR(255),
        meeting_type VARCHAR(50) DEFAULT 'regular' CHECK (meeting_type IN ('regular', 'emergency', 'planning', 'review', 'other')),
        status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
        -- Minutes
        minutes TEXT,
        decisions TEXT,
        action_items TEXT,
        -- Organizer
        organized_by UUID NOT NULL REFERENCES users(id),
        -- Participants (stored as JSONB for flexibility)
        participants JSONB DEFAULT '[]',
        -- Follow-up tasks
        follow_up_tasks JSONB DEFAULT '[]',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Meetings table created");

    // 2. Staff Attendance Table
    console.log("👥 Creating staff_attendance table...");
    await query(`
      CREATE TABLE IF NOT EXISTS staff_attendance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        check_in_time TIMESTAMP,
        check_out_time TIMESTAMP,
        status VARCHAR(50) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'leave', 'sick_leave', 'vacation', 'half_day')),
        leave_type VARCHAR(50) CHECK (leave_type IN ('annual', 'sick', 'emergency', 'maternity', 'paternity', 'unpaid')),
        leave_reason TEXT,
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      )
    `);
    console.log("✅ Staff attendance table created");

    // 3. Documents Table (General Document Center)
    console.log("📄 Creating documents table...");
    await query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        document_number VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('letter', 'invoice', 'report', 'contract', 'memo', 'form', 'certificate', 'other')),
        category VARCHAR(100),
        file_path TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        -- Related entities (optional)
        related_entity_type VARCHAR(50), -- 'Contract', 'Meeting', 'Customer', etc.
        related_entity_id UUID,
        -- Metadata
        uploaded_by UUID NOT NULL REFERENCES users(id),
        is_confidential BOOLEAN DEFAULT false,
        tags TEXT[],
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Documents table created");

    // 4. Office Supplies Table
    console.log("📦 Creating office_supplies table...");
    await query(`
      CREATE TABLE IF NOT EXISTS office_supplies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL CHECK (category IN ('stationery', 'electronics', 'furniture', 'cleaning', 'kitchen', 'other')),
        description TEXT,
        unit VARCHAR(50) DEFAULT 'piece' CHECK (unit IN ('piece', 'box', 'pack', 'set', 'roll', 'bottle', 'kg', 'liter')),
        quantity_in_stock DECIMAL(10, 2) DEFAULT 0,
        minimum_stock_level DECIMAL(10, 2) DEFAULT 0,
        unit_cost DECIMAL(15, 2) DEFAULT 0,
        supplier VARCHAR(255),
        last_purchased_date DATE,
        last_purchased_cost DECIMAL(15, 2),
        location VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Office supplies table created");

    // 5. Office Supply Transactions Table
    console.log("📊 Creating office_supply_transactions table...");
    await query(`
      CREATE TABLE IF NOT EXISTS office_supply_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        supply_id UUID NOT NULL REFERENCES office_supplies(id) ON DELETE RESTRICT,
        transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'adjustment', 'return')),
        quantity DECIMAL(10, 2) NOT NULL,
        unit_cost DECIMAL(15, 2),
        total_cost DECIMAL(15, 2),
        transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
        -- For usage transactions
        used_by UUID REFERENCES users(id),
        department VARCHAR(100),
        purpose TEXT,
        -- For purchase transactions
        supplier VARCHAR(255),
        invoice_number VARCHAR(100),
        -- Metadata
        recorded_by UUID NOT NULL REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Office supply transactions table created");

    // 6. Staff Tasks Table (General staff tasks, different from repair tasks)
    console.log("✅ Creating staff_tasks table...");
    await query(`
      CREATE TABLE IF NOT EXISTS staff_tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        task_number VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        task_category VARCHAR(50) DEFAULT 'general' CHECK (task_category IN ('general', 'administrative', 'sales', 'customer_service', 'documentation', 'reporting', 'other')),
        priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold')),
        -- Assignment
        assigned_to UUID NOT NULL REFERENCES users(id),
        assigned_by UUID NOT NULL REFERENCES users(id),
        -- Dates
        due_date TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        -- Progress tracking
        progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
        completion_notes TEXT,
        -- Related entities
        related_entity_type VARCHAR(50), -- 'Contract', 'Meeting', 'Customer', etc.
        related_entity_id UUID,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Staff tasks table created");

    // Create indexes for better performance
    console.log("📇 Creating indexes...");
    await query(
      `CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_date ON meetings(scheduled_date)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_meetings_organized_by ON meetings(organized_by)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status)`
    );

    await query(
      `CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON staff_attendance(user_id, date)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_attendance_date ON staff_attendance(date)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_attendance_status ON staff_attendance(status)`
    );

    await query(
      `CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_documents_related ON documents(related_entity_type, related_entity_id)`
    );

    await query(
      `CREATE INDEX IF NOT EXISTS idx_supplies_category ON office_supplies(category)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_supplies_stock ON office_supplies(quantity_in_stock)`
    );

    await query(
      `CREATE INDEX IF NOT EXISTS idx_supply_transactions_supply ON office_supply_transactions(supply_id)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_supply_transactions_date ON office_supply_transactions(transaction_date)`
    );

    await query(
      `CREATE INDEX IF NOT EXISTS idx_staff_tasks_assigned_to ON staff_tasks(assigned_to)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_staff_tasks_status ON staff_tasks(status)`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_staff_tasks_due_date ON staff_tasks(due_date)`
    );
    console.log("✅ Indexes created");

    // Create updated_at triggers
    console.log("⚙️ Creating updated_at triggers...");
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    const tables = [
      "meetings",
      "staff_attendance",
      "documents",
      "office_supplies",
      "staff_tasks",
    ];
    for (const table of tables) {
      await query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);
    }
    console.log("✅ Triggers created");

    // Create function to generate meeting numbers
    await query(`
      CREATE OR REPLACE FUNCTION generate_meeting_number()
      RETURNS VARCHAR AS $$
      DECLARE
        year_part VARCHAR(4);
        count_part VARCHAR(3);
        new_number VARCHAR(100);
      BEGIN
        year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
        SELECT COALESCE(MAX(CAST(SUBSTRING(task_number FROM 9) AS INTEGER)), 0) + 1
        INTO count_part
        FROM meetings
        WHERE meeting_number LIKE 'MTG-' || year_part || '-%';
        new_number := 'MTG-' || year_part || '-' || LPAD(count_part::VARCHAR, 3, '0');
        RETURN new_number;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create function to generate document numbers
    await query(`
      CREATE OR REPLACE FUNCTION generate_document_number()
      RETURNS VARCHAR AS $$
      DECLARE
        year_part VARCHAR(4);
        count_part VARCHAR(3);
        new_number VARCHAR(100);
      BEGIN
        year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
        SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM 9) AS INTEGER)), 0) + 1
        INTO count_part
        FROM documents
        WHERE document_number LIKE 'DOC-' || year_part || '-%';
        new_number := 'DOC-' || year_part || '-' || LPAD(count_part::VARCHAR, 3, '0');
        RETURN new_number;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create function to generate staff task numbers
    await query(`
      CREATE OR REPLACE FUNCTION generate_staff_task_number()
      RETURNS VARCHAR AS $$
      DECLARE
        year_part VARCHAR(4);
        count_part VARCHAR(3);
        new_number VARCHAR(100);
      BEGIN
        year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
        SELECT COALESCE(MAX(CAST(SUBSTRING(task_number FROM 10) AS INTEGER)), 0) + 1
        INTO count_part
        FROM staff_tasks
        WHERE task_number LIKE 'STSK-' || year_part || '-%';
        new_number := 'STSK-' || year_part || '-' || LPAD(count_part::VARCHAR, 3, '0');
        RETURN new_number;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log("✅ Helper functions created");
    console.log(
      "🎉 Secretary Dashboard features migration completed successfully!"
    );
  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => {
      console.log("✅ Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

export default migrate;



