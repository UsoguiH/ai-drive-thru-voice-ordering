const { createClient } = require('@libsql/client');

// Get database credentials from environment
const dbUrl = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl || !authToken) {
    console.error('❌ Missing database credentials. Please check TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN.');
    process.exit(1);
}

console.log('🔧 Connecting to database...');

const db = createClient({
    url: dbUrl,
    authToken: authToken,
});

async function updateDatabase() {
    try {
        console.log('🔄 Adding new columns to orders table...');

        // Add missing columns with IF NOT EXISTS pattern
        const updates = [
            'ALTER TABLE orders ADD COLUMN order_number INTEGER',
            'ALTER TABLE orders ADD COLUMN estimated_time INTEGER',
            'ALTER TABLE orders ADD COLUMN started_at TEXT',
            'ALTER TABLE orders ADD COLUMN completed_at TEXT',
            'ALTER TABLE orders ADD COLUMN kitchen_note TEXT',
            'ALTER TABLE orders ADD COLUMN priority INTEGER DEFAULT 1'
        ];

        for (const sql of updates) {
            try {
                await db.execute(sql);
                console.log('✅ Applied:', sql);
            } catch (error) {
                if (error.message.includes('duplicate column name')) {
                    console.log('⚠️ Column already exists:', sql);
                } else {
                    console.log('❌ Error applying:', sql, error.message);
                }
            }
        }

        // Create indexes
        console.log('📊 Creating indexes...');
        try {
            await db.execute('CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)');
            console.log('✅ Created index on order_number');
        } catch (error) {
            console.log('⚠️ Index may already exist:', error.message);
        }

        try {
            await db.execute('CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority)');
            console.log('✅ Created index on priority');
        } catch (error) {
            console.log('⚠️ Index may already exist:', error.message);
        }

        // Update existing orders to have order numbers
        console.log('🔢 Updating existing orders with order numbers...');
        const result = await db.execute('UPDATE orders SET order_number = 1000 + id WHERE order_number IS NULL');
        console.log(`✅ Updated ${result.rowsAffected} orders with order numbers`);

        // Test the connection
        console.log('🧪 Testing database connection...');
        const testResult = await db.execute('SELECT COUNT(*) as count FROM orders');
        console.log(`✅ Database test successful. Found ${testResult.rows[0].count} orders.`);

        console.log('🎉 Database update completed successfully!');

    } catch (error) {
        console.error('❌ Error updating database:', error);
        process.exit(1);
    }
}

updateDatabase();