/**
 * Role-Based Access Control (RBAC) for Trattoria
 * Simplified compared to Alquimia (no multi-tenant)
 * 
 * Roles:
 * - ADMIN: Full access to all features (productos, pedidos, insumos, reportes, usuarios)
 * - EMPLEADO: Limited access (pedidos, cocina views)
 */

export type Rol = 'ADMIN' | 'EMPLEADO';

export type AccessResult =
    | 'ALLOW'
    | 'REDIRECT_LOGIN'
    | 'REDIRECT_HOME';

/**
 * Route patterns for different roles
 */
export const ROUTES = {
    PUBLIC: [
        '/',
        '/login',
    ],
    EMPLEADO: [
        '/dashboard',
        '/pedidos',
        '/cocina',
    ],
    ADMIN: [
        '/admin',
        '/productos',
        '/categorias',
        '/insumos',
        '/recetas',
        '/reportes',
        '/usuarios',
    ],
} as const;

/**
 * Check if a route matches a pattern
 */
function matchesRoute(pathname: string, patterns: readonly string[]): boolean {
    return patterns.some(pattern => {
        // Exact match
        if (pathname === pattern) return true;
        // Starts with pattern (for nested routes like /productos/nuevo)
        if (pathname.startsWith(pattern + '/')) return true;
        return false;
    });
}

/**
 * Determine if user has access to a route
 * @param rol - User's role (ADMIN or EMPLEADO)
 * @param pathname - Request pathname
 * @returns AccessResult indicating what action to take
 */
export function routeAccess(
    rol: Rol | null,
    pathname: string
): AccessResult {
    // Public routes - always allow
    if (matchesRoute(pathname, ROUTES.PUBLIC)) {
        return 'ALLOW';
    }

    // No role = not authenticated
    if (!rol) {
        return 'REDIRECT_LOGIN';
    }

    // ADMIN has access to everything
    if (rol === 'ADMIN') {
        return 'ALLOW';
    }

    // EMPLEADO can access employee routes
    if (rol === 'EMPLEADO') {
        // Check if route is in EMPLEADO allowed routes
        if (matchesRoute(pathname, ROUTES.EMPLEADO)) {
            return 'ALLOW';
        }
        // Empleado trying to access admin route
        return 'REDIRECT_HOME';
    }

    // Fallback: deny access
    return 'REDIRECT_LOGIN';
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRol: Rol | null, requiredRol: Rol): boolean {
    if (!userRol) return false;
    // ADMIN has all permissions
    if (userRol === 'ADMIN') return true;
    return userRol === requiredRol;
}

/**
 * Check if user is admin
 */
export function isAdmin(rol: Rol | null): boolean {
    return rol === 'ADMIN';
}
