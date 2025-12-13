import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/accounts - List all accounts for the current user
export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const accounts = await db.getAccounts(userId);

    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create a new account for the current user
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;

    const body = await request.json();
    const { name, broker_id, api_key, api_secret } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }
    const accountId = await db.createAccount(userId, name, broker_id, api_key, api_secret);
    const account = await db.getAccountById(accountId, userId);

    return NextResponse.json(
      { success: true, account },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating account:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

