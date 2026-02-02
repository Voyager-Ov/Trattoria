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

        // 3. Get user from database (STRICT: DB is source of truth)
        let dbUser = null;
        try {
            dbUser = await prisma.user.findUnique({
                where: { firebaseUid: decodedToken.uid },
                select: { id: true, rol: true, estado: true },
            });
        } catch (dbError) {
            console.error('Database lookup failed:', dbError);
            return NextResponse.json(
                { error: 'System error during verification' },
                { status: 500 }
            );
        }

        if (!dbUser) {
            console.warn(`[Verify API] Valid session but User not found in DB: ${decodedToken.uid}`);
            // User might be deleted from DB but has valid session cookie
            return NextResponse.json(
                { error: 'User account not found' },
                { status: 403 }
            );
        }

        // Check if user is active
        if (dbUser.estado !== 'ACTIVO') {
            return NextResponse.json(
                { error: 'User account is inactive' },
                { status: 403 }
            );
        }

        const userRol = dbUser.rol as 'ADMIN' | 'EMPLEADO';

        // Sync Firebase Custom Claims if they're out of date
        if (decodedToken.rol !== dbUser.rol) {
            console.log(`Syncing custom claims for ${decodedToken.uid}: ${decodedToken.rol} → ${dbUser.rol}`);
            await import('@/lib/firebase-admin').then(({ adminAuth }) =>
                adminAuth.setCustomUserClaims(decodedToken.uid, { rol: dbUser.rol })
            );
        }

        // 4. Extract user claims and add database ID
        const claims = getUserClaims(decodedToken);
        const responseData = {
            id: dbUser.id,
            email: claims.email,
            rol: userRol,
            firebaseUid: claims.firebaseUid
        };

        console.log(`[Verify API] User: ${claims.email} | DB Role: ${userRol}`);

        // 5. Return data for middleware and client
        return NextResponse.json({
            success: true,
            user: responseData
        });

    } catch (error) {
        console.error('Verify error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
