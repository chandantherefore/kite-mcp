import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { bsDb } from '@/lib/balancesheet-db';

// POST /api/balancesheet/recurring/[id]/add-to-month - Add recurring transaction to current month
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const id = parseInt(params.id);
    const body = await request.json();
    const { month, year } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recurring transaction ID' },
        { status: 400 }
      );
    }

    const recurring = await bsDb.getRecurringById(id, user.id);
    if (!recurring) {
      return NextResponse.json(
        { success: false, error: 'Recurring transaction not found' },
        { status: 404 }
      );
    }

    // Use provided month/year or current month
    const now = new Date();
    const targetMonth = month !== undefined ? month : now.getMonth() + 1;
    const targetYear = year || now.getFullYear();
    const transactionDate = new Date(targetYear, targetMonth - 1, 1);

    // Check for duplicate
    const isDuplicate = await bsDb.checkDuplicateRecurringTransaction(
      user.id,
      id,
      targetMonth,
      targetYear
    );

    if (isDuplicate) {
      return NextResponse.json(
        { success: false, error: 'This transaction has already been added for this month' },
        { status: 400 }
      );
    }

    // Create transaction from recurring
    const transactionId = await bsDb.createTransaction(
      user.id,
      recurring.category_id,
      recurring.bank_id,
      recurring.type,
      recurring.amount,
      transactionDate,
      recurring.description || undefined
    );
    const transaction = await bsDb.getTransactionById(transactionId, user.id);

    return NextResponse.json(
      { success: true, transaction },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding recurring to month:', error);
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

