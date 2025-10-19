-- Add missing columns to the existing orders table
ALTER TABLE orders ADD COLUMN order_number INTEGER;
ALTER TABLE orders ADD COLUMN estimated_time INTEGER;
ALTER TABLE orders ADD COLUMN started_at TEXT;
ALTER TABLE orders ADD COLUMN completed_at TEXT;
ALTER TABLE orders ADD COLUMN kitchen_note TEXT;
ALTER TABLE orders ADD COLUMN priority INTEGER DEFAULT 1;

-- Create an index on order_number for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Create an index on priority for better sorting
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);

-- Update existing orders to have order numbers if they don't have them
UPDATE orders SET order_number = 1000 + id WHERE order_number IS NULL;