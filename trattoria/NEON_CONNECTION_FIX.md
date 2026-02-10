# Solución para error de conexión a Neon Database

## 🔍 Problema Identificado
```
Can't reach database server at ep-twilight-art-ac6rgmk2-pooler.sa-east-1.aws.neon.tech:5432
```

## ✅ Soluciones

### 1. Reactivar el proyecto Neon (Más probable)
Los proyectos Neon gratuitos se suspenden automáticamente después de 5 minutos de inactividad.

**Pasos:**
1. Ve a https://console.neon.tech
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto
4. En la vista principal, si ves un botón "Wake up" o "Resume", haz clic
5. Espera 10-15 segundos y vuelve a probar

### 2. Verificar la conexión en Neon Console

1. Ve a https://console.neon.tech
2. Selecciona tu proyecto
3. Ve a la sección "Connection Details"
4. Copia la nueva connection string si cambió
5. Actualiza tu archivo `.env` con la nueva URL

### 3. Test rápido desde terminal

Puedes probar la conexión con `psql`:
```bash
psql "postgresql://neondb_owner:npg_dy9sBL7Hrhpa@ep-twilight-art-ac6rgmk2-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 4. Alternativa: Usar la URL directa (sin pooler)

Si el pooler falla, intenta la conexión directa:
```
DATABASE_URL="postgresql://neondb_owner:npg_dy9sBL7Hrhpa@ep-twilight-art-ac6rgmk2.sa-east-1.aws.neon.tech/neondb?sslmode=require"
```
(Nota: Sin `-pooler` en el hostname)

## 🚀 Una vez reactivado

Ejecuta nuevamente:
```bash
npm run dev
```

El servidor debería iniciar sin errores de conexión.
