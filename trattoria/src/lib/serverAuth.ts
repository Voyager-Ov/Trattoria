/**
 * serverAuth.ts
 * Centralized server-side authentication helpers.
 *
 * Use these in:
 *  - Server Actions ("use server" files)
 *  - Route Handlers (API routes)
 *
 * NEVER rely on middleware alone for API/action protection.
 * Middleware only guards pages, not /api routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserServer, verifySessionCookie } from './auth';
import { prisma } from './prisma';

// ─────────────────────────────────────────────
// SERVER ACTION HELPERS
// Usage: const user = await requireAdmin();
// ─────────────────────────────────────────────

/**
 * Requires an active ADMIN session.
 * Throws if the caller is not an authenticated ADMIN.
 * Use at the top of any admin-only Server Action.
 */
export async function requireAdmin() {
    const user = await getAuthenticatedUserServer();
    if (!user || user.rol !== 'ADMIN') {
        throw new Error('UNAUTHORIZED: admin role required');
    }
    return user;
}

/**
 * Requires an active ADMIN or EMPLEADO session.
 * Throws if the caller is not authenticated.
 * Use at the top of any employee-accessible Server Action.
 */
export async function requireEmployee() {
    const user = await getAuthenticatedUserServer();
    if (!user) {
        throw new Error('UNAUTHORIZED: session required');
    }
    return user;
}

// ─────────────────────────────────────────────
// API ROUTE HANDLER HELPERS
// Usage: const auth = await requireAdminApiAuth(request);
//        if (auth.error) return auth.error;
// ─────────────────────────────────────────────

type ApiAuthResult =
    | { user: { id: string; rol: string; estado: string }; error?: undefined }
    | { error: NextResponse; user?: undefined };

/**
 * Requires a valid ADMIN session cookie for API route handlers.
 * Returns { user } on success, { error: NextResponse } on failure.
 * The caller must return auth.error immediately if it exists.
 */
export async function requireAdminApiAuth(request: NextRequest): Promise<ApiAuthResult> {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
        return {
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }

    try {
        const decoded = await verifySessionCookie(sessionCookie);
        const user = await prisma.user.findUnique({
            where: { firebaseUid: decoded.uid },
            select: { id: true, rol: true, estado: true },
        });

        if (!user || user.estado !== 'ACTIVO') {
            return {
                error: NextResponse.json({ error: 'Cuenta inactiva o no encontrada' }, { status: 403 }),
            };
        }

        if (user.rol !== 'ADMIN') {
            return {
                error: NextResponse.json({ error: 'Forbidden: se requiere rol ADMIN' }, { status: 403 }),
            };
        }

        return { user };
    } catch {
        return {
            error: NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 }),
        };
    }
}
