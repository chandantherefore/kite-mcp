import { executeKiteTool } from '@/lib/kite-service';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id);
    const body = await req.json();
    const { action, account_id, ...args } = body;

    if (!account_id) {
      return NextResponse.json({ error: 'account_id is required' }, { status: 400 });
    }

    if (action === 'login') {
      const result = await executeKiteTool('login', { account_id, user_id: userId, ...args });

      // loginUrl is already included in the result from executeKiteTool
      return NextResponse.json(result);
    }

    if (action === 'session') {
      const { request_token } = args;
      if (!request_token) {
        return NextResponse.json({ error: 'request_token is required' }, { status: 400 });
      }
      const result = await executeKiteTool('generate_session', { account_id, user_id: userId, request_token });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

