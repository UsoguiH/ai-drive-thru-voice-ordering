import { WebSocketServer, WebSocket } from 'ws';
import Database from 'better-sqlite3';

// Use local SQLite database
const db = new Database('ai-drive-thru.db');

const wss = new WebSocketServer({
  port: parseInt(process.env.WS_PORT || '8080'),
  path: '/ws'
});

console.log(`🔥 WebSocket server running on ws://localhost:${process.env.WS_PORT || 8080}`);

// Store connected clients by type
const clients = new Map<WebSocket, {
  type: 'kitchen' | 'customer';
  orderId?: string;
  lastPing: number;
}>();

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket, req) => {
  console.log('📡 New WebSocket connection established');

  // Add client with default values
  clients.set(ws, {
    type: 'customer', // default
    lastPing: Date.now()
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Kitchen Display System',
    timestamp: new Date().toISOString()
  }));

  // Handle messages from clients
  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message);
      const client = clients.get(ws);

      if (!client) return;

      console.log('📨 Received message:', data);

      switch (data.type) {
        case 'identify':
          // Client identifies as kitchen or customer
          client.type = data.clientType;
          if (data.orderId) {
            client.orderId = data.orderId;
          }
          console.log(`👤 Client identified as: ${client.type}${client.orderId ? ` (order: ${client.orderId})` : ''}`);

          // Send current orders if it's a kitchen client
          if (client.type === 'kitchen') {
            const currentOrders = await getCurrentOrders();
            ws.send(JSON.stringify({
              type: 'currentOrders',
              orders: currentOrders,
              timestamp: new Date().toISOString()
            }));
          }
          break;

        case 'orderUpdate':
          // Kitchen staff updating order status
          if (client.type === 'kitchen') {
            await handleOrderStatusUpdate(data.orderId, data.status, data.kitchenNote);

            // Broadcast the update to all relevant clients
            await broadcastOrderUpdate(data.orderId);
          }
          break;

        case 'newOrder':
          // New order created - broadcast to all kitchen clients
          await broadcastToKitchens({
            type: 'newOrder',
            order: data.order,
            timestamp: new Date().toISOString()
          });
          break;

        case 'ping':
          // Keep-alive ping
          client.lastPing = Date.now();
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
          break;

        default:
          console.log('❓ Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('🔌 Client disconnected');
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    clients.delete(ws);
  });
});

// Get current orders from database
async function getCurrentOrders() {
  try {
    const result = await db.execute(`
      SELECT * FROM orders
      WHERE status != 'completed'
      ORDER BY
        CASE priority
          WHEN 3 THEN 1
          WHEN 2 THEN 2
          WHEN 1 THEN 3
        END,
        createdAt ASC
    `);

    return result.rows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items as string) : row.items
    }));
  } catch (error) {
    console.error('❌ Error fetching current orders:', error);
    return [];
  }
}

// Handle order status updates
async function handleOrderStatusUpdate(orderId: string, newStatus: string, kitchenNote?: string) {
  try {
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    // Add timestamps based on status
    if (newStatus === 'in_progress' && !updateData.startedAt) {
      updateData.startedAt = new Date().toISOString();
    } else if (newStatus === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }

    // Add kitchen note if provided
    if (kitchenNote) {
      updateData.kitchenNote = kitchenNote;
    }

    // Build dynamic SQL query
    const setClause = Object.keys(updateData)
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.values(updateData);
    values.push(orderId);

    await db.execute(`
      UPDATE orders
      SET ${setClause}
      WHERE id = ?
    `, values);

    console.log(`✅ Order ${orderId} updated to status: ${newStatus}`);
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    throw error;
  }
}

// Broadcast order update to all relevant clients
async function broadcastOrderUpdate(orderId: string) {
  try {
    // Get updated order from database
    const result = await db.execute(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);

    if (result.rows.length === 0) return;

    const order = {
      ...result.rows[0],
      items: typeof result.rows[0].items === 'string' ? JSON.parse(result.rows[0].items as string) : result.rows[0].items
    };

    const updateMessage = {
      type: 'orderUpdate',
      order: order,
      timestamp: new Date().toISOString()
    };

    // Broadcast to all clients
    for (const [client, clientInfo] of clients) {
      if (client.readyState === WebSocket.OPEN) {
        // Send to all kitchen clients
        if (clientInfo.type === 'kitchen') {
          client.send(JSON.stringify(updateMessage));
        }
        // Send to customer who owns this order
        else if (clientInfo.type === 'customer' && clientInfo.orderId === orderId) {
          client.send(JSON.stringify(updateMessage));
        }
      }
    }
  } catch (error) {
    console.error('❌ Error broadcasting order update:', error);
  }
}

// Broadcast message to all kitchen clients
async function broadcastToKitchens(message: any) {
  for (const [client, clientInfo] of clients) {
    if (clientInfo.type === 'kitchen' && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

// Cleanup inactive connections every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [client, clientInfo] of clients) {
    if (now - clientInfo.lastPing > 60000) { // 1 minute timeout
      console.log('🧹 Cleaning up inactive connection');
      client.terminate();
      clients.delete(client);
    }
  }
}, 30000);

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');

  // Close all connections
  for (const [client] of clients) {
    client.close();
  }

  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

export default wss;