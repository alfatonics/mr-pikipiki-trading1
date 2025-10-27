-- MR PIKIPIKI TRADING Database Schema
-- PostgreSQL Database for Neon

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS approvals CASCADE;
DROP TABLE IF EXISTS repairs CASCADE;
DROP TABLE IF EXISTS transport CASCADE;
DROP TABLE IF EXISTS contract_documents CASCADE;
DROP TABLE IF EXISTS contract_warranties CASCADE;
DROP TABLE IF EXISTS contract_penalties CASCADE;
DROP TABLE IF EXISTS contract_print_history CASCADE;
DROP TABLE IF EXISTS contract_modifications CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS motorcycles CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'sales', 'registration', 'secretary', 'transport', 'mechanic', 'staff')),
    email VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Dar es Salaam',
    country VARCHAR(100) DEFAULT 'Tanzania',
    tax_id VARCHAR(100),
    bank_name VARCHAR(255),
    account_number VARCHAR(100),
    account_name VARCHAR(255),
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    total_supplied INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    id_type VARCHAR(50) NOT NULL CHECK (id_type IN ('NIDA', 'Passport', 'Driving License', 'Voter ID')),
    id_number VARCHAR(100) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Dar es Salaam',
    region VARCHAR(100),
    occupation VARCHAR(255),
    total_purchases INTEGER DEFAULT 0,
    notes TEXT,
    budget_range VARCHAR(50),
    preferred_currency VARCHAR(10) DEFAULT 'TZS' CHECK (preferred_currency IN ('TZS', 'USD', 'EUR')),
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    payment_terms VARCHAR(50) DEFAULT 'cash' CHECK (payment_terms IN ('cash', 'installment', 'credit', 'lease')),
    sales_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Motorcycles Table
CREATE TABLE motorcycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chassis_number VARCHAR(255) UNIQUE NOT NULL,
    engine_number VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(100) NOT NULL,
    purchase_price DECIMAL(15, 2) NOT NULL,
    selling_price DECIMAL(15, 2),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold', 'in_repair', 'in_transit', 'reserved')),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    sale_date DATE,
    registration_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts Table
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'sale', 'service', 'maintenance')),
    motorcycle_id UUID NOT NULL REFERENCES motorcycles(id) ON DELETE RESTRICT,
    party_id UUID NOT NULL,
    party_model VARCHAR(50) NOT NULL CHECK (party_model IN ('Supplier', 'Customer')),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'TZS' CHECK (currency IN ('TZS', 'USD', 'EUR')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'installment', 'cheque')),
    installment_down_payment DECIMAL(15, 2),
    installment_monthly_payment DECIMAL(15, 2),
    installment_duration INTEGER,
    installment_start_date DATE,
    installment_interest_rate DECIMAL(5, 2),
    installment_total_amount DECIMAL(15, 2),
    terms TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'active', 'completed', 'cancelled', 'breached')),
    party_signature_signed BOOLEAN DEFAULT false,
    party_signature_signed_at TIMESTAMP,
    party_signature_image TEXT,
    party_witness_name VARCHAR(255),
    party_witness_signature TEXT,
    company_signature_signed BOOLEAN DEFAULT false,
    company_signature_signed_at TIMESTAMP,
    company_signed_by UUID REFERENCES users(id),
    company_signature_image TEXT,
    company_stamp_image TEXT,
    gdpr_compliant BOOLEAN DEFAULT false,
    data_retention_period INTEGER,
    court_admissible BOOLEAN DEFAULT true,
    notarized BOOLEAN DEFAULT false,
    notarized_at TIMESTAMP,
    notary_name VARCHAR(255),
    notary_stamp TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id),
    notes TEXT,
    internal_notes TEXT,
    tags TEXT[],
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contract Warranties
CREATE TABLE contract_warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    description TEXT,
    duration INTEGER,
    conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contract Penalties
CREATE TABLE contract_penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    description TEXT,
    amount DECIMAL(15, 2),
    conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contract Documents
