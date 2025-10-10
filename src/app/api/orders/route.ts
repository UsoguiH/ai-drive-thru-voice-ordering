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
    const { items, total, language, customerNote, status } = body;

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
    const validStatuses = ['pending', 'preparing', 'completed'];
    const orderStatus = status || 'pending';

    if (!validStatuses.includes(orderStatus)) {
      return NextResponse.json(
        {
          error: 'Status must be one of: pending, preparing, completed',
          code: 'INVALID_STATUS',
        },
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

    const newOrder = await db
      .insert(orders)
      .values({
        items: JSON.stringify(items),
        total,
        status: orderStatus,
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