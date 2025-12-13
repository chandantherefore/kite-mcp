import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

/**
 * Get the current authenticated user session
 * Returns null if user is not authenticated
 */
export async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return null;
    }
    return {
        id: parseInt((session.user as any).id),
        email: session.user.email!,
        name: session.user.name,
        role: (session.user as any).role || 'user',
    };
}

/**
 * Require authentication - throws error if user is not authenticated
 * Use this in server components and API routes
 */
export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Unauthorized');
    }
    return user;
}

/**
 * Require admin role - throws error if user is not admin
 */
export async function requireAdmin() {
    const user = await requireAuth();
    if (user.role !== 'admin') {
        throw new Error('Forbidden');
    }
    return user;
}

/**
 * Check if user owns a resource (by user_id)
 * Returns true if user owns the resource, false otherwise
 */
export async function checkResourceOwnership(resourceUserId: number): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) {
        return false;
    }
    return user.id === resourceUserId;
}

/**
 * Require resource ownership - throws error if user doesn't own the resource
 */
export async function requireResourceOwnership(resourceUserId: number) {
    const user = await requireAuth();
    if (user.id !== resourceUserId) {
        throw new Error('Forbidden');
    }
    return user;
}

