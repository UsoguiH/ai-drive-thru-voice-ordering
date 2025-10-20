const Database = require('better-sqlite3');
const path = require('path');

// Create database file
const db = new Database('ai-drive-thru.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create orders table
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    order_number INTEGER NOT NULL,
    estimated_time INTEGER,
    started_at TEXT,
    completed_at TEXT,
    kitchen_note TEXT,
    priority INTEGER NOT NULL DEFAULT 1,
    language TEXT NOT NULL,
    customer_note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Create user table for auth
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
`);

// Create session table for auth
db.exec(`
  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );
`);

// Create account table for auth
db.exec(`
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at INTEGER,
    refresh_token_expires_at INTEGER,
    scope TEXT,
    password TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );
`);

// Create verification table for auth
db.exec(`
  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
`);

// Create indexes for better performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
  CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
`);

// Insert sample orders with updated SAR prices
const sampleOrders = [
  {
    items: JSON.stringify([
      { name: 'Cheeseburger', quantity: 2, price: 18.00 },
      { name: 'Large Fries', quantity: 1, price: 12.00 },
      { name: 'Coca Cola', quantity: 2, price: 7.00 }
    ]),
    total: 62.00,
    status: 'pending',
    order_number: 1001,
    estimated_time: 15,
    priority: 1,
    language: 'en',
    customer_note: 'Extra ketchup please',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString()
  },
  {
    items: JSON.stringify([
      { name: 'Double Burger', quantity: 1, price: 22.00 },
      { name: 'Medium Fries', quantity: 1, price: 10.00 },
      { name: 'Orange Juice', quantity: 1, price: 9.00 }
    ]),
    total: 41.00,
    status: 'preparing',
    order_number: 1002,
    estimated_time: 20,
    priority: 1,
    language: 'ar',
    customer_note: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString()
  },
  {
    items: JSON.stringify([
      { name: 'Chicken Burger', quantity: 1, price: 20.00 },
      { name: 'Small Fries', quantity: 1, price: 8.00 },
      { name: 'Coffee', quantity: 1, price: 8.00 },
      { name: 'Apple Pie', quantity: 1, price: 10.00 }
    ]),
    total: 46.00,
    status: 'completed',
    order_number: 1003,
    estimated_time: 12,
    priority: 1,
    language: 'en',
    customer_note: 'No onions please',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 75 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 75 * 60 * 1000).toISOString()
  },
  {
    items: JSON.stringify([
      { name: 'Veggie Burger', quantity: 1, price: 16.00 },
      { name: 'Large Fries', quantity: 1, price: 12.00 },
      { name: 'Water', quantity: 2, price: 4.00 }
    ]),
    total: 36.00,
    status: 'pending',
    order_number: 1004,
    estimated_time: 10,
    priority: 1,
    language: 'en',
    customer_note: 'Make it spicy',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 95 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 95 * 60 * 1000).toISOString()
  },
  {
    items: JSON.stringify([
      { name: 'Double Burger', quantity: 2, price: 22.00 },
      { name: 'Medium Fries', quantity: 2, price: 10.00 },
      { name: 'Pepsi', quantity: 2, price: 7.00 },
      { name: 'Ice Cream', quantity: 2, price: 8.00 }
    ]),
    total: 94.00,
    status: 'preparing',
    order_number: 1005,
    estimated_time: 25,
    priority: 2,
    language: 'ar',
    customer_note: 'Extra sauce',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 110 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 110 * 60 * 1000).toISOString()
  }
];

// Insert sample orders
const insertOrder = db.prepare(`
  INSERT INTO orders (
    items, total, status, order_number, estimated_time, priority,
    language, customer_note, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

sampleOrders.forEach(order => {
  insertOrder.run(
    order.items,
    order.total,
    order.status,
    order.order_number,
    order.estimated_time,
    order.priority,
    order.language,
    order.customer_note,
    order.created_at,
    order.updated_at
  );
});

console.log('✅ Database created successfully with sample orders');
console.log(`📊 Inserted ${sampleOrders.length} sample orders`);
console.log('💾 Database file: ai-drive-thru.db');

// Test query
const testResult = db.prepare('SELECT COUNT(*) as count FROM orders').get();
console.log(`🧪 Test query successful. Found ${testResult.count} orders.`);

db.close();