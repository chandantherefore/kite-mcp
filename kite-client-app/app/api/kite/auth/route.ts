import { executeKiteTool } from '@/lib/kite-service';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...args } = body;

    if (action === 'login') {
      // args: { client_id, api_key?, api_secret? }
      const result = await executeKiteTool('login', args);

      // Extract URL from markdown if possible, or just return the message
      // Message format: "Please click... [Login...](https://kite.zerodha.com/connect/login?api_key=...) ..."
      const message = result.message || '';

      // Updated regex to match both kite.trade and kite.zerodha.com
      const match = message.match(/\((https:\/\/[^)]+)\)/);
      const loginUrl = match ? match[1] : null;

      return NextResponse.json({
        ...result,
        loginUrl
      });
    }

    if (action === 'session') {
      // args: { client_id, request_token }
      const result = await executeKiteTool('generate_session', args);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

