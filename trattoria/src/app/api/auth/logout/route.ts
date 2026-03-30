import { NextResponse } from 'next/server';
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
 * F-10: Only POST supported — GET logout is a CSRF vector.
 * A simple <img src="/api/auth/logout"> on any page would log out any visitor.
 */
export async function POST() {
    await handleLogout();
    return NextResponse.json({ success: true });
}