CREATE TABLE contract_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('signed_contract', 'id_copy', 'receipt', 'warranty', 'other')),
    filename VARCHAR(255),
    original_name VARCHAR(255),
    file_path TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id),
    description TEXT
);

-- Contract Print History
CREATE TABLE contract_print_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    printed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    printed_by UUID REFERENCES users(id),
    print_count INTEGER DEFAULT 1,
    reason TEXT
);

-- Contract Modifications
CREATE TABLE contract_modifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID REFERENCES users(id),
    changes TEXT,
    reason TEXT
);

-- Transport Table
CREATE TABLE transport (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    motorcycle_id UUID NOT NULL REFERENCES motorcycles(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    pickup_location TEXT NOT NULL,
    delivery_location TEXT NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    actual_delivery_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled')),
    transport_cost DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    customer_signature TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repairs Table
CREATE TABLE repairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    motorcycle_id UUID NOT NULL REFERENCES motorcycles(id) ON DELETE RESTRICT,
    mechanic_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    repair_type VARCHAR(50) NOT NULL CHECK (repair_type IN ('routine_maintenance', 'engine_repair', 'body_repair', 'electrical', 'other')),
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'awaiting_details_approval', 'details_approved', 'completed', 'cancelled')),
    labor_cost DECIMAL(15, 2) DEFAULT 0,
    labor_hours DECIMAL(10, 2) DEFAULT 0,
    total_cost DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    details_registered BOOLEAN DEFAULT false,
    details_approval_id UUID,
    work_description TEXT,
    issues_found TEXT,
    recommendations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repair Spare Parts (as JSONB)
CREATE TABLE repair_spare_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_id UUID NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    cost DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approvals Table
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_type VARCHAR(100) NOT NULL CHECK (approval_type IN (
        'sales_contract',
        'purchase_contract',
        'motorcycle_price_change',
        'motorcycle_edit',
        'contract_edit',
        'contract_delete',
        'repair_create',
        'repair_edit',
        'repair_complete'
    )),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('Contract', 'Motorcycle', 'Supplier', 'Customer', 'Repair')),
    entity_id UUID,
    proposed_data JSONB NOT NULL,
    original_data JSONB,
    status VARCHAR(50) DEFAULT 'pending_sales' CHECK (status IN ('pending_sales', 'pending_admin', 'approved', 'rejected')),
    requested_by UUID NOT NULL REFERENCES users(id),
    sales_approved_by UUID REFERENCES users(id),
    sales_approved_at TIMESTAMP,
    sales_comments TEXT,
    admin_approved_by UUID REFERENCES users(id),
    admin_approved_at TIMESTAMP,
    admin_comments TEXT,
    rejected_by UUID REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    description TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_motorcycles_chassis ON motorcycles(chassis_number);
CREATE INDEX idx_motorcycles_status ON motorcycles(status);
CREATE INDEX idx_motorcycles_supplier ON motorcycles(supplier_id);
CREATE INDEX idx_motorcycles_customer ON motorcycles(customer_id);
CREATE INDEX idx_contracts_number ON contracts(contract_number);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_type ON contracts(type);
CREATE INDEX idx_contracts_motorcycle ON contracts(motorcycle_id);
CREATE INDEX idx_repairs_motorcycle ON repairs(motorcycle_id);
CREATE INDEX idx_repairs_mechanic ON repairs(mechanic_id);
CREATE INDEX idx_repairs_status ON repairs(status);
CREATE INDEX idx_transport_motorcycle ON transport(motorcycle_id);
CREATE INDEX idx_transport_customer ON transport(customer_id);
CREATE INDEX idx_transport_status ON transport(status);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_requested_by ON approvals(requested_by);
CREATE INDEX idx_approvals_type ON approvals(approval_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_motorcycles_updated_at BEFORE UPDATE ON motorcycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_updated_at BEFORE UPDATE ON transport FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repairs_updated_at BEFORE UPDATE ON repairs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Database schema created successfully!' as message;

