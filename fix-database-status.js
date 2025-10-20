const Database = require('better-sqlite3');

// Open the database
const db = new Database('ai-drive-thru.db');

// Update order statuses to match frontend expectations
console.log('🔄 Updating order statuses...');

// Update "preparing" to "in_progress"
const result1 = db.prepare('UPDATE orders SET status = ? WHERE status = ?').run('in_progress', 'preparing');
console.log(`✅ Updated ${result1.changes} orders from 'preparing' to 'in_progress'`);

// Check current orders
const orders = db.prepare('SELECT id, status, order_number FROM orders').all();
console.log('📊 Current orders:');
orders.forEach(order => {
  console.log(`  Order #${order.order_number}: ${order.status}`);
});

// Test query
const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('pending');
const inProgressOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('in_progress');
const completedOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('completed');

console.log('\n📈 Order Summary:');
console.log(`  Pending: ${pendingOrders.count}`);
console.log(`  In Progress: ${inProgressOrders.count}`);
console.log(`  Completed: ${completedOrders.count}`);

db.close();
console.log('\n✅ Database status update completed!');