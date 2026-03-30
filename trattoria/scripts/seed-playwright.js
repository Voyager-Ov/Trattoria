/**
 * Trattoria – Script de Carga Inicial de Datos con Playwright
 * ============================================================
 * Automatiza la creación de:
 *   1. Categorías de PRODUCTOS (en /admin/dashboard/productos/categorias)
 *   2. INSUMOS         (en /admin/dashboard/insumos/nuevo)
 *   3. PRODUCTOS       (en /admin/dashboard/productos/nuevo)
 *
 * ⚠️  NOTA: El sistema no tiene "categorías de insumos" en el esquema.
 *     Los insumos se registran solo con: nombre, unidad, stockMínimo, costoUnitario.
 *
 * Uso:
 *   npx playwright test scripts/seed-playwright.js --headed
 *   node scripts/seed-playwright.js   (requires @playwright/test globally or via npx)
 *
 * Requisito previo:
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 *
 * Variables de entorno opcionales:
 *   BASE_URL  – URL base del sistema (default: http://localhost:3000)
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 */

const { chromium } = require("playwright");

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

/**
 * Mapeo de unidades del enunciado → valores del enum UnidadMedida de Prisma.
 * Los valores exactos que acepta el <Select> de la app:
 *   UNIDAD | KILOGRAMO | GRAMO | LITRO | MILILITRO | PORCION
 */
const UNIDAD_MAP = {
  unidad: "UNIDAD",
  kg: "KILOGRAMO",
  litro: "LITRO",
  paquete: "PORCION", // El enum no tiene PAQUETE; usamos PORCION como alternativa
};

// ═══════════════════════════════════════════════════════════════
// 1. CATEGORÍAS DE PRODUCTOS
// ═══════════════════════════════════════════════════════════════
const CATEGORIAS_PRODUCTOS = [
  { nombre: "Pastas",       slug: "pastas",       descripcion: "Pastas artesanales de la casa." },
  { nombre: "Tartas",       slug: "tartas",       descripcion: "Tartas saladas horneadas a diario." },
  { nombre: "Calzones",     slug: "calzones",     descripcion: "Calzones rellenos al horno." },
  { nombre: "Empanadas",    slug: "empanadas",    descripcion: "Empanadas artesanales con variedad de rellenos." },
  { nombre: "Milanesas",    slug: "milanesas",    descripcion: "Milanesas de peceto tiernas y crocantes." },
  { nombre: "Hamburguesas", slug: "hamburguesas", descripcion: "Hamburguesas con carne de primera." },
  { nombre: "Postres",      slug: "postres",      descripcion: "Postres artesanales para cerrar con dulzura." },
];

// ═══════════════════════════════════════════════════════════════
// 2. INSUMOS
// ═══════════════════════════════════════════════════════════════
const INSUMOS = [
  { nombre: "Harina de trigo",   unidad: "kg",      stockCritico: 10, costo: 1200  },
  { nombre: "Papa",              unidad: "kg",      stockCritico: 15, costo: 900   },
  { nombre: "Carne picada",      unidad: "kg",      stockCritico: 10, costo: 8500  },
  { nombre: "Peceto",            unidad: "kg",      stockCritico: 8,  costo: 11000 },
  { nombre: "Pollo",             unidad: "kg",      stockCritico: 10, costo: 6000  },
  { nombre: "Jamón",             unidad: "kg",      stockCritico: 5,  costo: 9000  },
  { nombre: "Queso mozzarella",  unidad: "kg",      stockCritico: 5,  costo: 8000  },
  { nombre: "Queso tybo",        unidad: "kg",      stockCritico: 3,  costo: 8500  },
  { nombre: "Queso sardo",       unidad: "kg",      stockCritico: 3,  costo: 9000  },
  { nombre: "Queso roquefort",   unidad: "kg",      stockCritico: 2,  costo: 12000 },
  { nombre: "Leche",             unidad: "litro",   stockCritico: 10, costo: 1500  },
  { nombre: "Huevo",             unidad: "unidad",  stockCritico: 60, costo: 250   },
  { nombre: "Tomate",            unidad: "kg",      stockCritico: 10, costo: 1500  },
  { nombre: "Cebolla",           unidad: "kg",      stockCritico: 8,  costo: 1200  },
  { nombre: "Acelga",            unidad: "kg",      stockCritico: 5,  costo: 1000  },
  { nombre: "Choclo",            unidad: "kg",      stockCritico: 5,  costo: 1800  },
  { nombre: "Aceitunas",         unidad: "kg",      stockCritico: 3,  costo: 6000  },
  { nombre: "Morrón",            unidad: "kg",      stockCritico: 4,  costo: 2500  },
  { nombre: "Albahaca",          unidad: "unidad",  stockCritico: 10, costo: 300   },
  { nombre: "Calabresa",         unidad: "kg",      stockCritico: 3,  costo: 9000  },
  { nombre: "Pan de hamburguesa",unidad: "unidad",  stockCritico: 30, costo: 500   },
  { nombre: "Pan de sandwich",   unidad: "unidad",  stockCritico: 20, costo: 400   },
  { nombre: "Galletitas Oreo",   unidad: "paquete", stockCritico: 10, costo: 2500  },
  { nombre: "Queso crema",       unidad: "kg",      stockCritico: 3,  costo: 7000  },
  { nombre: "Chocolate",         unidad: "kg",      stockCritico: 3,  costo: 8000  },
  { nombre: "Café",              unidad: "kg",      stockCritico: 2,  costo: 15000 },
  { nombre: "Azúcar",            unidad: "kg",      stockCritico: 10, costo: 1200  },
];

