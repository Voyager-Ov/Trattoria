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
    | 'REDIRECT_HOME'
    | 'DENY';

/**
 * Route patterns por rol
 * Usa regex para match flexible con paths dinámicos
 */
export const ROUTES = {
    PUBLIC: /^\/($|login|register)/,
    ADMIN: /^\/admin(\/|$)/,
    EMPLEADO: /^\/empleado(\/|$)/,
} as const;

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
    // 1. Public routes - always allow
    if (ROUTES.PUBLIC.test(pathname)) {
        return 'ALLOW';
    }

    // 2. User is authenticated (middleware verified session) but has NO ROLE
    // Strict requirement: Users without roles should not access any protected route
    if (!rol) {
        return 'DENY';
    }

    // 3. Admin Routes - STRICT: Only ADMIN
    if (ROUTES.ADMIN.test(pathname)) {
        return rol === 'ADMIN' ? 'ALLOW' : 'REDIRECT_HOME';
    }

    // 4. Employee Routes - STRICT: Only EMPLEADO
    // Admin cannot access employee portal (per strict request)
    if (ROUTES.EMPLEADO.test(pathname)) {
        return rol === 'EMPLEADO' ? 'ALLOW' : 'REDIRECT_HOME';
    }

    // Default to allow (e.g. static assets, public pages not caught by PUBLIC)
    return 'ALLOW';
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
