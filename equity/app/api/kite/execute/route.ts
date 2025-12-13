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
    const { tool, args } = body;

    if (!tool) {
      return NextResponse.json({ error: 'Tool name is required' }, { status: 400 });
    }

    // Add user_id and account_id to args if not present
    const enrichedArgs = {
      ...args,
      user_id: userId,
      account_id: args.account_id || args.client_id, // Support both for backward compatibility
    };

    const result = await executeKiteTool(tool, enrichedArgs);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

