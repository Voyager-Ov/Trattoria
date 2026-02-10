# 🧪 Guía de Prueba: ComingSoonOverlay & Feature Flags

## 📋 Resumen Rápido

El sistema de feature flags te permite:
- ✅ **Desarrollo**: Ver y trabajar en todas las pantallas
- 🚫 **Producción**: Ocultar features no terminadas detrás del ComingSoonOverlay

## 🔄 Comportamiento por Ambiente

### En Desarrollo (`npm run dev`)
```bash
NODE_ENV=development
```
- ✅ **Todas las features HABILITADAS automáticamente**
- Puedes ver Analytics, Insumos, etc sin restricciones
- No necesitas configurar nada

### En Producción (Vercel o `npm start`)
```bash
NODE_ENV=production
```
- 🚫 **Todas las features DESHABILITADAS por defecto**
- Solo se habilitan si defines `NEXT_PUBLIC_FEATURE_X=true`
- Muestra el ComingSoonOverlay con animación de cohete 🚀

---

## 🧪 Probar ComingSoonOverlay en Local

### Opción 1: Modo Producción Completo (Recomendado)

**Paso 1:** Edita `.env.production` (ya creado)
```bash
# Deja las features en false para ver el overlay
NEXT_PUBLIC_FEATURE_ANALYTICS=false
NEXT_PUBLIC_FEATURE_INSUMOS=false
```

**Paso 2:** Compila en modo producción
```bash
npm run build
```

**Paso 3:** Inicia en modo producción
```bash
npm start
```

**Paso 4:** Abre http://localhost:3000
- 🔓 Loguéate como admin
- 📊 Ve a Dashboard → Reportes
- 👀 Verás el ComingSoonOverlay en las pestañas Analytics

**Paso 5:** Prueba habilitando una feature
```bash
# Edita .env.production
NEXT_PUBLIC_FEATURE_ANALYTICS=true
```

**Paso 6:** Recompila y reinicia
```bash
npm run build
npm start
```

### Opción 2: Desarrollo Normal (Sin Overlay)

```bash
# Simplemente corre el dev server
npm run dev

# Todas las features están habilitadas
# No verás el overlay, puedes trabajar normalmente
```

---

## 🌐 Deployar a Vercel

### Paso 1: Push a GitHub
```bash
git add .
git commit -m "Feature flags implementados"
git push origin main
```

### Paso 2: Configurar Variables en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega las siguientes variables para **Production**:

```
NEXT_PUBLIC_FEATURE_ANALYTICS=false
NEXT_PUBLIC_FEATURE_INSUMOS=false
NEXT_PUBLIC_FEATURE_RECETAS=false
NEXT_PUBLIC_FEATURE_EGRESOS_EDIT=false
NEXT_PUBLIC_FEATURE_INGRESOS_EDIT=false
NEXT_PUBLIC_FEATURE_EMPLEADOS=false
NEXT_PUBLIC_FEATURE_PROMOCIONES=false
```

### Paso 3: Deploy
Vercel auto-deploya cuando haces push a main.

### Paso 4: Habilitar Features Progresivamente

Cuando termines una feature (ej: Analytics):

1. En Vercel → Settings → Environment Variables
2. Cambia `NEXT_PUBLIC_FEATURE_ANALYTICS` de `false` → `true`
3. Redeploya (Deployments → ... → Redeploy)

---

## 🗺️ Dónde Está Aplicado el Overlay

### 1. Reportes Analytics (5 pestañas)
📍 `src/app/admin/dashboard/reportes/page.tsx`
```javascript
const analyticsEnabled = isFeatureEnabled('analytics');

// Si analytics está disabled, muestra overlay en:
- Pestaña Financiero
- Pestaña Productos  
- Pestaña Pedidos
- Pestaña Inventario
- Pestaña Rentabilidad
```

### 2. Módulo de Insumos (Empleados)
📍 `src/app/empleado/insumos/page.tsx`
```javascript
const insumosEnabled = isFeatureEnabled('insumos');

// Si insumos está disabled:
if (!insumosEnabled) {
  return <ComingSoonOverlay />;
}
```

---

## 🎨 Aspecto del ComingSoonOverlay

Cuando una feature está deshabilitada, el usuario ve:

```
┌────────────────────────────────────────┐
│     🚀                                 │
│   Próximamente                         │
│                                        │
│   Esta funcionalidad estará            │
│   disponible pronto                    │
│                                        │
│   📊 Analytics Avanzados               │
│   📈 Reportes en Tiempo Real           │
│   💹 KPIs Detallados                   │
│   📉 Gráficos Interactivos             │
│                                        │
│   Lanzamiento estimado: Marzo 2026     │
│                                        │
│   [Contenido detrás difuminado]        │
└────────────────────────────────────────┘
```

---

## 🛠️ Agregar Overlay a Nuevas Pantallas

### Ejemplo: Proteger pantalla de Recetas

```typescript
// src/app/admin/dashboard/recetas/page.tsx
import { isFeatureEnabled } from "@/lib/features";
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay";

export default function RecetasPage() {
  const recetasEnabled = isFeatureEnabled('recetas');
  
  if (!recetasEnabled) {
    return <ComingSoonOverlay featureName="recetas" />;
  }
  
  // Tu código normal aquí
  return <div>Pantalla de Recetas</div>;
}
```

---

## 📝 Checklist de Testing

### Testing Local
- [ ] `npm run dev` → Todas las features visibles
- [ ] `npm run build && npm start` → ComingSoonOverlay aparece
- [ ] Editar `.env.production` → Feature se habilita
- [ ] Animaciones del overlay funcionan
- [ ] Email notification (si configurado) funciona

### Testing en Vercel
- [ ] Deploy inicial → Overlays aparecen
- [ ] Habilitar 1 feature → Se desbloquea correctamente
- [ ] Deshabilitar feature → Overlay reaparece
- [ ] Variables de entorno se aplican sin redeploy manual

---

## 🚨 Troubleshooting

### "No veo el overlay en desarrollo"
✅ **Normal**: En desarrollo todas las features están habilitadas.
Use `npm run build && npm start` para simular producción.

### "Cambié .env.production pero no se refleja"
```bash
# Debes recompilar
npm run build
npm start
```

### "En Vercel cambié la variable pero no funciona"
Asegúrate que la variable:
- Tiene el prefijo `NEXT_PUBLIC_`
- Está en el ambiente "Production"
- Hiciste redeploy después de cambiarla

### "El overlay aparece pero no tiene blur"
Verifica que el componente tenga children:
```typescript
<ComingSoonOverlay featureName="analytics">
  {/* contenido aquí */}
</ComingSoonOverlay>
```

---

## 📚 Archivos Importantes

- `src/lib/features.ts` - Lógica de feature flags
- `src/components/ui/coming-soon-overlay.tsx` - Componente visual
- `.env.production` - Config local de producción
- `.env.production.example` - Template para Vercel
- `FEATURE_FLAGS.md` - Documentación completa

---

## 🎯 Próximos Pasos

1. ✅ Probar localmente con `npm run build && npm start`
2. 🚀 Hacer push a GitHub
3. ⚙️ Configurar variables en Vercel
4. 🌐 Verificar que overlays aparecen en producción
5. 🔓 Habilitar features cuando estén listas
