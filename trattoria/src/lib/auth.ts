import { cookies } from 'next/headers';
import { adminAuth } from './firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { prisma } from '@/lib/prisma';

/**
 * Session cookie management utilities
 * Based on Alquimia's working implementation
 * 
 * Flow:
 * 1. Client authenticates with Firebase (browser)
 * 2. Client sends ID token to /api/auth/login
 * 3. Server creates session cookie from ID token
 * 4. Server sets HttpOnly session cookie
 * 5. Subsequent requests include session cookie
 * 6. Middleware verifies session cookie on each request
 */

const COOKIE_NAME = 'session';
const SESSION_MAX_AGE_DAYS = parseInt(process.env.SESSION_MAX_AGE_DAYS || '5', 10);
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

export interface UserClaims {
    firebaseUid: string;
    email: string | null;
    rol: 'ADMIN' | 'EMPLEADO' | null;
}

/**
 * Create a session cookie from a Firebase ID token
 * @param idToken - Firebase ID token from client
 * @param expiresInMs - Session expiration time in milliseconds
 * @returns Session cookie string
 */
export async function createSessionCookie(
    idToken: string,
    expiresInMs: number = SESSION_MAX_AGE_MS
): Promise<string> {
    try {
        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn: expiresInMs,
        });
        return sessionCookie;
    } catch (error) {
        console.error('Error creating session cookie:', error);
        throw new Error('Failed to create session cookie');
    }
}

/**
 * Set session cookie in the browser
 * SECURITY: HttpOnly, Secure, SameSite=Lax
 * @param sessionCookie - Session cookie string from createSessionCookie
 */
export async function setSessionCookie(sessionCookie: string): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(COOKIE_NAME, sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60, // seconds
        path: '/',
    });
}

/**
 * Clear session cookie (logout)
 */
export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

/**
 * Verify and decode a session cookie
 * @param sessionCookie - Session cookie value
 * @param checkRevoked - Whether to check if token was revoked
 * @returns Decoded token with user claims
 */
export async function verifySessionCookie(
    sessionCookie: string,
    checkRevoked: boolean = true
): Promise<DecodedIdToken> {
    try {
        const decodedClaims = await adminAuth.verifySessionCookie(
            sessionCookie,
            checkRevoked
        );
        return decodedClaims;
    } catch (error) {
        console.error('Error verifying session cookie:', error);
        throw new Error('Invalid or expired session');
    }
}

/**
 * Get current session cookie from request
 */
export async function getSessionCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value;
}

export function getUserClaims(decodedToken: DecodedIdToken): UserClaims {
    return {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email ?? null,
        rol: (decodedToken.rol as 'ADMIN' | 'EMPLEADO') ?? null,
    };
}

/**
 * STRICT Server-Side Authentication Helper
 * Use this in Server Components (Layouts, Pages) and Server Actions.
 * 
 * Verifies session cookie AND ensures user exists in Database with correct role.
 * Prevents access by deleted users or users with stale claims.
 */
export async function getAuthenticatedUserServer() {
    const session = await getSessionCookie();

    if (!session) {
        console.warn('[Auth] No session cookie found');
        return null;
    }

    try {
        const claims = await verifySessionCookie(session);
        // console.log(`[Auth] Session valid for UID: ${claims.uid}`); // Silenced to reduce logs

        const dbUser = await prisma.user.findUnique({
            where: { firebaseUid: claims.uid },
            select: {
                id: true,
                email: true,
                displayName: true,
                phone: true,
                rol: true,
                estado: true,
                firebaseUid: true
            }
        });

        if (!dbUser) {
            console.warn(`[Auth] User missing in DB: ${claims.uid}`);
            return null;
        }

        if (dbUser.estado !== 'ACTIVO') {
            console.warn(`[Auth] User inactive: ${dbUser.email}`);
            return null;
        }

        return dbUser;

    } catch (error) {
        console.error('[Auth] Server verification failed:', error);
        // Re-throw if it's a DB connection error to avoid "UNAUTHORIZED" red herring
        if (error instanceof Error && error.message.includes('Prisma')) {
            throw error;
        }
        return null;
    }
}

/**
 * Check if an email is in the bootstrap admin allowlist
 */
export function isBootstrapAdmin(email: string): boolean {
    const enabled = process.env.BOOTSTRAP_ENABLED === 'true';
    if (!enabled) return false;

    const allowlist = process.env.BOOTSTRAP_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    return allowlist.includes(email.toLowerCase());
}
