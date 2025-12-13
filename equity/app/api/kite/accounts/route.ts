import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import * as db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id);
    const accounts = await db.getAccounts(userId);

    // Return accounts with Kite auth status
    const accountsWithStatus = accounts.map(acc => ({
      id: acc.id.toString(),
      name: acc.name,
      has_credentials: !!(acc.api_key && acc.api_secret),
      is_authenticated: !!acc.access_token,
    }));

    return NextResponse.json({ accounts: accountsWithStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

