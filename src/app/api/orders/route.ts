import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, like, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = db.select().from(orders).orderBy(desc(orders.createdAt));

    const conditions = [];

    if (status) {
      conditions.push(eq(orders.status, status));
    }

    if (search) {
      conditions.push(like(orders.customerNote, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, total, language, customerNote, status, priority, estimatedTime } = body;

    // Validate required fields
    if (!items) {
      return NextResponse.json(
        { error: 'Items field is required', code: 'MISSING_ITEMS' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items must be an array', code: 'INVALID_ITEMS_TYPE' },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Items array cannot be empty', code: 'EMPTY_ITEMS_ARRAY' },
        { status: 400 }
      );
    }

    if (total === undefined || total === null) {
      return NextResponse.json(
        { error: 'Total field is required', code: 'MISSING_TOTAL' },
        { status: 400 }
      );
    }

    if (typeof total !== 'number') {
      return NextResponse.json(
        { error: 'Total must be a number', code: 'INVALID_TOTAL_TYPE' },
        { status: 400 }
      );
    }

    if (total <= 0) {
      return NextResponse.json(
        { error: 'Total must be a positive number', code: 'INVALID_TOTAL_VALUE' },
        { status: 400 }
      );
    }

    if (!language) {
      return NextResponse.json(
        { error: 'Language field is required', code: 'MISSING_LANGUAGE' },
        { status: 400 }
      );
    }

    if (language !== 'en' && language !== 'ar') {
      return NextResponse.json(
        { error: 'Language must be either "en" or "ar"', code: 'INVALID_LANGUAGE' },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ['pending', 'in_progress', 'ready', 'completed'];
    const orderStatus = status || 'pending';

    if (!validStatuses.includes(orderStatus)) {
      return NextResponse.json(
        {
          error: 'Status must be one of: pending, in_progress, ready, completed',
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Validate priority if provided
    const validPriorities = [1, 2, 3]; // normal, high, urgent
    const orderPriority = priority && validPriorities.includes(priority) ? priority : 1;

    // Validate estimated time if provided
    if (estimatedTime !== undefined && (typeof estimatedTime !== 'number' || estimatedTime < 0)) {
      return NextResponse.json(
        { error: 'Estimated time must be a positive number', code: 'INVALID_ESTIMATED_TIME' },
        { status: 400 }
      );
    }

    // Validate items structure
    for (const item of items) {
      if (!item.name || typeof item.name !== 'string') {
        return NextResponse.json(
          { error: 'Each item must have a valid name', code: 'INVALID_ITEM_NAME' },
          { status: 400 }
        );
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          {
            error: 'Each item must have a valid positive quantity',
            code: 'INVALID_ITEM_QUANTITY',
          },
          { status: 400 }
        );
      }
      if (item.price === undefined || typeof item.price !== 'number' || item.price < 0) {
        return NextResponse.json(
          { error: 'Each item must have a valid price', code: 'INVALID_ITEM_PRICE' },
          { status: 400 }
        );
      }
    }

    const timestamp = new Date().toISOString();

    // Generate order number
    const orderNumber = await generateOrderNumber();

    const newOrder = await db
      .insert(orders)
      .values({
        items: JSON.stringify(items),
        total,
        status: orderStatus,
        orderNumber,
        priority: orderPriority,
        estimatedTime: estimatedTime || null,
        language,
        customerNote: customerNote?.trim() || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    return NextResponse.json(newOrder[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

// Helper function to generate order number
async function generateOrderNumber(): Promise<number> {
  try {
    // Get the highest order number and increment by 1
    const result = await db
      .select({ orderNumber: orders.orderNumber })
      .from(orders)
      .orderBy(desc(orders.orderNumber))
      .limit(1);

    return result.length > 0 ? result[0].orderNumber + 1 : 1001; // Start from 1001
  } catch (error) {
    console.error('Error generating order number:', error);
    return Date.now() % 10000 + 1000; // Fallback to timestamp-based number
  }
}