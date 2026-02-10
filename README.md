# 🍕 Trattoria - Sistema de Gestión Integral para Restaurantes

Sistema web completo para gestión de restaurantes que centraliza catálogo, pedidos, promociones, inventario por insumos, control de gastos y reportes operativos. Diseñado para operación diaria con roles diferenciados (Admin/Empleado), arquitectura de pedidos inmutables y control detallado de costos y márgenes.

## ✨ Características Principales

### 🔐 Autenticación y Seguridad
- Autenticación con Firebase (Google OAuth + Email/Password)
- Sistema de roles: ADMIN y EMPLEADO
- Session cookies seguros (HttpOnly, Secure, SameSite)
- Auto-aprovisionamiento de administradores mediante variables de entorno
- Middleware de protección de rutas por rol

### 📦 Gestión de Catálogo
- CRUD completo de Categorías y Productos
- Sistema de Promociones con descuentos (porcentaje/monto fijo)
- Configuración temporal de promociones (fechas, días de semana)
- Ordenamiento drag-and-drop
- Gestión de disponibilidad y stock
- Catálogo público responsive con búsqueda

### 🛒 Sistema de Pedidos
- Dos orígenes: INTERNO (empleados) y CATÁLOGO (clientes)
- Flujo completo: RECIBIDO → PENDIENTE → EN_PREPARACION → LISTO → FINALIZADO
- Carrito de compras con React Context
- Numeración automática de pedidos
- Gestión de clientes y datos de contacto
- Timestamps detallados para métricas

### 📊 Inventario y Recetas
- Gestión de Insumos con múltiples unidades de medida
- Movimientos de stock inmutables (IN/OUT/AJUSTE)
- Sistema de Recetas (Bill of Materials)
- Alertas de stock mínimo
- Trazabilidad completa de movimientos

### 💰 Control Financiero
- Módulo de Egresos categorizado
- Dashboard con métricas en tiempo real
- Reportes de ventas y crecimiento
- Visualización de actividad reciente

### 📝 Auditoría
- Logs inmutables de acciones críticas
- Captura de cambios (before/after)
- Tracking de IP y User Agent

## 🚀 Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **Runtime:** React 19
- **Lenguaje:** TypeScript
- **Base de Datos:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Autenticación:** Firebase Auth + Admin SDK
- **UI:** TailwindCSS + Shadcn/ui + Radix UI
- **Formularios:** React Hook Form + Zod
- **Iconos:** Lucide React
- **Notificaciones:** Sonner
- **Drag & Drop:** dnd-kit

## 📋 Pre-requisitos

- Node.js 20+
- PostgreSQL (o cuenta de Neon)
- Cuenta de Firebase (con proyecto creado)

## ⚙️ Configuración

### 1. Clonar el repositorio

```bash
git clone <tu-repo>
cd trattoria
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` y configura las siguientes variables:

#### Base de Datos
```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

#### Firebase Cliente (Frontend)
Obtén estos valores en Firebase Console → Project Settings → General:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="tu-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu-proyecto-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="tu-proyecto.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="tu-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="tu-app-id"
```

#### Firebase Admin (Backend)
Obtén estos valores en Firebase Console → Project Settings → Service Accounts → Generate new private key:
```env
FIREBASE_PROJECT_ID="tu-proyecto-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu clave privada\n-----END PRIVATE KEY-----\n"
```

#### Configuración Adicional
```env
SESSION_MAX_AGE_DAYS="5"
BOOTSTRAP_ENABLED="true"
BOOTSTRAP_ADMIN_EMAILS="tu-email@gmail.com"
```

### 4. Configurar Base de Datos

```bash
# Generar cliente de Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# (Opcional) Poblar base de datos con datos de ejemplo
npm run db:seed
```

### 5. Crear usuario administrador

Opción A - Auto-aprovisionamiento (recomendado):
- Asegúrate de tener `BOOTSTRAP_ENABLED="true"` y tu email en `BOOTSTRAP_ADMIN_EMAILS`
- Inicia sesión con Google usando ese email
- El sistema te creará automáticamente como ADMIN

Opción B - Script CLI:
```bash
npm run seed:admin
```

## 🏃 Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🏗️ Build para producción

```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
trattoria/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   ├── seed.ts                # Datos de ejemplo
│   └── migrations/            # Migraciones
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── admin/            # Rutas de administrador
│   │   ├── empleado/         # Rutas de empleado
│   │   ├── api/              # API Routes
│   │   └── actions/          # Server Actions
│   ├── components/           # Componentes React
│   │   ├── ui/              # Componentes base (Shadcn)
│   │   ├── dashboard/       # Componentes de dashboard
│   │   ├── empleado/        # Componentes de empleado
│   │   └── cart/            # Carrito de compras
│   ├── lib/                 # Utilidades
│   │   ├── auth.ts          # Utilidades de autenticación
│   │   ├── prisma.ts        # Cliente de Prisma
│   │   ├── firebase.ts      # Firebase cliente
│   │   ├── firebase-admin.ts # Firebase admin
│   │   └── hooks/           # React hooks personalizados
│   └── providers/           # React Context Providers
├── public/                  # Archivos estáticos
└── scripts/                # Scripts auxiliares
```

## 🔒 Seguridad

- **Nunca** subas el archivo `.env` al repositorio
- Las credenciales de Firebase Admin son sensibles
- Las session cookies tienen flags HttpOnly y Secure
- Todas las rutas admin están protegidas por middleware
- Los movimientos de stock y logs de auditoría son inmutables

## 📊 Scripts Disponibles

```bash
npm run dev          # Modo desarrollo
npm run build        # Build para producción
npm start            # Servidor de producción
npm run lint         # Ejecutar ESLint
npm run db:migrate   # Ejecutar migraciones de Prisma
npm run db:generate  # Generar cliente de Prisma
npm run db:seed      # Poblar BD con datos de ejemplo
npm run db:studio    # Abrir Prisma Studio
npm run seed:admin   # Crear usuario administrador
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y de uso exclusivo para Trattoria.

## 📧 Contacto

Para soporte o consultas, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ usando Next.js y TypeScript**

