-- Make supplier_id optional in motorcycles table
-- This allows creating motorcycles without immediately assigning a supplier

ALTER TABLE motorcycles 
ALTER COLUMN supplier_id DROP NOT NULL;

-- Optionally, also make customer_id optional if needed
ALTER TABLE motorcycles 
ALTER COLUMN customer_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN motorcycles.supplier_id IS 'Optional: Supplier can be assigned later';
COMMENT ON COLUMN motorcycles.customer_id IS 'Optional: Customer assigned when sold';

