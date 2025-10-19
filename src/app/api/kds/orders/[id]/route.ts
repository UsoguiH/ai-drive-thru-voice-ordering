import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface OrderUpdateRequest {
  status: 'pending' | 'in_progress' | 'ready' | 'completed';
  kitchenNote?: string;
  estimatedTime?: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      );
    }

    const body: OrderUpdateRequest = await request.json();
    const { status, kitchenNote, estimatedTime } = body;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'ready', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: 'Status must be one of: pending, in_progress, ready, completed',
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    // Validate estimated time if provided
    if (estimatedTime !== undefined && (typeof estimatedTime !== 'number' || estimatedTime < 0)) {
      return NextResponse.json(
        { error: 'Estimated time must be a positive number', code: 'INVALID_ESTIMATED_TIME' },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    // Add timestamps based on status transitions
    const currentOrder = existingOrder[0];

    if (status === 'in_progress' && currentOrder.status !== 'in_progress' && !currentOrder.startedAt) {
      updateData.startedAt = new Date().toISOString();
    } else if (status === 'completed' && currentOrder.status !== 'completed') {
      updateData.completedAt = new Date().toISOString();
    }

    // Add optional fields
    if (kitchenNote !== undefined) {
      updateData.kitchenNote = kitchenNote?.trim() || null;
    }

    if (estimatedTime !== undefined) {
      updateData.estimatedTime = estimatedTime;
    }

    // Update the order
    const updatedOrders = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    if (updatedOrders.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update order', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    const updatedOrder = updatedOrders[0];

    // Emit WebSocket notification if WebSocket server is available
    try {
      const wsUrl = process.env.WS_SERVER_URL || 'ws://localhost:8080';
      // This would typically be handled by the WebSocket server
      // but we could also trigger a notification here if needed
      console.log(`Order ${orderId} updated to status: ${status}`);
    } catch (wsError) {
      console.error('WebSocket notification failed:', wsError);
      // Don't fail the request if WebSocket notification fails
    }

    return NextResponse.json(updatedOrder, { status: 200 });

  } catch (error) {
    console.error('PATCH /api/kds/orders/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      );
    }

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(order[0], { status: 200 });

  } catch (error) {
    console.error('GET /api/kds/orders/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}