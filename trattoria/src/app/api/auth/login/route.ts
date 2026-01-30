import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { createSessionCookie, setSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const SESSION_MAX_AGE_MS = parseInt(process.env.SESSION_MAX_AGE_DAYS || '5', 10) * 24 * 60 * 60 * 1000;

interface LoginBody {
    idToken: string;
}

/**
 * POST /api/auth/login
 * 
 * Critical route for authentication
 * Flow:
 * 1. Receive Firebase ID token from client
 * 2. Verify token with Firebase Admin
 * 3. Sync user in database (upsert)
 * 4. Create session cookie
 * 5. Set HttpOnly cookie
 * 6. Return user data
 * 
 * SECURITY: This is where the session cookie is created
 * Any bugs here will cause "not authenticated" errors
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Parse request body
        const body = await request.json() as LoginBody;
        const { idToken } = body;

        if (!idToken) {
            return NextResponse.json(
                { error: 'ID token is required' },
                { status: 400 }
            );
        }

        // 2. Verify Firebase ID token
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid authentication token' },
                { status: 401 }
            );
        }

        const { uid, email } = decodedToken;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // 3. Sync user in database
        // Get existing custom claims (rol) from Firebase if they exist
        let userData;
        try {
            const firebaseUser = await adminAuth.getUser(uid);
            const existingRol = firebaseUser.customClaims?.rol as 'ADMIN' | 'EMPLEADO' | undefined;

            // Upsert user in database
            userData = await prisma.user.upsert({
                where: { firebaseUid: uid },
                update: {
                    email,
                    updatedAt: new Date(),
                },
                create: {
                    firebaseUid: uid,
                    email,
                    rol: existingRol || 'EMPLEADO', // Default to EMPLEADO if no rol set
                    estado: 'ACTIVO',
                },
            });

            // Sync Firebase Custom Claims if needed
            if (userData.rol && userData.rol !== existingRol) {
                await adminAuth.setCustomUserClaims(uid, {
                    rol: userData.rol,
                });
            }
        } catch (dbError) {
            console.error('Database sync failed (non-critical):', dbError);
            // Don't block login if DB sync fails
            // User will still have a valid session from Firebase
            userData = {
                id: uid,
                email,
                rol: 'EMPLEADO' as const,
            };
        }

        // 4. Create session cookie
        let sessionCookie;
        try {
            sessionCookie = await createSessionCookie(idToken, SESSION_MAX_AGE_MS);
        } catch (error) {
            console.error('Session cookie creation failed:', error);
            return NextResponse.json(
                { error: 'Failed to create session' },
                { status: 500 }
            );
        }

        // 5. Set HttpOnly cookie
        try {
            await setSessionCookie(sessionCookie);
        } catch (error) {
            console.error('Failed to set session cookie:', error);
            return NextResponse.json(
                { error: 'Failed to set session cookie' },
                { status: 500 }
            );
        }

        // 6. Return success response
        return NextResponse.json({
            success: true,
            user: {
                id: userData.id,
                email: userData.email,
                rol: userData.rol,
            },
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
