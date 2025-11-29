import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/conflicts?accountId=[id]&status=[status]
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountIdParam = searchParams.get('accountId');
    const status = searchParams.get('status') || 'pending';
    
    let accountId: number | undefined;
    
    if (accountIdParam) {
      accountId = parseInt(accountIdParam);
      if (isNaN(accountId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid account ID' },
          { status: 400 }
        );
      }
    }

    const conflicts = await db.getConflicts(accountId, status);

    // Enrich with account names
    const enrichedConflicts = await Promise.all(
      conflicts.map(async (conflict) => {
        const account = await db.getAccountById(conflict.account_id);
        return {
          ...conflict,
          account_name: account?.name || 'Unknown',
        };
      })
    );

    return NextResponse.json({
      success: true,
      conflicts: enrichedConflicts,
      total: enrichedConflicts.length,
    });
  } catch (error: any) {
    console.error('Error fetching conflicts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

