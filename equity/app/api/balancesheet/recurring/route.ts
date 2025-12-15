import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { bsDb } from '@/lib/balancesheet-db';

// GET /api/balancesheet/recurring - List all recurring transactions
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as 'income' | 'expense' | null;

        const recurring = await bsDb.getRecurring(user.id, type || undefined);

        return NextResponse.json({ success: true, recurring });
    } catch (error: any) {
        console.error('Error fetching recurring transactions:', error);
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

// POST /api/balancesheet/recurring - Create a new recurring transaction
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { categoryId, bankId, type, amount, description } = body;

        if (!categoryId || !bankId || !type || !amount) {
            return NextResponse.json(
                { success: false, error: 'Category, bank, type, and amount are required' },
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

        const recurringId = await bsDb.createRecurring(
            user.id,
            categoryId,
            bankId,
            type,
            parseFloat(amount),
            description
        );
        const recurring = await bsDb.getRecurringById(recurringId, user.id);

        return NextResponse.json(
            { success: true, recurring },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating recurring transaction:', error);
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



