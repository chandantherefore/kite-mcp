import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { bsDb } from '@/lib/balancesheet-db';

// GET /api/balancesheet/categories/[id] - Get a specific category
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid category ID' },
                { status: 400 }
            );
        }

        const category = await bsDb.getCategoryById(id, user.id);

        if (!category) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, category });
    } catch (error: any) {
        console.error('Error fetching category:', error);
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

// PUT /api/balancesheet/categories/[id] - Update a category
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const id = parseInt(params.id);
        const body = await request.json();
        const { name, description } = body;

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid category ID' },
                { status: 400 }
            );
        }

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Name is required' },
                { status: 400 }
            );
        }

        await bsDb.updateCategory(id, user.id, name, description);
        const category = await bsDb.getCategoryById(id, user.id);

        return NextResponse.json({ success: true, category });
    } catch (error: any) {
        console.error('Error updating category:', error);
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

// DELETE /api/balancesheet/categories/[id] - Delete a category
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid category ID' },
                { status: 400 }
            );
        }

        await bsDb.deleteCategory(id, user.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting category:', error);
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



