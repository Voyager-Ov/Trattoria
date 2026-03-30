import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { createSessionCookie, setSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const SESSION_MAX_AGE_MS = parseInt(process.env.SESSION_MAX_AGE_DAYS || '5', 10) * 24 * 60 * 60 * 1000;

interface RegisterBody {
    idToken: string;
    // NOTE: makeAdmin removed — privilege escalation vector. Only first user auto-promotes to ADMIN.
}

/**
 * POST /api/auth/register
 * 
 * Similar to login but for new users
 * Optional: can promote first user to ADMIN
 */
export async function POST(request: NextRequest) {
    // F-06: Rate limit — 3 attempts per IP per 10 minutes
    const ip = getClientIp(request);
    const rl = rateLimit(`register:${ip}`, { limit: 3, windowMs: 10 * 60_000 });
    if (!rl.allowed) {
        return NextResponse.json(
            { error: 'Demasiados intentos de registro. Intentá más tarde.' },
            {
                status: 429,
                headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) }
            }
        );
    }

    try {
        const body = await request.json() as RegisterBody;
        const { idToken } = body;

        if (!idToken) {
            return NextResponse.json(
                { error: 'ID token is required' },
                { status: 400 }
            );
        }

        // Verify Firebase ID token
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

        // Check if this is the first user (auto-promote to ADMIN)
        let isFirstUser = false;
        let userRol: 'ADMIN' | 'EMPLEADO' = 'EMPLEADO';

        try {
            const userCount = await prisma.user.count();
            isFirstUser = userCount === 0;

            if (isFirstUser) {
                userRol = 'ADMIN';
            }
        } catch (error) {
            console.error('User count check failed:', error);
        }

        // Create user in database
        let userData;
        try {
            userData = await prisma.user.create({
                data: {
                    firebaseUid: uid,
                    email,
                    rol: userRol,
                    estado: 'ACTIVO',
                },
            });

            // Set Firebase Custom Claims
            await adminAuth.setCustomUserClaims(uid, {
                rol: userRol,
            });

            if (isFirstUser) {
                console.log(`✅ First user created as ADMIN: ${email}`);
            }
        } catch (dbError) {
            console.error('User creation failed:', dbError);
            return NextResponse.json(
                { error: 'Failed to create user account' },
                { status: 500 }
            );
        }

        // Create session cookie
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

        // Set HttpOnly cookie
        try {
            await setSessionCookie(sessionCookie);
        } catch (error) {
            console.error('Failed to set session cookie:', error);
            return NextResponse.json(
                { error: 'Failed to set session cookie' },
                { status: 500 }
            );
        }

        // Return success
        return NextResponse.json({
            success: true,
            user: {
                id: userData.id,
                email: userData.email,
                rol: userData.rol,
            },
            isFirstUser,
        });

    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
