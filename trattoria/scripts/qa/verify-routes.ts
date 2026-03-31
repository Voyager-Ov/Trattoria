import fs from 'node:fs';
import path from 'node:path';

const appRoot = path.join(process.cwd(), 'src', 'app');

const routesToCheck = [
  // Admin sidebar
  '/admin/dashboard',
  '/admin/dashboard/pedidos',
  '/admin/dashboard/productos',
  '/admin/dashboard/insumos',
  '/admin/dashboard/usuarios',
  '/admin/dashboard/reportes',
  '/admin/dashboard/reportes/ingresos',
  '/admin/dashboard/reportes/egresos',
  '/admin/dashboard/perfil',
  '/admin/dashboard/configuracion',

  // Employee sidebar
  '/empleado',
  '/empleado/pedidos',
  '/empleado/insumos',
  '/empleado/productos',
  '/empleado/perfil',

  // Product/category actions
  '/admin/dashboard/productos/categorias',
  '/admin/dashboard/productos/promociones/nueva',
  '/admin/dashboard/productos/nuevo',
];

function routeToPageFile(route: string): string {
  const cleaned = route.replace(/^\//, '');
  return path.join(appRoot, cleaned, 'page.tsx');
}

const missing: string[] = [];

for (const route of routesToCheck) {
  const pageFile = routeToPageFile(route);
  if (!fs.existsSync(pageFile)) {
    missing.push(`${route} -> ${path.relative(process.cwd(), pageFile)}`);
  }
}

if (missing.length > 0) {
  console.error('❌ Missing route pages found:');
  for (const item of missing) console.error(` - ${item}`);
  process.exit(1);
}

console.log(`✅ Route QA passed (${routesToCheck.length} routes checked).`);
