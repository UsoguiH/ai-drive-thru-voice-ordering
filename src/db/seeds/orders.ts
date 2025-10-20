import { db } from '@/db';
import { orders } from '@/db/schema';

async function main() {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    const sampleOrders = [
        {
            items: [
                { name: 'Cheeseburger', quantity: 2, price: 18.00 },
                { name: 'Large Fries', quantity: 1, price: 12.00 },
                { name: 'Coca Cola', quantity: 2, price: 7.00 }
            ],
            total: 62.00,
            status: 'pending',
            language: 'en',
            customerNote: 'Extra ketchup please',
            createdAt: new Date(twoHoursAgo.getTime() + 15 * 60 * 1000).toISOString(),
            updatedAt: new Date(twoHoursAgo.getTime() + 15 * 60 * 1000).toISOString(),
        },
        {
            items: [
                { name: 'Double Burger', quantity: 1, price: 22.00 },
                { name: 'Medium Fries', quantity: 1, price: 10.00 },
                { name: 'Orange Juice', quantity: 1, price: 9.00 }
            ],
            total: 41.00,
            status: 'preparing',
            language: 'ar',
            customerNote: null,
            createdAt: new Date(twoHoursAgo.getTime() + 45 * 60 * 1000).toISOString(),
            updatedAt: new Date(twoHoursAgo.getTime() + 45 * 60 * 1000).toISOString(),
        },
        {
            items: [
                { name: 'Chicken Burger', quantity: 1, price: 20.00 },
                { name: 'Small Fries', quantity: 1, price: 8.00 },
                { name: 'Coffee', quantity: 1, price: 8.00 },
                { name: 'Apple Pie', quantity: 1, price: 10.00 }
            ],
            total: 46.00,
            status: 'completed',
            language: 'en',
            customerNote: 'No onions please',
            createdAt: new Date(twoHoursAgo.getTime() + 75 * 60 * 1000).toISOString(),
            updatedAt: new Date(twoHoursAgo.getTime() + 75 * 60 * 1000).toISOString(),
        },
        {
            items: [
                { name: 'Veggie Burger', quantity: 1, price: 16.00 },
                { name: 'Large Fries', quantity: 1, price: 12.00 },
                { name: 'Water', quantity: 2, price: 4.00 }
            ],
            total: 36.00,
            status: 'pending',
            language: 'en',
            customerNote: 'Make it spicy',
            createdAt: new Date(twoHoursAgo.getTime() + 95 * 60 * 1000).toISOString(),
            updatedAt: new Date(twoHoursAgo.getTime() + 95 * 60 * 1000).toISOString(),
        },
        {
            items: [
                { name: 'Double Burger', quantity: 2, price: 22.00 },
                { name: 'Medium Fries', quantity: 2, price: 10.00 },
                { name: 'Pepsi', quantity: 2, price: 7.00 },
                { name: 'Ice Cream', quantity: 2, price: 8.00 }
            ],
            total: 94.00,
            status: 'preparing',
            language: 'ar',
            customerNote: 'Extra sauce',
            createdAt: new Date(twoHoursAgo.getTime() + 110 * 60 * 1000).toISOString(),
            updatedAt: new Date(twoHoursAgo.getTime() + 110 * 60 * 1000).toISOString(),
        }
    ];

    await db.insert(orders).values(sampleOrders);
    
    console.log('✅ Orders seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});