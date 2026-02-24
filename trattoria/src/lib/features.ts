// Sistema simple de feature flags
export function isFeatureEnabled(feature: 'reportes' | 'empleado_modules'): boolean {
    // En desarrollo, todo habilitado
    if (process.env.NODE_ENV === 'development') {
        return true;
    }

    // En producción, se controla con variables de entorno
    if (feature === 'reportes') {
        return true;
    }

    if (feature === 'empleado_modules') {
        return process.env.NEXT_PUBLIC_FEATURE_EMPLEADO_MODULES === 'true';
    }

    return false;
}
