import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/accounts - List all accounts
export async function GET() {
  try {
    const accounts = await db.getAccounts();
    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create a new account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, broker_id } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const accountId = await db.createAccount(name, broker_id);
    const account = await db.getAccountById(accountId);

    return NextResponse.json(
      { success: true, account },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

