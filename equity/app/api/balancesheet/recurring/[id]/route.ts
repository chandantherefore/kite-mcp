import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { bsDb } from '@/lib/balancesheet-db';

// GET /api/balancesheet/recurring/[id] - Get a specific recurring transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const id = parseInt(params.id);

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

    return NextResponse.json({ success: true, recurring });
  } catch (error: any) {
    console.error('Error fetching recurring transaction:', error);
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

// PUT /api/balancesheet/recurring/[id] - Update a recurring transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const id = parseInt(params.id);
    const body = await request.json();
    const { categoryId, bankId, amount, description } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recurring transaction ID' },
        { status: 400 }
      );
    }

    if (!categoryId || !bankId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Category, bank, and amount are required' },
        { status: 400 }
      );
    }

    // Verify category and bank belong to user
    const category = await bsDb.getCategoryById(categoryId, user.id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    const bank = await bsDb.getBankById(bankId, user.id);
    if (!bank) {
      return NextResponse.json(
        { success: false, error: 'Bank not found' },
        { status: 404 }
      );
    }

    await bsDb.updateRecurring(
      id,
      user.id,
      categoryId,
      bankId,
      parseFloat(amount),
      description
    );
    const recurring = await bsDb.getRecurringById(id, user.id);

    return NextResponse.json({ success: true, recurring });
  } catch (error: any) {
    console.error('Error updating recurring transaction:', error);
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

// DELETE /api/balancesheet/recurring/[id] - Delete a recurring transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recurring transaction ID' },
        { status: 400 }
      );
    }

    await bsDb.deleteRecurring(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting recurring transaction:', error);
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


