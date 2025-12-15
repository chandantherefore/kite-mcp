import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { bsDb } from '@/lib/balancesheet-db';

// GET /api/balancesheet/banks - List all banks for the current user
export async function GET() {
  try {
    const user = await requireAuth();
    const banks = await bsDb.getBanks(user.id);
    
    return NextResponse.json({ success: true, banks });
  } catch (error: any) {
    console.error('Error fetching banks:', error);
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

// POST /api/balancesheet/banks - Create a new bank
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, balance, ifsc_code, account_name, account_number } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const bankId = await bsDb.createBank(
      user.id,
      name,
      balance ? parseFloat(balance) : 0,
      ifsc_code,
      account_name,
      account_number
    );
    const bank = await bsDb.getBankById(bankId, user.id);

    return NextResponse.json(
      { success: true, bank },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating bank:', error);
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

