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
    console.log(`[Middleware Exec] ${request.method} ${request.nextUrl.pathname} at ${new Date().toISOString()}`);
    const { pathname } = request.nextUrl;

    // Skip middleware for API routes, static files, etc.
    if (shouldSkipMiddleware(pathname)) {
        return NextResponse.next();
    }

    // Public routes (no auth required)
    if (pathname === '/' || pathname === '/login') {
        return NextResponse.next();
    }

    // All other routes require authentication
    // Get session cookie
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
        console.log(`❌ No session cookie for ${pathname}, redirecting to /login`);
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

        console.log(`[Middleware] Path: ${pathname} | Role: ${rol}`);

        // Check route access based on role
        const accessResult = routeAccess(rol, pathname);
        console.log(`[Middleware] Access Result: ${accessResult}`);

        if (accessResult === 'REDIRECT_LOGIN') {
            console.log(`❌ Access denied for ${pathname} (role: ${rol}), redirecting to login`);
            // Access denied based on valid role -> likely just wrong role, but maybe safer to logout?
            // Actually, if they are logged in but wrong role, we shouldn't force logout, just redirect to their dashboard or login?
            // Existing logic just redirects. That's fine.
            return NextResponse.redirect(new URL('/login?error=permission_denied', request.url));
        }

        if (accessResult === 'REDIRECT_HOME') {
            const dashboardUrl = rol === 'ADMIN' ? '/admin/dashboard' : '/empleado';
            console.log(`⚠️ Insufficient permissions for ${pathname} (role: ${rol}), redirecting to ${dashboardUrl}`);
            return NextResponse.redirect(new URL(dashboardUrl, request.url));
        }

        if (accessResult === 'DENY') {
            console.log(`🚫 Access strictly denied for ${pathname} (role: ${rol})`);
            return new NextResponse('Acceso denegado', { status: 403 });
        }

        // Access granted
        console.log(`✅ Access granted for ${pathname} (role: ${rol})`);
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
