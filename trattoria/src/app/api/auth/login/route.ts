import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { createSessionCookie, setSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

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
    // F-06: Rate limit — 5 attempts per IP per minute, then block 5 min
    const ip = getClientIp(request);
    const rl = rateLimit(`login:${ip}`, { limit: 5, windowMs: 60_000, blockMs: 5 * 60_000 });
    if (!rl.allowed) {
        return NextResponse.json(
            { error: 'Demasiados intentos. Intentá de nuevo en unos minutos.' },
            {
                status: 429,
                headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) }
            }
        );
    }

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

        // 3. Check if user exists in database (STRICT CHECK)
        // We check by firebaseUid OR email (to handle pre-invited users)
        let dbUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { firebaseUid: uid },
                    { email: email }
                ]
            }
        });

        if (!dbUser) {
            // BOOTSTRAP LOGIC: Check if this email is allowed to be an admin
            const { isBootstrapAdmin } = await import('@/lib/auth');

            if (isBootstrapAdmin(email)) {
                console.log(`🚀 [Bootstrap] Creating admin user for allowlisted email: ${email}`);
                dbUser = await prisma.user.create({
                    data: {
                        firebaseUid: uid,
                        email: email,
                        rol: 'ADMIN',
                        estado: 'ACTIVO'
                    }
                });
            } else {
                console.log(`🚫 Login attempt rejected for unregistered user: ${email}`);
                return NextResponse.json(
                    { error: 'No formas parte de la organización.' },
                    { status: 403 }
                );
            }
        }

        // 4. Update user data if needed (e.g. first login after invite)
        try {
            const updates: any = {};

            // Link Firebase UID if not set (pre-invite)
            if (dbUser.firebaseUid !== uid) {
                updates.firebaseUid = uid;
            }
            // Update email if changed (unlikely but good hygiene)
            if (dbUser.email !== email) {
                updates.email = email;
            }

            // Only hit DB if there are updates
            if (Object.keys(updates).length > 0) {
                dbUser = await prisma.user.update({
                    where: { id: dbUser.id },
                    data: updates
                });
            }

            // Sync Firebase Custom Claims ensuring they match DB role
            const firebaseUser = await adminAuth.getUser(uid);
            const currentClaims = firebaseUser.customClaims?.rol;

            if (currentClaims !== dbUser.rol) {
                console.log(`Syncing claims for ${email}: ${currentClaims} -> ${dbUser.rol}`);
                await adminAuth.setCustomUserClaims(uid, {
                    rol: dbUser.rol,
                });
            }

            // Use dbUser for response
            var userData = {
                id: dbUser.id,
                email: dbUser.email,
                rol: dbUser.rol,
            };

        } catch (dbError) {
            console.error('Database sync failed:', dbError);
            // If strict check passed but update failed, we can still proceed 
            // but we should probably err on safe side. 
            // For now, let's allow login if they exist.
            userData = {
                id: dbUser.id,
                email: dbUser.email,
                rol: dbUser.rol as 'ADMIN' | 'EMPLEADO',
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
