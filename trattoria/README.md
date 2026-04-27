This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Manual operativo

El manual operativo por flujos para usar y probar la aplicacion esta en [manual-operativo/README.md](manual-operativo/README.md).
La guia anterior de analisis funcional ahora redirige a ese indice para evitar instrucciones duplicadas.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js# Trattoria App

## 🔐 Acceso de Administrador (Bootstrap)

Para garantizar el acceso de administrador en entornos nuevos (Producción/Dev) sin manipular directamente la base de datos, el sistema incluye dos mecanismos seguros.

### 1. Auto-aprovisionamiento (Recomendado)

Permite que ciertos emails se conviertan automáticamente en ADMIN al iniciar sesión por primera vez.

1. Configura las variables de entorno:
   ```env
   BOOTSTRAP_ENABLED="true"
   BOOTSTRAP_ADMIN_EMAILS="admin@trattoria.com,ceo@trattoria.com"
   ```
2. Inicia sesión con Google usando uno de esos emails.
3. El sistema detectará que no existes en BD, verificará la allowlist y creará tu usuario con rol `ADMIN`.

### 2. Script de Seed (CLI)

Si prefieres no habilitar el auto-provisionamiento en runtime, puedes usar el script de seed desde la terminal (requiere conexión a la BD).

1. Configura las variables en tu `.env`.
2. Ejecuta:
   ```bash
   npm run seed:admin
   ```
3. El script leerá `BOOTSTRAP_ADMIN_EMAILS` y creará/elevará esos usuarios en la BD.

---

## 🚀 Getting Started

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
