import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { bsDb } from '@/lib/balancesheet-db';

// GET /api/balancesheet/transactions - List transactions with filters
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') as 'income' | 'expense' | null;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;
    const bankId = searchParams.get('bankId') ? parseInt(searchParams.get('bankId')!) : undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    
    const result = await bsDb.getTransactions(user.id, {
      type: type || undefined,
      month,
      year,
      categoryId,
      bankId,
      page,
      limit,
    });
    
    return NextResponse.json({
      success: true,
      transactions: result.transactions,
      total: result.total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
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

// POST /api/balancesheet/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { categoryId, bankId, type, amount, transactionDate, description } = body;

    if (!categoryId || !bankId || !type || !amount || !transactionDate) {
      return NextResponse.json(
        { success: false, error: 'Category, bank, type, amount, and date are required' },
        { status: 400 }
      );
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { success: false, error: 'Type must be income or expense' },
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

    const transactionId = await bsDb.createTransaction(
      user.id,
      categoryId,
      bankId,
      type,
      parseFloat(amount),
      new Date(transactionDate),
      description
    );
    const transaction = await bsDb.getTransactionById(transactionId, user.id);

    return NextResponse.json(
      { success: true, transaction },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating transaction:', error);
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



