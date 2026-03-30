import { NextRequest, NextResponse } from 'next/server';
import { routeAccess } from './src/lib/roles';

/**
 * Next.js Middleware for Route Protection
 * Runs on EVERY request before reaching the page
 * 
 * Purpose:
 * - Verify user has valid session
 * - Check role-based access control
 * - Redirect to login if unauthorized
 * 
 * CRITICAL: This must work correctly or users will see auth errors
 */

/**  
 * Helper to check if a path should skip middleware
 */
function shouldSkipMiddleware(pathname: string): boolean {
    return (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.') // Static files
    );
}

export async function middleware(request: NextRequest) {
    const isDev = process.env.NODE_ENV === 'development';
    const { pathname } = request.nextUrl;
    if (isDev) console.log(`[Middleware] ${request.method} ${pathname}`);

    // Skip middleware for API routes, static files, etc.
    if (shouldSkipMiddleware(pathname)) {
        return NextResponse.next();
    }

    // Public routes (no auth required)
    // Includes the public catalog: /, /login, /categoria/*, /carrito
    const isPublic = (
        pathname === '/' ||
        pathname === '/login' ||
        pathname.startsWith('/categoria') ||
        pathname.startsWith('/carrito') ||
        pathname.startsWith('/producto')
    );
    if (isPublic) {
        return NextResponse.next();
    }

    // All other routes require authentication
    // Get session cookie
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
        if (isDev) console.log(`[Middleware] No session for ${pathname}`);
        return NextResponse.redirect(new URL('/login?error=session_expired', request.url));
    }

    // Verify session by calling our verify endpoint
    try {
        const verifyUrl = new URL('/api/auth/verify', request.url);

        const verifyResponse = await fetch(verifyUrl, {
            method: 'GET',
            headers: {
                'Cookie': `session=${sessionCookie}`,
            },
        });

        if (!verifyResponse.ok) {
            console.log(`❌ Session verification failed for ${pathname}: ${verifyResponse.status}`);
            const response = NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
            response.cookies.delete('session');
            return response;
        }

        // Get user claims from verify response
        const responseJson = await verifyResponse.json();
        // data.user is where the user data lives
        const rol = responseJson.user?.rol;

        if (isDev) console.log(`[Middleware] Path: ${pathname} | Role: ${rol}`);

        // Check route access based on role
        const accessResult = routeAccess(rol, pathname);
        if (isDev) console.log(`[Middleware] Access: ${accessResult}`);

        if (accessResult === 'REDIRECT_LOGIN') {
            return NextResponse.redirect(new URL('/login?error=permission_denied', request.url));
        }

        if (accessResult === 'REDIRECT_HOME') {
            const dashboardUrl = rol === 'ADMIN' ? '/admin/dashboard' : '/empleado';
            return NextResponse.redirect(new URL(dashboardUrl, request.url));
        }

        if (accessResult === 'DENY') {
            return new NextResponse('Acceso denegado', { status: 403 });
        }

        return NextResponse.next();

    } catch (error) {
        console.error('Middleware error:', error);
        // On error, redirect to login for safety and clear cookie
        const response = NextResponse.redirect(new URL('/login?error=session_error', request.url));
        response.cookies.delete('session');
        return response;
    }
}

/**
 * Configure which routes trigger the middleware
 * Excludes: api routes, static files, images, favicon
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