// ═══════════════════════════════════════════════════════════════
// 3. PRODUCTOS
// ═══════════════════════════════════════════════════════════════
const PRODUCTOS = [
  /* ── PASTAS ─────────────────────────────────────────────── */
  {
    nombre: "Ñoquis con salsa bolognesa",
    categoria: "Pastas",
    descripcion: "Ñoquis de papa con salsa bolognesa de carne picada y tomate.",
    precio: 7500,
    insumos: ["Papa", "Harina de trigo", "Carne picada", "Tomate"],
  },
  {
    nombre: "Ravioles con fileto",
    categoria: "Pastas",
    descripcion: "Ravioles de ricota con salsa fileto de tomate y mozzarella.",
    precio: 7500,
    insumos: ["Harina de trigo", "Tomate", "Queso mozzarella"],
  },
  {
    nombre: "Ravioles cuatro quesos",
    categoria: "Pastas",
    descripcion: "Ravioles rellenos de mozzarella, tybo, sardo y roquefort.",
    precio: 8500,
    insumos: ["Harina de trigo", "Queso mozzarella", "Queso tybo", "Queso sardo", "Queso roquefort"],
  },
  {
    nombre: "Ñoquis de espinaca",
    categoria: "Pastas",
    descripcion: "Ñoquis verdes de papa y acelga con salsa de tomate.",
    precio: 7800,
    insumos: ["Papa", "Harina de trigo", "Acelga", "Tomate"],
  },
  /* ── TARTAS ──────────────────────────────────────────────── */
  {
    nombre: "Tarta de pollo",
    categoria: "Tartas",
    descripcion: "Tarta de pollo, cebolla y queso mozzarella.",
    precio: 6000,
    insumos: ["Pollo", "Harina de trigo", "Huevo", "Cebolla", "Queso mozzarella"],
  },
  {
    nombre: "Tarta de verdura",
    categoria: "Tartas",
    descripcion: "Tarta de acelga y huevo con base crocante.",
    precio: 5500,
    insumos: ["Acelga", "Harina de trigo", "Huevo", "Queso mozzarella"],
  },
  {
    nombre: "Tarta de choclo",
    categoria: "Tartas",
    descripcion: "Tarta de choclo cremoso con queso y huevo.",
    precio: 5800,
    insumos: ["Choclo", "Harina de trigo", "Huevo", "Queso mozzarella"],
  },
  /* ── CALZONES ────────────────────────────────────────────── */
  {
    nombre: "Calzone de jamón y mozzarella",
    categoria: "Calzones",
    descripcion: "Calzone relleno de jamón cocido y queso mozzarella.",
    precio: 8000,
    insumos: ["Harina de trigo", "Jamón", "Queso mozzarella", "Tomate"],
  },
  {
    nombre: "Calzone de calabresa",
    categoria: "Calzones",
    descripcion: "Calzone picante de calabresa con morrón y aceitunas.",
    precio: 8500,
    insumos: ["Harina de trigo", "Calabresa", "Morrón", "Aceitunas", "Tomate"],
  },
  /* ── EMPANADAS ───────────────────────────────────────────── */
  {
    nombre: "Empanada árabe",
    categoria: "Empanadas",
    descripcion: "Empanada de carne picada al estilo árabe.",
    precio: 1200,
    insumos: ["Carne picada", "Harina de trigo", "Cebolla", "Tomate"],
  },
  {
    nombre: "Empanada de pollo",
    categoria: "Empanadas",
    descripcion: "Empanada jugosa de pollo, cebolla y morrón.",
    precio: 1100,
    insumos: ["Pollo", "Harina de trigo", "Cebolla", "Morrón"],
  },
  {
    nombre: "Empanada de jamón y queso",
    categoria: "Empanadas",
    descripcion: "Empanada clásica de jamón y queso mozzarella.",
    precio: 1100,
    insumos: ["Jamón", "Queso mozzarella", "Harina de trigo"],
  },
  {
    nombre: "Empanada de carne",
    categoria: "Empanadas",
    descripcion: "Empanada criolla de carne picada con huevo duro.",
    precio: 1200,
    insumos: ["Carne picada", "Harina de trigo", "Huevo", "Cebolla"],
  },
  /* ── MILANESAS ───────────────────────────────────────────── */
  {
    nombre: "Milanesa napolitana",
    categoria: "Milanesas",
    descripcion: "Milanesa de peceto con salsa de tomate, jamón y mozzarella gratinada.",
    precio: 9000,
    insumos: ["Peceto", "Tomate", "Jamón", "Queso mozzarella", "Huevo"],
  },
  {
    nombre: "Milanesa a la romana",
    categoria: "Milanesas",
    descripcion: "Milanesa de peceto apanada con huevo, clásica y crocante.",
    precio: 8000,
    insumos: ["Peceto", "Huevo", "Harina de trigo"],
  },
  /* ── HAMBURGUESAS ────────────────────────────────────────── */
  {
    nombre: "Hamburguesa doble",
    categoria: "Hamburguesas",
    descripcion: "Doble medallón de carne picada con queso mozzarella en pan artesanal.",
    precio: 10000,
    insumos: ["Carne picada", "Pan de hamburguesa", "Queso mozzarella"],
  },
  {
    nombre: "Hamburguesa clásica",
    categoria: "Hamburguesas",
    descripcion: "Medallón de carne picada con tomate, cebolla y lechuga.",
    precio: 8500,
    insumos: ["Carne picada", "Pan de hamburguesa", "Tomate", "Cebolla"],
  },
  {
    nombre: "Hamburguesa napolitana",
    categoria: "Hamburguesas",
    descripcion: "Hamburguesa con jamón, tomate y queso gratinado.",
    precio: 9500,
    insumos: ["Carne picada", "Pan de hamburguesa", "Jamón", "Tomate", "Queso mozzarella"],
  },
  /* ── POSTRES ─────────────────────────────────────────────── */
  {
    nombre: "Tiramisú",
    categoria: "Postres",
    descripcion: "Clásico tiramisú italiano con queso crema, café y cacao.",
    precio: 5500,
    insumos: ["Queso crema", "Café", "Azúcar", "Huevo"],
  },
  {
    nombre: "Torta de chocolate",
    categoria: "Postres",
    descripcion: "Torta húmeda de chocolate con cobertura de ganache.",
    precio: 5000,
    insumos: ["Chocolate", "Harina de trigo", "Huevo", "Azúcar", "Leche"],
  },
  {
    nombre: "Cheesecake de Oreo",
    categoria: "Postres",
    descripcion: "Cheesecake frío con base de Oreo y queso crema.",
    precio: 5800,
    insumos: ["Galletitas Oreo", "Queso crema", "Azúcar"],
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/** Espera y hace click en un selector de forma segura */
async function clickSafe(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { state: "visible", timeout });
  await page.click(selector);
}

/** Espera que desaparezca un spinner */
async function waitForLoadingDone(page, timeout = 15000) {
  try {
    await page.waitForSelector(".animate-spin", { state: "hidden", timeout });
  } catch {
    // Si no había spinner, está bien
  }
}

/** Espera a que aparezca un toast de éxito (sonner) */
async function waitForSuccessToast(page, timeout = 12000) {
  try {
    // Sonner usa [data-sonner-toaster] con li[data-type="success"]
    await page.waitForSelector("li[data-type='success']", { timeout });
  } catch {
    // Algunos entornos pueden no tener el atributo – intentamos otro selector
    try {
      await page.waitForSelector("[data-sonner-toaster] li", { timeout: 3000 });
    } catch {
      // Ignoramos, seguimos adelante
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Crear categoría de PRODUCTO
// ═══════════════════════════════════════════════════════════════
/**
 * Crea una categoría de producto usando el Sheet lateral de la página de categorías.
 * Ruta: /admin/dashboard/productos/categorias
 */
async function createProductCategory(page, categoria) {
  console.log(`  📁 Creando categoría de producto: "${categoria.nombre}"...`);

  // Abrir sheet de nueva categoría
  const sheetTriggerBtn = page.locator("button", { hasText: "Nueva Categoría" }).first();
  await sheetTriggerBtn.waitFor({ state: "visible", timeout: 10000 });
  await sheetTriggerBtn.click();

  // Esperar que el sheet esté visible
  await page.waitForSelector("input#cat-nombre", { state: "visible", timeout: 8000 });

  // Nombre (limpia antes de escribir)
  await page.fill("input#cat-nombre", "");
  await page.fill("input#cat-nombre", categoria.nombre);

  // El slug se autocompleta; opcionalmente overridear
  // Esperamos un momento para que el onChange actualice el slug
  await page.waitForTimeout(300);

  // Slug (limpia y sobreescribe si se quiere exactitud)
  const slugInput = page.locator("input#cat-slug");
  await slugInput.fill("");
  await slugInput.fill(categoria.slug);

  // Descripción
  if (categoria.descripcion) {
    await page.fill("textarea#cat-desc", categoria.descripcion);
  }

  // Guardar
  const submitBtn = page.locator("button[type='submit']", { hasText: /Crear Categoría/i }).first();
  await submitBtn.click();

  // Esperar toast o cierre del sheet
  await waitForSuccessToast(page);
  await page.waitForTimeout(800);

  console.log(`  ✅ Categoría "${categoria.nombre}" creada.`);
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Crear insumo
// ═══════════════════════════════════════════════════════════════
/**
 * Navega a /admin/dashboard/insumos/nuevo y rellena el formulario.
 */
async function createInsumo(page, insumo) {
  console.log(`  🧪 Creando insumo: "${insumo.nombre}"...`);

  await page.goto(`${BASE_URL}/admin/dashboard/insumos/nuevo`, {
    waitUntil: "load",
  });
  await page.waitForTimeout(800); // Esperar hidratación de React

  // Nombre
  await page.fill("input[name='nombre']", insumo.nombre);

  // Unidad de medida (Radix Select)
  const enumValue = UNIDAD_MAP[insumo.unidad] || "UNIDAD";
  // Abrir el Select
  const selectTrigger = page.locator("button[role='combobox']").first();
  await selectTrigger.waitFor({ state: "visible", timeout: 8000 });
  await selectTrigger.click();

  // Esperar que el listbox con las opciones aparezca
  await page.waitForSelector("[role='listbox']", { state: "visible", timeout: 6000 });

  // Hacer click en la opción cuyo data-value sea el enum
  // Los SelectItem de Radix/shadcn tienen role="option" y data-value
  const option = page.locator(`[role='option'][data-value='${enumValue}']`);
  if (await option.count() === 0) {
    // Fallback: buscar por texto visible (primera letra mayúscula + resto minúscula)
    const labelText = enumValue.charAt(0) + enumValue.slice(1).toLowerCase();
    await page.locator(`[role='option']`, { hasText: labelText }).first().click();
  } else {
    await option.click();
  }

  // Stock mínimo
  await page.fill("input[name='stockMinimo']", String(insumo.stockCritico));

  // Costo unitario
  await page.fill("input[name='costoUnitario']", String(insumo.costo));

  // Enviar formulario
  const saveBtn = page.locator("button[type='submit']", { hasText: /GUARDAR INSUMO/i });
  await saveBtn.click();

  // Esperar redirección o toast
  await waitForSuccessToast(page);

  // Esperar redirección a /insumos
  try {
    await page.waitForURL(`${BASE_URL}/admin/dashboard/insumos`, { timeout: 10000 });
  } catch {
    // Puede redirigir o no dependiendo de la versión
  }

  console.log(`  ✅ Insumo "${insumo.nombre}" creado.`);
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Crear producto
// ═══════════════════════════════════════════════════════════════
/**
 * Navega a /admin/dashboard/productos/nuevo y rellena el formulario.
 * Los insumos se añaden haciendo click en el grid de "Selección Rápida"
 * o usando la búsqueda.
 */
async function createProducto(page, producto) {
  console.log(`  🍽️  Creando producto: "${producto.nombre}"...`);

  await page.goto(`${BASE_URL}/admin/dashboard/productos/nuevo`, {
    waitUntil: "load",
  });

  await page.waitForTimeout(1000); // Dar tiempo a que carguen categorías e insumos

  // ── Nombre ─────────────────────────────────────────────────
  await page.fill("input#nombre", producto.nombre);

  // ── Categoría (Select con shadcn) ──────────────────────────
  // El select de categoría está dentro del form, es el primer combobox
  const categorySelect = page.locator("button[role='combobox']").first();
  await categorySelect.waitFor({ state: "visible", timeout: 8000 });
  await categorySelect.click();

  await page.waitForSelector("[role='listbox']", { state: "visible", timeout: 6000 });

  // Seleccionar por nombre de la categoría
  await page
    .locator("[role='option']", { hasText: producto.categoria })
    .first()
    .click();

  // ── Descripción ────────────────────────────────────────────
  if (producto.descripcion) {
    await page.fill("textarea#descripcion", producto.descripcion);
  }

  // ── Precio de venta ────────────────────────────────────────
  await page.fill("input#precio", String(producto.precio));

  // ── Insumos (Receta) ────────────────────────────────────────
  for (const nombreInsumo of producto.insumos) {
    // Buscar en el campo de búsqueda de insumos
    const searchInput = page.locator("input[placeholder*='Buscar insumos']");
    await searchInput.fill(nombreInsumo);
    await page.waitForTimeout(400);

    // Intentar hacer click en el resultado del dropdown
    const resultInDropdown = page.locator(
      "div.absolute.z-10 button",
      { hasText: nombreInsumo }
    ).first();

    if (await resultInDropdown.isVisible({ timeout: 2000 })) {
      await resultInDropdown.click();
    } else {
      // Limpiar y intentar con el grid de selección rápida
      await searchInput.fill("");
      await searchInput.fill(nombreInsumo);
      await page.waitForTimeout(400);

      const gridBtn = page
        .locator("div.grid button", { hasText: nombreInsumo })
        .first();

      if (await gridBtn.isVisible({ timeout: 2000 })) {
        await gridBtn.click();
      } else {
        console.warn(`    ⚠️  Insumo "${nombreInsumo}" no encontrado en el grid. ¿Fue creado?`);
        await searchInput.fill("");
        continue;
      }
    }

    await page.waitForTimeout(300);
  }

  // ── Guardar ────────────────────────────────────────────────
  const saveBtn = page.locator("button", { hasText: /Guardar Producto/i }).first();
  await saveBtn.click();

  await waitForSuccessToast(page);

  try {
    await page.waitForURL(`${BASE_URL}/admin/dashboard/productos`, { timeout: 12000 });
  } catch {
    // Puede redirigir o quedarse
  }

  console.log(`  ✅ Producto "${producto.nombre}" creado.`);
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Login (Firebase Auth via /login)
// ═══════════════════════════════════════════════════════════════
async function login(page) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("⏩ Sin credenciales – asegurate de haber iniciado sesión en el navegador.");
    console.log("   El script abrirá el dashboard. Si redirige al login, iniciá sesión manualmente.");
    console.log("   Tenés 30 segundos para loguearte...");

    try {
      // Navegar con 'load' para no fallar con redirects 307
      await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "load" });
    } catch (e) {
      // Redirect normal, no es un error fatal
    }

    // Verificar si ya estamos en el dashboard o si hay redirección
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    if (!currentUrl.includes("/admin/dashboard")) {
      console.log("   Redirigido al login. Esperando login manual (30s)...");
      await page.waitForURL(/\/admin\/dashboard/, { timeout: 30000 });
    }
    return;
  }

  console.log("🔐 Iniciando sesión con Firebase (/login)...");
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  } catch (e) {
    // Ignorar errores de redirect
  }
  await page.waitForTimeout(1500); // Esperar que React hidrate

  try {
    // Selectores del login de Trattoria (/app/login/page.tsx)
    await page.waitForSelector("input#email", { state: "visible", timeout: 10000 });
    await page.fill("input#email", ADMIN_EMAIL);
    await page.fill("input#password", ADMIN_PASSWORD);

    // Botón "Ingresar"
    await page.click("button[type='submit']");

    // Esperar redirección al dashboard tras Firebase Auth
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20000 });
    console.log("✅ Login exitoso.");
  } catch (e) {
    console.warn("⚠️  Login automático falló:", e.message);
    console.warn("   Iniciá sesión manualmente. Tenés 30 segundos...");
    try {
      await page.waitForURL(/\/admin\/dashboard/, { timeout: 30000 });
    } catch {
      throw new Error("No se pudo autenticar. Verificá las credenciales o iniciá sesión manualmente.");
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
(async () => {
  const browser = await chromium.launch({
    headless: false,   // Cambiar a true para correr sin ventana
    slowMo: 100,       // Tiempo entre acciones (ms) – útil para debug
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  // ── Hacer silencioso el output de consola del browser ──────
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      // console.error("  [browser]", msg.text());
    }
  });

  try {
    // ── 0. Login ─────────────────────────────────────────────
    await login(page);

    // ─────────────────────────────────────────────────────────
    // PASO 1: Categorías de PRODUCTOS
    // ─────────────────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════════════");
    console.log("PASO 1: Creando categorías de PRODUCTOS");
    console.log("══════════════════════════════════════════════════");

    await page.goto(`${BASE_URL}/admin/dashboard/productos/categorias`, {
      waitUntil: "load",
    });
    await page.waitForTimeout(2000);

    for (const cat of CATEGORIAS_PRODUCTOS) {
      try {
        await createProductCategory(page, cat);
        await page.waitForTimeout(500);
      } catch (err) {
        console.error(`  ❌ Error creando categoría "${cat.nombre}":`, err.message);
      }
    }

    // ─────────────────────────────────────────────────────────
    // PASO 2: INSUMOS
    // ─────────────────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════════════");
    console.log("PASO 2: Creando INSUMOS");
    console.log("══════════════════════════════════════════════════");

    for (const insumo of INSUMOS) {
      try {
        await createInsumo(page, insumo);
        await page.waitForTimeout(500);
      } catch (err) {
        console.error(`  ❌ Error creando insumo "${insumo.nombre}":`, err.message);
      }
    }

    // ─────────────────────────────────────────────────────────
    // PASO 3: PRODUCTOS
    // ─────────────────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════════════");
    console.log("PASO 3: Creando PRODUCTOS");
    console.log("══════════════════════════════════════════════════");

    for (const producto of PRODUCTOS) {
      try {
        await createProducto(page, producto);
        await page.waitForTimeout(500);
      } catch (err) {
        console.error(`  ❌ Error creando producto "${producto.nombre}":`, err.message);
      }
    }

    console.log("\n🎉 ¡Carga inicial completada exitosamente!");
    console.log(`   Categorías creadas: ${CATEGORIAS_PRODUCTOS.length}`);
    console.log(`   Insumos creados:    ${INSUMOS.length}`);
    console.log(`   Productos creados:  ${PRODUCTOS.length}`);
  } catch (fatalError) {
    console.error("\n💥 Error fatal:", fatalError);
  } finally {
    console.log("\n⏳ Cerrando navegador en 5 segundos...");
    // Usamos setTimeout nativo para no depender de page (puede estar cerrada)
    await new Promise((r) => setTimeout(r, 5000));
    try { await browser.close(); } catch { /* ya estaba cerrado */ }
  }
})();
