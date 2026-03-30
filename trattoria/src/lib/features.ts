/**
 * features.ts — Server-side feature flag helper (F-13)
 *
 * WHY THIS FILE EXISTS:
 * NEXT_PUBLIC_FEATURE_* vars are embedded in the browser bundle — any user can
 * read them in DevTools and call Server Actions directly, bypassing the UI gate.
 *
 * RULE:
 *  - NEXT_PUBLIC_FEATURE_*  →  UI only: show/hide components, tabs, buttons.
 *  - FEATURE_*              →  Server guard: checked in Server Actions and API routes.
 *
 * USAGE in a Server Action:
 *   import { isFeatureEnabled } from '@/lib/features';
 *   if (!isFeatureEnabled('EGRESOS_EDIT')) {
 *       throw new Error('Esta funcionalidad no está habilitada');
 *   }
 *
 * USAGE in a component (UI toggle only — no security):
 *   process.env.NEXT_PUBLIC_FEATURE_INSUMOS === 'true'
 */

export type FeatureFlag =
    | 'ANALYTICS'
    | 'INSUMOS'
    | 'EGRESOS_EDIT'
    | 'INGRESOS_EDIT'
    | 'RECETAS'
    | 'EMPLEADOS'
    | 'PROMOCIONES';

/**
 * Check if a feature flag is enabled SERVER-SIDE.
 * Reads private env vars (FEATURE_*) — not sent to the browser.
 * Falls back to the public var (NEXT_PUBLIC_FEATURE_*) for gradual migration.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
    // 1. Check private server-only var first
    const privateVar = process.env[`FEATURE_${flag}`];
    if (privateVar !== undefined) {
        return privateVar === 'true';
    }

    // 2. Fallback: read the public var (backward compat — still server-side at this call site)
    const publicVar = process.env[`NEXT_PUBLIC_FEATURE_${flag}`];
    return publicVar === 'true';
}
