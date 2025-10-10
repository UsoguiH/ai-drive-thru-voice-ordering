import { db } from '@/db';
import { orders } from '@/db/schema';

async function main() {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    const sampleOrders = [
        {
            items: [
                { name: 'Cheeseburger', quantity: 2, price: 7.99 },
                { name: 'Large Fries', quantity: 1, price: 4.99 },
                { name: 'Coca Cola', quantity: 2, price: 2.99 }
            ],
            total: 26.95,
            status: 'pending',
            language: 'en',
            customerNote: 'Extra ketchup please',
            createdAt: new Date(twoHoursAgo.getTime() + 15 * 60 * 1000).toISOString(),
            updatedAt: new Date(twoHoursAgo.getTime() + 15 * 60 * 1000).toISOString(),
        },
        {
            items: [
                { name: 'Double Burger', quantity: 1, price: 9.99 },
                { name: 'Medium Fries', quantity: 1, price: 3.99 },
                { name: 'Orange Juice', quantity: 1, price: 3.49 }
            ],
            total: 17.47,
            status: 'preparing',
            language: 'ar',
            customerNote: null,
            createdAt: new Date(twoHoursAgo.getTime() + 45 * 60 * 1000).toISOString(),
            updatedAt: new Date(twoHoursAgo.getTime() + 45 * 60 * 1000).toISOString(),
        },
        {
            items: [
                { name: 'Chicken Burger', quantity: 1, price: 8.49 },
                { name: 'Small Fries', quantity: 1, price: 2.49 },
                { name: 'Coffee', quantity: 1, price: 2.99 },
                { name: 'Apple Pie', quantity: 1, price: 2.49 }
            ],
            total: 16.46,
            status: 'completed',
            language: 'en',
            customerNote: 'No onions please',
            createdAt: new Date(twoHoursAgo.getTime() + 75 * 60 * 1000).toISOString(),
            updatedAt: new Date(twoHoursAgo.getTime() + 75 * 60 * 1000).toISOString(),
        },
        {
            items: [
                { name: 'Veggie Burger', quantity: 1, price: 7.49 },
                { name: 'Large Fries', quantity: 1, price: 4.99 },
                { name: 'Water', quantity: 2, price: 1.99 }
            ],
            total: 16.46,
            status: 'pending',
            language: 'en',
            customerNote: 'Make it spicy',
            createdAt: new Date(twoHoursAgo.getTime() + 95 * 60 * 1000).toISOString(),
            updatedAt: new Date(twoHoursAgo.getTime() + 95 * 60 * 1000).toISOString(),
        },
        {
            items: [
                { name: 'Double Burger', quantity: 2, price: 9.99 },
                { name: 'Medium Fries', quantity: 2, price: 3.99 },
                { name: 'Pepsi', quantity: 2, price: 2.99 },
                { name: 'Ice Cream', quantity: 2, price: 2.49 }
            ],
            total: 38.94,
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