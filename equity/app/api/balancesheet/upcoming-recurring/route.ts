import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { bsDb } from '@/lib/balancesheet-db';

// GET /api/balancesheet/upcoming-recurring - Get upcoming recurring transactions
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const monthsAhead = searchParams.get('monthsAhead') 
      ? parseInt(searchParams.get('monthsAhead')!) 
      : 3;
    
    const upcoming = await bsDb.getUpcomingRecurring(user.id, monthsAhead);
    
    return NextResponse.json({ success: true, upcoming });
  } catch (error: any) {
    console.error('Error fetching upcoming recurring:', error);
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



