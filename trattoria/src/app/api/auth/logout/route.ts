import { NextResponse } from 'next/server';
import { clearSessionCookie, getSessionCookie, verifySessionCookie } from '@/lib/auth';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * POST /api/auth/logout
 * 
 * Purpose:
 * - Clear session cookie
 * - Optionally revoke Firebase refresh tokens
 */
export async function POST() {
    try {
        // Get current session to revoke if needed
        const sessionCookie = await getSessionCookie();

        if (sessionCookie) {
            try {
                // Verify and get UID
                const decodedToken = await verifySessionCookie(sessionCookie, false);

                // Revoke all refresh tokens for this user
                // This will invalidate all active sessions
                await adminAuth.revokeRefreshTokens(decodedToken.uid);

                console.log(`Revoked refresh tokens for user: ${decodedToken.uid}`);
            } catch (error) {
                console.error('Token revocation failed (non-critical):', error);
                // Continue with cookie clearing even if revocation fails
            }
        }

        // Clear the session cookie
        await clearSessionCookie();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        // Still try to clear cookie even if there's an error
        await clearSessionCookie();
        return NextResponse.json({ success: true });
    }
}
