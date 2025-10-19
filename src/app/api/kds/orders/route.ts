import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeCompleted = searchParams.get('includeCompleted') === 'true';

    // Build conditions
    const conditions = [];

    // Filter by status if specified
    if (status) {
      const validStatuses = ['pending', 'in_progress', 'ready', 'completed'];
      if (validStatuses.includes(status)) {
        conditions.push(eq(orders.status, status));
      } else {
        return NextResponse.json(
          { error: 'Invalid status parameter', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
    } else if (!includeCompleted) {
      // By default, exclude completed orders
      conditions.push(
        or(
          eq(orders.status, 'pending'),
          eq(orders.status, 'in_progress'),
          eq(orders.status, 'ready')
        )
      );
    }

    // Filter by priority if specified
    if (priority) {
      const priorityValue = parseInt(priority);
      if (priorityValue >= 1 && priorityValue <= 3) {
        conditions.push(eq(orders.priority, priorityValue));
      } else {
        return NextResponse.json(
          { error: 'Priority must be 1, 2, or 3', code: 'INVALID_PRIORITY' },
          { status: 400 }
        );
      }
    }

    // Build the query
    let query = db.select().from(orders);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Order by priority first, then by creation time
    query = query.orderBy(
      // Priority 3 (urgent) first, then 2 (high), then 1 (normal)
      desc(orders.priority),
      // Then by creation time (oldest first)
      orders.createdAt
    );

    const results = await query.limit(limit).offset(offset);

    // Parse JSON fields for each order
    const parsedResults = results.map(order => {
      try {
        let parsedItems;
        if (typeof order.items === 'string') {
          // Skip corrupted "[object Object]" entries
          if (order.items === '[object Object]') {
            parsedItems = [];
          } else {
            parsedItems = JSON.parse(order.items);
          }
        } else if (typeof order.items === 'object' && order.items !== null) {
          parsedItems = order.items;
        } else {
          parsedItems = [];
        }

        return {
          ...order,
          items: parsedItems
        };
      } catch (error) {
        console.warn(`Failed to parse items for order ${order.id}:`, order.items);
        return {
          ...order,
          items: []
        };
      }
    });

    // Get summary statistics
    const summaryQuery = db.select().from(orders);
    const summaryConditions = includeCompleted
      ? []
      : [
          or(
            eq(orders.status, 'pending'),
            eq(orders.status, 'in_progress'),
            eq(orders.status, 'ready')
          )
        ];

    const summaryResults = summaryConditions.length > 0
      ? await summaryQuery.where(and(...summaryConditions))
      : await summaryQuery;

    const summary = {
      total: summaryResults.length,
      pending: summaryResults.filter(o => o.status === 'pending').length,
      inProgress: summaryResults.filter(o => o.status === 'in_progress').length,
      ready: summaryResults.filter(o => o.status === 'ready').length,
      completed: summaryResults.filter(o => o.status === 'completed').length,
      urgent: summaryResults.filter(o => o.priority === 3).length,
      high: summaryResults.filter(o => o.priority === 2).length,
      normal: summaryResults.filter(o => o.priority === 1).length,
    };

    return NextResponse.json({
      orders: parsedResults,
      summary,
      pagination: {
        limit,
        offset,
        hasMore: results.length === limit
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET /api/kds/orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}