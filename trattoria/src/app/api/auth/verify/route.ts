import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, verifySessionCookie, getUserClaims } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/verify
 * 
 * CRITICAL ROUTE: Called by middleware on EVERY protected request
 * 
 * Purpose:
 * - Verify session cookie is valid
 * - Return user claims (firebaseUid, email, rol)
 * 
 * If this route fails, user will see "not authenticated" errors
 * even when they have a valid session
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Get session cookie
        // Try from request cookies first (for middleware calls)
        const cookieHeader = request.headers.get('cookie');
        let sessionCookie = cookieHeader
            ?.split(';')
            .find(c => c.trim().startsWith('session='))
            ?.split('=')[1];

        // Fallback to cookies() if not in header
        if (!sessionCookie) {
            sessionCookie = await getSessionCookie();
        }

        if (!sessionCookie) {
            return NextResponse.json(
                { error: 'No session cookie found' },
                { status: 401 }
            );
        }

        // 2. Verify session cookie
        let decodedToken;
        try {
            decodedToken = await verifySessionCookie(sessionCookie);
        } catch (error) {
            console.error('Session verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid or expired session' },
                { status: 401 }
            );
        }

        // 3. Get user from database to ensure up-to-date rol
        let userRol = (decodedToken.rol as 'ADMIN' | 'EMPLEADO' | undefined) ?? null;

        try {
            const user = await prisma.user.findUnique({
                where: { firebaseUid: decodedToken.uid },
                select: { rol: true, estado: true },
            });

            if (user) {
                // Check if user is active
                if (user.estado !== 'ACTIVO') {
                    return NextResponse.json(
                        { error: 'User account is inactive' },
                        { status: 403 }
                    );
                }

                // Use database rol (source of truth)
                userRol = user.rol as 'ADMIN' | 'EMPLEADO';

                // Sync Firebase Custom Claims if they're out of date
                if (decodedToken.rol !== user.rol) {
                    console.log(`Syncing custom claims for ${decodedToken.uid}: ${decodedToken.rol} → ${user.rol}`);
                    // Note: This won't affect current session, but will apply to future sessions
                    await import('@/lib/firebase-admin').then(({ adminAuth }) =>
                        adminAuth.setCustomUserClaims(decodedToken.uid, { rol: user.rol })
                    );
                }
            }
        } catch (dbError) {
            console.error('Database lookup failed (non-critical):', dbError);
            // Use token rol as fallback if DB lookup fails
        }

        // 4. Extract user claims
        const claims = getUserClaims(decodedToken);
        claims.rol = userRol; // Use the rol from database

        // 5. Return claims for middleware
        return NextResponse.json(claims);

    } catch (error) {
        console.error('Verify error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
