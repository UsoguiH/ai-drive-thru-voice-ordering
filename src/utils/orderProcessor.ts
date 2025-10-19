/**
 * Simple utility to convert voice orders to JSON and ensure they reach the kitchen
 * This provides a fallback mechanism when WebSocket connections fail
 */

export interface OrderItem {
  name: string;
  nameAr?: string;
  quantity: number;
  price: number;
  customizations?: string[];
}

export interface OrderData {
  items: OrderItem[];
  total: number;
  language: "en" | "ar";
  customerNote?: string;
}

/**
 * Convert voice order to JSON format and save to database
 * Ensures orders always reach the kitchen system
 */
export async function submitOrderToKitchen(orderData: OrderData): Promise<{ success: boolean; orderId?: number; error?: string }> {
  try {
    console.log('📦 Submitting order to kitchen:', orderData);

    // Step 1: Save order to database via API
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: orderData.items,
        total: orderData.total,
        language: orderData.language,
        customerNote: orderData.customerNote || 'Voice order',
        status: 'pending',
        priority: 1,
        estimatedTime: 15,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save order: ${response.status}`);
    }

    const createdOrder = await response.json();
    console.log('✅ Order saved to database:', createdOrder);

    // Step 2: Try WebSocket notification (optional, may fail)
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8083';
      const ws = new WebSocket(`${wsUrl}/ws`);

      const timeout = setTimeout(() => {
        ws.close();
        console.log('⚠️ WebSocket notification timeout, but order is saved');
      }, 2000);

      ws.onopen = () => {
        console.log('📡 WebSocket connected, notifying kitchen...');

        // Identify as customer
        ws.send(JSON.stringify({
          type: 'identify',
          clientType: 'customer',
          orderId: createdOrder.id.toString()
        }));

        // Send new order notification
        ws.send(JSON.stringify({
          type: 'newOrder',
          order: {
            ...createdOrder,
            items: typeof createdOrder.items === 'string' ? JSON.parse(createdOrder.items) : createdOrder.items
          }
        }));

        clearTimeout(timeout);
        ws.close();
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.log('⚠️ WebSocket notification failed, but order is saved to database');
      };

    } catch (wsError) {
      console.log('⚠️ WebSocket notification failed, but order is saved to database');
    }

    // Step 3: Force kitchen display refresh (fallback)
    // Since we're using HTTP polling, the kitchen will detect the new order within 3 seconds

    return {
      success: true,
      orderId: createdOrder.id
    };

  } catch (error) {
    console.error('❌ Failed to submit order to kitchen:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Convert voice order items to JSON string for logging/debugging
 */
export function orderToJSON(orderData: OrderData): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    items: orderData.items.map(item => ({
      name: item.name,
      nameAr: item.nameAr,
      quantity: item.quantity,
      price: item.price,
      customizations: item.customizations || []
    })),
    total: orderData.total,
    language: orderData.language,
    customerNote: orderData.customerNote || 'Voice order'
  }, null, 2);
}

/**
 * Create a simple text summary of the order for confirmation
 */
export function createOrderSummary(orderData: OrderData): string {
  const itemNames = orderData.items.map(item => {
    const customText = item.customizations && item.customizations.length > 0
      ? ` [${item.customizations.join(', ')}]`
      : '';
    return `${item.quantity}x ${item.name}${customText}`;
  }).join(', ');

  return `${itemNames} - Total: $${orderData.total.toFixed(2)}`;
}