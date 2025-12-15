import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Read the SQL file
        const sqlPath = join(process.cwd(), 'scripts', 'setup-balancesheet.sql');
        const sql = readFileSync(sqlPath, 'utf-8');

        // Split by semicolon and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const statement of statements) {
                if (statement.trim()) {
                    await connection.query(statement);
                }
            }

            await connection.commit();

            return NextResponse.json({
                success: true,
                message: 'Balance Sheet tables created successfully',
            });
        } catch (error: any) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error('Error setting up balance sheet tables:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}



