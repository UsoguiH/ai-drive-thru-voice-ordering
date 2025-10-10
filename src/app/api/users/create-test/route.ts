import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, account } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        {
          error: 'Email, password, and name are required',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          error: 'Email already exists',
          code: 'EMAIL_EXISTS',
        },
        { status: 400 }
      );
    }

    // Generate unique user ID
    const userId = randomUUID();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get current timestamp
    const now = new Date();

    // Insert user
    const newUser = await db
      .insert(user)
      .values({
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        emailVerified: false,
        image: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Insert account
    await db
      .insert(account)
      .values({
        id: randomUUID(),
        accountId: normalizedEmail,
        providerId: 'credential',
        userId: userId,
        password: hashedPassword,
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Return user without password
    const userResponse = {
      id: newUser[0].id,
      name: newUser[0].name,
      email: newUser[0].email,
      emailVerified: newUser[0].emailVerified,
      image: newUser[0].image,
      createdAt: newUser[0].createdAt,
      updatedAt: newUser[0].updatedAt,
    };

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error,
      },
      { status: 500 }
    );
  }
}