import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { bsDb } from '@/lib/balancesheet-db';

// GET /api/balancesheet/banks/[id] - Get a specific bank
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bank ID' },
        { status: 400 }
      );
    }

    const bank = await bsDb.getBankById(id, user.id);
    
    if (!bank) {
      return NextResponse.json(
        { success: false, error: 'Bank not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, bank });
  } catch (error: any) {
    console.error('Error fetching bank:', error);
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

// PUT /api/balancesheet/banks/[id] - Update a bank
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, balance, ifsc_code, account_name, account_number } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bank ID' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    await bsDb.updateBank(
      id,
      user.id,
      name,
      parseFloat(balance || 0),
      ifsc_code,
      account_name,
      account_number
    );
    const bank = await bsDb.getBankById(id, user.id);

    return NextResponse.json({ success: true, bank });
  } catch (error: any) {
    console.error('Error updating bank:', error);
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

// DELETE /api/balancesheet/banks/[id] - Delete a bank
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bank ID' },
        { status: 400 }
      );
    }

    await bsDb.deleteBank(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting bank:', error);
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

