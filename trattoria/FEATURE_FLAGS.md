# 🚀 Sistema de Feature Flags - Trattoria

Sistema de control de funcionalidades por ambiente para desplegar incrementalmente sin exponer pantallas incompletas.

## 📋 Conceptos Clave

- **Desarrollo**: Todas las features están **siempre habilitadas** (puedes ver todo)
- **Producción**: Solo las features configuradas en `.env.production` están habilitadas
- **Coming Soon**: Features deshabilitadas muestran un overlay atractivo con información del release

## 🎯 Features Disponibles

| Feature | Descripción | Release | Estado |
|---------|-------------|---------|--------|
| `analytics` | Reportes avanzados (gráficos, KPIs) | Release 2 | 🔴 Bloqueado |
| `insumos` | Gestión de stock e inventario | Release 2 | 🔴 Bloqueado |
| `egresos_edit` | Edición de gastos | Release 2 | 🔴 Bloqueado |
| `ingresos_edit` | Edición de ingresos | Release 2 | 🔴 Bloqueado |
| `recetas` | Recetas y cálculo de costos | Release 3 | 🔴 Bloqueado |
| `empleados` | Gestión de equipo y permisos | Release 3 | 🔴 Bloqueado |
| `promociones` | Sistema de descuentos | Release 3 | 🔴 Bloqueado |

## 🛠️ Uso en Desarrollo

### Ver Todo (Default)
```bash
npm run dev
```
✅ Todas las features están habilitadas automáticamente

### Simular Producción
```bash
# Crear .env.production.local
cp .env.production.example .env.production.local

# Editar y deshabilitar features
# NEXT_PUBLIC_FEATURE_ANALYTICS=false

# Ejecutar en modo producción
npm run build
npm start
```

## 🌐 Configuración en Producción (Vercel)

### Opción A: Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Agrega las variables que quieres habilitar:

```env
NEXT_PUBLIC_FEATURE_ANALYTICS=true
NEXT_PUBLIC_FEATURE_INSUMOS=true
```

4. **Redeploy** para aplicar cambios

### Opción B: Archivo .env.production

1. Crea `.env.production` en la raíz del proyecto
2. Agrega las features habilitadas:

```env
NEXT_PUBLIC_FEATURE_ANALYTICS=true
NEXT_PUBLIC_FEATURE_INSUMOS=true
```

3. Commitea y pushea (Vercel lo detectará automáticamente)

## 📝 Implementar en Nuevas Pantallas

### Página Completa

```tsx
"use client";

import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay";
import { isFeatureEnabled, getFeatureConfig } from "@/lib/features";

export default function MiNuevaPagina() {
  const enabled = isFeatureEnabled('mi_feature');
  const config = getFeatureConfig('mi_feature');

  if (!enabled) {
    return (
      <div className="p-8 bg-zinc-50 min-h-screen">
        <ComingSoonOverlay
          title={config.name}
          description={config.description}
          releaseDate={config.releaseDate}
          features={config.features}
        />
      </div>
    );
  }

  return <div>{/* Contenido real */}</div>;
}
```

### Sección/Tab Específico

```tsx
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay";
import { isFeatureEnabled, getFeatureConfig } from "@/lib/features";

export default function MiComponente() {
  const enabled = isFeatureEnabled('mi_feature');
  const config = getFeatureConfig('mi_feature');

  return (
    <div>
      {enabled ? (
        <MiContenidoReal />
      ) : (
        <ComingSoonOverlay
          title={config.name}
          description={config.description}
          releaseDate={config.releaseDate}
          features={config.features}
        >
          <MiContenidoReal /> {/* Se muestra blureado de fondo */}
        </ComingSoonOverlay>
      )}
    </div>
  );
}
```

## ➕ Agregar Nueva Feature

### 1. Definir en `src/lib/features.ts`

```typescript
export type FeatureFlag = 
  | 'analytics'
  | 'insumos'
  | 'mi_nueva_feature'; // ← Agregar aquí

export const FEATURE_CONFIGS: Record<FeatureFlag, FeatureConfig> = {
  // ... otras features
  mi_nueva_feature: {
    name: "Mi Nueva Feature",
    description: "Descripción clara de qué hace",
    releaseDate: "Release 3 - Mayo 2026",
    features: [
      "Funcionalidad 1",
      "Funcionalidad 2",
      "Funcionalidad 3"
    ]
  }
};
```

### 2. Agregar a .env.production.example

```env
# Mi Nueva Feature
NEXT_PUBLIC_FEATURE_MI_NUEVA_FEATURE=false
```

### 3. Usar en el código

```tsx
const enabled = isFeatureEnabled('mi_nueva_feature');
```

## 🔍 Debugging

### Verificar estado de features

```tsx
// En cualquier componente
console.log('Analytics enabled:', isFeatureEnabled('analytics'));
console.log('Environment:', process.env.NODE_ENV);
```

### Ver configuración completa

```tsx
import { FEATURE_CONFIGS } from "@/lib/features";
console.log('All features:', FEATURE_CONFIGS);
```

## 📊 Plan de Releases

### Release 1 - MVP (EN PRODUCCIÓN)
✅ Login/Autenticación  
✅ Pedidos (crear, ver, cambiar estado)  
✅ Productos (listar, toggle disponible)  
✅ Dashboard básico (KPIs simples)  
✅ Configuración del negocio  

### Release 2 - Financiero (Marzo 2026)
🔓 `NEXT_PUBLIC_FEATURE_ANALYTICS=true`  
🔓 `NEXT_PUBLIC_FEATURE_INSUMOS=true`  
🔓 `NEXT_PUBLIC_FEATURE_EGRESOS_EDIT=true`  

### Release 3 - Optimización (Abril 2026)
🔓 `NEXT_PUBLIC_FEATURE_RECETAS=true`  
🔓 `NEXT_PUBLIC_FEATURE_EMPLEADOS=true`  
🔓 `NEXT_PUBLIC_FEATURE_PROMOCIONES=true`  

## 🎨 Personalizar Overlay

### Modificar diseño global
Edita `src/components/ui/coming-soon-overlay.tsx`

### Callback personalizado
```tsx
<ComingSoonOverlay
  title="Mi Feature"
  description="Descripción"
  releaseDate="Pronto"
  features={["Feature 1", "Feature 2"]}
  onNotifyMe={() => {
    // Lógica personalizada (enviar a Slack, guardar en DB, etc.)
    console.log('Usuario interesado en esta feature');
  }}
/>
```

## 🚨 Errores Comunes

### "Feature always shows Coming Soon in dev"
- Verifica que `NODE_ENV=development` esté configurado
- Asegúrate de que `isFeatureEnabled()` use el nombre correcto de la feature

### "Changes not reflected in Vercel"
- Variables de entorno requieren **redeploy**
- No basta con cambiar la variable, debes hacer redeploy del proyecto

### "Overlay appears even when feature is true"
- Las variables deben empezar con `NEXT_PUBLIC_`
- El valor debe ser exactamente `'true'` (string)
- Verifica con `console.log(process.env.NEXT_PUBLIC_FEATURE_X)`

## 📞 Soporte

Si tienes dudas sobre el sistema de feature flags, consulta:
- `src/lib/features.ts` - Lógica central
- `src/components/ui/coming-soon-overlay.tsx` - Componente UI
- Este README

---

Última actualización: Febrero 2026
