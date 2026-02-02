import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getSessionCookie, verifySessionCookie } from '@/lib/auth';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * Common logout logic
 */
async function handleLogout() {
    try {
        const sessionCookie = await getSessionCookie();

        if (sessionCookie) {
            try {
                const decodedToken = await verifySessionCookie(sessionCookie, false);
                await adminAuth.revokeRefreshTokens(decodedToken.uid);
                console.log(`Revoked refresh tokens for user: ${decodedToken.uid}`);
            } catch (error) {
                console.error('Token revocation failed (likely invalid session):', error);
            }
        }

        await clearSessionCookie();
        return true;
    } catch (error) {
        console.error('Logout error:', error);
        await clearSessionCookie();
        return false;
    }
}

/**
 * POST /api/auth/logout
 * Client-side logout
 */
export async function POST() {
    await handleLogout();
    return NextResponse.json({ success: true });
}

/**
 * GET /api/auth/logout
 * Server-side redirect logout (cleanup)
 */
export async function GET(request: NextRequest) {
    await handleLogout();
    return NextResponse.redirect(new URL('/login', request.url));
}
