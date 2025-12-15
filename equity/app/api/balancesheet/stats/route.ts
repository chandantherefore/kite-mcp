import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { bsDb } from '@/lib/balancesheet-db';

// GET /api/balancesheet/stats - Get statistics for dashboard
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    
    const stats = await bsDb.getStats(user.id, { month, year });
    
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
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



