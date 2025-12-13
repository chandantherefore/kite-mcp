import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

// GET /api/conflicts?accountId=[id]&status=[status]
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt((session.user as any).id);
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
      // Verify account belongs to user
      const account = await db.getAccountById(accountId, userId);
      if (!account) {
        return NextResponse.json(
          { success: false, error: 'Account not found' },
          { status: 404 }
        );
      }
    }

    const conflicts = await db.getConflicts(userId, accountId, status);

    // Enrich with account names - user-specific
    const enrichedConflicts = await Promise.all(
      conflicts.map(async (conflict) => {
        const account = await db.getAccountById(conflict.account_id, userId);
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

