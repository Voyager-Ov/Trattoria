/**
 * Script de Carga Inicial Exclusivo para Pizzas con Playwright
 * ============================================================
 * Automatiza la creación de:
 *   1. Categoría de Productos (Pizzas)
 *   2. INSUMOS (sólo los nuevos ingredientes)
 *   3. PRODUCTOS (todas las variantes de la nueva carta de Pizzas)
 *
 * Uso:
 *   node scripts/seed-pizzas.js
 */

const { chromium } = require("playwright");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "octavio.velo2022@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "seguridad";

const UNIDAD_MAP = {
  unidad: "UNIDAD",
  kg: "KILOGRAMO",
  litro: "LITRO",
  paquete: "PORCION",
};

// Solo la nueva categoría
const CATEGORIAS_PRODUCTOS = [
  { nombre: "Pizzas", slug: "pizzas", descripcion: "Pizzas al molde listas para deleitar." }
];

// Solo los nuevos insumos que faltaban
const INSUMOS = [
  { nombre: "Orégano",           unidad: "kg",      stockCritico: 1,  costo: 8000  },
  { nombre: "Cebolla de verdeo", unidad: "kg",      stockCritico: 2,  costo: 3000  },
  { nombre: "Queso parmesano",   unidad: "kg",      stockCritico: 2,  costo: 18000 },
  { nombre: "Ajo",               unidad: "kg",      stockCritico: 2,  costo: 5000  },
  { nombre: "Perejil",           unidad: "kg",      stockCritico: 1,  costo: 2000  },
  { nombre: "Salchicha",         unidad: "kg",      stockCritico: 5,  costo: 6000  },
  { nombre: "Mostaza",           unidad: "kg",      stockCritico: 3,  costo: 4000  },
  { nombre: "Champiñones",       unidad: "kg",      stockCritico: 3,  costo: 9000  },
  { nombre: "Palmitos",          unidad: "unidad",  stockCritico: 10, costo: 3500  },
  { nombre: "Salsa golf",        unidad: "kg",      stockCritico: 2,  costo: 4500  },
  { nombre: "Salame",            unidad: "kg",      stockCritico: 4,  costo: 12000 },
  { nombre: "Anchoas",           unidad: "kg",      stockCritico: 2,  costo: 25000 },
  { nombre: "Rúcula",            unidad: "kg",      stockCritico: 2,  costo: 3000  },
  { nombre: "Jamón crudo",       unidad: "kg",      stockCritico: 3,  costo: 22000 },
  { nombre: "Ananá",             unidad: "unidad",  stockCritico: 5,  costo: 3000  },
];

// Solo las nuevas pizzas
const PRODUCTOS = [
  {
    nombre: "Pizza Mozzarella",
    categoria: "Pizzas",
    descripcion: "Salsa de tomate, mozzarella, aceituna, oregano. (Entera)",
    precio: 7000,
    insumos: ["Tomate", "Queso mozzarella", "Aceitunas", "Orégano"],
  },
  {
    nombre: "1/2 Pizza Mozzarella",
    categoria: "Pizzas",
    descripcion: "Salsa de tomate, mozzarella, aceituna, oregano. (Media)",
    precio: 4000,
    insumos: ["Tomate", "Queso mozzarella", "Aceitunas", "Orégano"],
  },
  {
    nombre: "Pizza Fugazzeta",
    categoria: "Pizzas",
    descripcion: "Cebolla salteada, mozza, aceituna, oregano. (Entera)",
    precio: 7000,
    insumos: ["Cebolla", "Queso mozzarella", "Aceitunas", "Orégano"],
  },
  {
    nombre: "1/2 Pizza Fugazzeta",
    categoria: "Pizzas",
    descripcion: "Cebolla salteada, mozza, aceituna, oregano. (Media)",
    precio: 4000,
    insumos: ["Cebolla", "Queso mozzarella", "Aceitunas", "Orégano"],
  },
  {
    nombre: "Pizza Fuga al Verdeo",
    categoria: "Pizzas",
    descripcion: "Cebolla salteada, mozza, verdeo y parmesano. (Entera)",
    precio: 7000,
    insumos: ["Cebolla", "Queso mozzarella", "Cebolla de verdeo", "Queso parmesano"],
  },
  {
    nombre: "1/2 Pizza Fuga al Verdeo",
    categoria: "Pizzas",
    descripcion: "Cebolla salteada, mozza, verdeo y parmesano. (Media)",
    precio: 4000,
    insumos: ["Cebolla", "Queso mozzarella", "Cebolla de verdeo", "Queso parmesano"],
  },
  {
    nombre: "Pizza Mozza con Huevo",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, huevo, aceituna, oregano. (Entera)",
    precio: 7000,
    insumos: ["Tomate", "Queso mozzarella", "Huevo", "Aceitunas", "Orégano"],
  },
  {
    nombre: "1/2 Pizza Mozza con Huevo",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, huevo, aceituna, oregano. (Media)",
    precio: 4000,
    insumos: ["Tomate", "Queso mozzarella", "Huevo", "Aceitunas", "Orégano"],
  },
  {
    nombre: "Pizza Provenzal",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, ajo, perejil, aceituna. (Entera)",
    precio: 7000,
    insumos: ["Tomate", "Queso mozzarella", "Ajo", "Perejil", "Aceitunas"],
  },
  {
    nombre: "1/2 Pizza Provenzal",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, ajo, perejil, aceituna. (Media)",
    precio: 4000,
    insumos: ["Tomate", "Queso mozzarella", "Ajo", "Perejil", "Aceitunas"],
  },
  {
    nombre: "Pizza Margarita",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, sardo, aceituna, albahaca, oregano. (Entera)",
    precio: 7000,
    insumos: ["Tomate", "Queso mozzarella", "Queso sardo", "Aceitunas", "Albahaca", "Orégano"],
  },
  {
    nombre: "1/2 Pizza Margarita",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, sardo, aceituna, albahaca, oregano. (Media)",
    precio: 4000,
    insumos: ["Tomate", "Queso mozzarella", "Queso sardo", "Aceitunas", "Albahaca", "Orégano"],
  },
  {
    nombre: "Pizza Especial",
    categoria: "Pizzas",
    descripcion: "Salsa, jamon, mozza, aceituna, morrones, oregano. (Entera)",
    precio: 8000,
    insumos: ["Tomate", "Jamón", "Queso mozzarella", "Aceitunas", "Morrón", "Orégano"],
  },
  {
    nombre: "1/2 Pizza Especial",
    categoria: "Pizzas",
    descripcion: "Salsa, jamon, mozza, aceituna, morrones, oregano. (Media)",
    precio: 4500,
    insumos: ["Tomate", "Jamón", "Queso mozzarella", "Aceitunas", "Morrón", "Orégano"],
  },
  {
    nombre: "Pizza Napolitana",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, tomate, ajo y oregano. (Entera)",
    precio: 8000,
    insumos: ["Tomate", "Queso mozzarella", "Ajo", "Orégano"],
  },
  {
    nombre: "1/2 Pizza Napolitana",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, tomate, ajo y oregano. (Media)",
    precio: 4500,
    insumos: ["Tomate", "Queso mozzarella", "Ajo", "Orégano"],
  },
  {
    nombre: "Pizza Fuga con Jamón",
    categoria: "Pizzas",
    descripcion: "Cebolla salteada, mozza, jamon y morrón. (Entera)",
    precio: 8000,
    insumos: ["Cebolla", "Queso mozzarella", "Jamón", "Morrón"],
  },
  {
    nombre: "1/2 Pizza Fuga con Jamón",
    categoria: "Pizzas",
    descripcion: "Cebolla salteada, mozza, jamon y morrón. (Media)",
    precio: 4500,
    insumos: ["Cebolla", "Queso mozzarella", "Jamón", "Morrón"],
  },
  {
    nombre: "Pizza Choclo",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, choclo, aceituna, morrones. (Entera)",
    precio: 8000,
    insumos: ["Tomate", "Queso mozzarella", "Choclo", "Aceitunas", "Morrón"],
  },
  {
    nombre: "1/2 Pizza Choclo",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, choclo, aceituna, morrones. (Media)",
    precio: 4500,
    insumos: ["Tomate", "Queso mozzarella", "Choclo", "Aceitunas", "Morrón"],
  },
  {
    nombre: "Pizza Vienesa",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, salchicha, mostaza, aceituna, oregano. (Entera)",
    precio: 8000,
    insumos: ["Tomate", "Queso mozzarella", "Salchicha", "Mostaza", "Aceitunas", "Orégano"],
  },
  {
    nombre: "1/2 Pizza Vienesa",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, salchicha, mostaza, aceituna, oregano. (Media)",
    precio: 4500,
    insumos: ["Tomate", "Queso mozzarella", "Salchicha", "Mostaza", "Aceitunas", "Orégano"],
  },
  {
    nombre: "Pizza Del Campo",
    categoria: "Pizzas",
    descripcion: "Salsa, hierbas, mozza, champignone, aceituna. (Entera)",
    precio: 8000,
    insumos: ["Tomate", "Queso mozzarella", "Champiñones", "Aceitunas"],
  },
  {
    nombre: "1/2 Pizza Del Campo",
    categoria: "Pizzas",
    descripcion: "Salsa, hierbas, mozza, champignone, aceituna. (Media)",
    precio: 4500,
    insumos: ["Tomate", "Queso mozzarella", "Champiñones", "Aceitunas"],
  },
  {
    nombre: "Pizza Auvernia",
    categoria: "Pizzas",
    descripcion: "Cebolla, mozza, roquefort, aceituna. (Entera)",
    precio: 9000,
    insumos: ["Cebolla", "Queso mozzarella", "Queso roquefort", "Aceitunas"],
  },
  {
    nombre: "1/2 Pizza Auvernia",
    categoria: "Pizzas",
    descripcion: "Cebolla, mozza, roquefort, aceituna. (Media)",
    precio: 5000,
    insumos: ["Cebolla", "Queso mozzarella", "Queso roquefort", "Aceitunas"],
  },
  {
    nombre: "Pizza Palmito",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, palmito, salsa golf, aceituna. (Entera)",
    precio: 9000,
    insumos: ["Tomate", "Queso mozzarella", "Palmitos", "Salsa golf", "Aceitunas"],
  },
  {
    nombre: "1/2 Pizza Palmito",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, palmito, salsa golf, aceituna. (Media)",
    precio: 5000,
    insumos: ["Tomate", "Queso mozzarella", "Palmitos", "Salsa golf", "Aceitunas"],
  },
  {
    nombre: "Pizza 4 Quesos",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, sardo, roquefort, tybo, aceituna. (Entera)",
    precio: 9000,
    insumos: ["Tomate", "Queso mozzarella", "Queso sardo", "Queso roquefort", "Queso tybo", "Aceitunas"],
  },
  {
    nombre: "1/2 Pizza 4 Quesos",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, sardo, roquefort, tybo, aceituna. (Media)",
    precio: 5000,
    insumos: ["Tomate", "Queso mozzarella", "Queso sardo", "Queso roquefort", "Queso tybo", "Aceitunas"],
  },
  {
    nombre: "Pizza Capresse",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, tomate, albahaca, aceituna. (Entera)",
    precio: 9000,
    insumos: ["Tomate", "Queso mozzarella", "Albahaca", "Aceitunas"],
  },
  {
    nombre: "1/2 Pizza Capresse",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, tomate, albahaca, aceituna. (Media)",
    precio: 5000,
    insumos: ["Tomate", "Queso mozzarella", "Albahaca", "Aceitunas"],
  },
  {
    nombre: "Pizza Calabresa",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, salame, aceituna y oregano. (Entera)",
    precio: 9000,
    insumos: ["Tomate", "Queso mozzarella", "Salame", "Aceitunas", "Orégano"],
  },
  {
    nombre: "1/2 Pizza Calabresa",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, salame, aceituna y oregano. (Media)",
    precio: 5000,
    insumos: ["Tomate", "Queso mozzarella", "Salame", "Aceitunas", "Orégano"],
  },
  {
    nombre: "Pizza Anchoa",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, jamon, anchoa, aceituna, morrón, oregano. (Entera)",
    precio: 9000,
    insumos: ["Tomate", "Queso mozzarella", "Jamón", "Anchoas", "Aceitunas", "Morrón", "Orégano"],
  },
  {
    nombre: "1/2 Pizza Anchoa",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, jamon, anchoa, aceituna, morrón, oregano. (Media)",
    precio: 5000,
    insumos: ["Tomate", "Queso mozzarella", "Jamón", "Anchoas", "Aceitunas", "Morrón", "Orégano"],
  },
  {
    nombre: "Pizza Rúcula",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, rucula, jamon crudo, aceituna. (Entera)",
    precio: 9000,
    insumos: ["Tomate", "Queso mozzarella", "Rúcula", "Jamón crudo", "Aceitunas"],
  },
  {
    nombre: "1/2 Pizza Rúcula",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, rucula, jamon crudo, aceituna. (Media)",
    precio: 5000,
    insumos: ["Tomate", "Queso mozzarella", "Rúcula", "Jamón crudo", "Aceitunas"],
  },
  {
    nombre: "Pizza Trattoria",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, cebolla y pimiento salteados picantes. (Entera)",
    precio: 9000,
    insumos: ["Tomate", "Queso mozzarella", "Cebolla", "Morrón"],
  },
  {
    nombre: "1/2 Pizza Trattoria",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, cebolla y pimiento salteados picantes. (Media)",
    precio: 5000,
    insumos: ["Tomate", "Queso mozzarella", "Cebolla", "Morrón"],
  },
  {
    nombre: "Pizza Tropical",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, jamon, anana, azúcar morena, aceituna. (Entera)",
    precio: 9000,
    insumos: ["Tomate", "Queso mozzarella", "Jamón", "Ananá", "Azúcar", "Aceitunas"],
  },
  {
    nombre: "1/2 Pizza Tropical",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, jamon, anana, azúcar morena, aceituna. (Media)",
    precio: 5000,
    insumos: ["Tomate", "Queso mozzarella", "Jamón", "Ananá", "Azúcar", "Aceitunas"],
  },
  {
    nombre: "Pizza Atomica",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, papas frita, salsa golf, huevo frito. (Entera)",
    precio: 12000,
    insumos: ["Tomate", "Queso mozzarella", "Papa", "Salsa golf", "Huevo"],
  },
  {
    nombre: "1/2 Pizza Atomica",
    categoria: "Pizzas",
    descripcion: "Salsa, mozza, papas frita, salsa golf, huevo frito. (Media)",
    precio: 7000,
    insumos: ["Tomate", "Queso mozzarella", "Papa", "Salsa golf", "Huevo"],
  }
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

async function clickSafe(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { state: "visible", timeout });
  await page.click(selector);
}

async function waitForLoadingDone(page, timeout = 15000) {
  try {
    await page.waitForSelector(".animate-spin", { state: "hidden", timeout });
  } catch {}
}

async function waitForSuccessToast(page, timeout = 12000) {
  try {
    const selector = "[data-sonner-toaster] li[data-type=\"success\"]";
    await page.waitForSelector(selector, { state: "attached", timeout });
    await page.waitForTimeout(1000);
  } catch (e) {
    console.warn("  ℹ️ No se detectó toast de éxito, asumiendo que el request procedió...");
  }
}

// ═══════════════════════════════════════════════════════════════
// ACCIONES
// ═══════════════════════════════════════════════════════════════

async function crearInsumo(page, insumo) {
  console.log(`  ➤ Insumo: ${insumo.nombre}...`);
  await page.goto(`${BASE_URL}/admin/dashboard/insumos/nuevo`, { waitUntil: "load" });
  await waitForLoadingDone(page);

  await page.fill('input[name="nombre"]', insumo.nombre);
  
  await page.click('button[role="combobox"]');
  await page.waitForSelector('[role="listbox"]');
  const unidadVal = UNIDAD_MAP[insumo.unidad.toLowerCase()] || "UNIDAD";
  await clickSafe(page, `[role="option"]:has-text("${unidadVal}")`);

  await page.fill('input[name="stockMinimo"]', String(insumo.stockCritico || 0));
  await page.fill('input[name="costoUnitario"]', String(insumo.costo || 0));

  await clickSafe(page, 'button[type="submit"]:has-text("Guardar")');
  await waitForSuccessToast(page);
  console.log(`  ✅ Insumo "${insumo.nombre}" cargado.`);
}

async function crearCategoriaProducto(page, cat) {
  console.log(`  ➤ Categoría: ${cat.nombre}...`);
  await page.goto(`${BASE_URL}/admin/dashboard/productos/categorias`, { waitUntil: "load" });
  await waitForLoadingDone(page);

  // El botón abre un Sheet (panel lateral), no un modal/dialog
  await clickSafe(page, 'button:has-text("Nueva Categoría")');

  // Esperar que el Sheet esté abierto: el input tiene id="cat-nombre"
  await page.waitForSelector('input#cat-nombre', { state: "visible", timeout: 10000 });

  await page.fill('input#cat-nombre', cat.nombre);
  // Esperar que el slug se auto-complete
  await page.waitForTimeout(500);

  if (cat.descripcion) {
    await page.fill('textarea#cat-desc', cat.descripcion);
  }

  // El botón de submit dice "Crear Categoría" (no "Guardar")
  await clickSafe(page, 'button[type="submit"]:has-text("Crear Categoría")');
  await waitForSuccessToast(page);
  await page.waitForTimeout(1500);
  console.log(`  ✅ Categoría "${cat.nombre}" creada.`);
}

async function crearProducto(page, producto) {
  console.log(`  ➤ Producto: ${producto.nombre}...`);
  await page.goto(`${BASE_URL}/admin/dashboard/productos/nuevo`, { waitUntil: "load" });
  await waitForLoadingDone(page);

  await page.fill("input#nombre", producto.nombre);
  if (producto.descripcion) await page.fill("textarea#descripcion", producto.descripcion);
  await page.fill("input#precio", String(producto.precio));

  await clickSafe(page, '#categoriaId ~ button[role="combobox"]');
  await page.waitForSelector('[role="listbox"]');
  await clickSafe(page, `[role="option"]:has-text("${producto.categoria}")`);

  if (producto.insumos && producto.insumos.length > 0) {
    for (const nomInsumo of producto.insumos) {
      await clickSafe(page, 'button:has-text("Agregar Composición")');
      const dialog = page.locator('div[role="dialog"]').last();
      await dialog.waitFor({ state: "visible" });

      await clickSafe(dialog, 'button[role="combobox"]');
      await page.waitForSelector('[role="option"]');
      
      const option = page.locator(`[role="option"]:text-is("${nomInsumo}")`).first();
      const count = await option.count();
      if (count > 0) {
        await option.click();
        await page.waitForTimeout(500);
      } else {
        await page.keyboard.press("Escape");
        console.warn(`     ⚠️ Insumo "${nomInsumo}" no hallado en la lista.`);
      }

      const selectedBadge = dialog.locator('.bg-zinc-100').filter({ hasText: 'Unidad de medida:' });
      if (await selectedBadge.count() > 0) {
        await dialog.locator('input[type="number"]').fill("1");
      }

      await clickSafe(dialog, 'button:has-text("Confirmar")');
      await dialog.waitFor({ state: "hidden" });
    }
  }

  const saveBtn = page.locator("button", { hasText: /Guardar Producto/i }).first();
  await saveBtn.click();
  await waitForSuccessToast(page);
  
  try {
    await page.waitForURL(`${BASE_URL}/admin/dashboard/productos`, { timeout: 8000 });
  } catch {}

  console.log(`  ✅ Producto "${producto.nombre}" creado.`);
}

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════

async function login(page) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("⏩ Sin credenciales automáticas.");
    console.log("   Tenés 2 minutos para loguearte manualmente en el navegador abierto...");
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "load" });
    
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    if (!currentUrl.includes("/admin/dashboard")) {
      await page.waitForURL(/\/admin\/dashboard/, { timeout: 120000 });
    }
    return;
  }

  console.log("🔐 Iniciando sesión automático...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  try {
    await page.fill("input#email", ADMIN_EMAIL);
    await page.fill("input#password", ADMIN_PASSWORD);
    await page.click("button[type='submit']");
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 20000 });
    console.log("✅ Login exitoso.");
  } catch (e) {
    console.warn("⚠️ Login automático falló, iniciá sesión a mano (2 min de tiempo limit)...");
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 120000 });
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100, 
  });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {}
  });

  try {
    await login(page);

    console.log("\n🍕 1. CARGANDO CATEGORÍA DE PIZZAS");
    for (const cat of CATEGORIAS_PRODUCTOS) {
      await crearCategoriaProducto(page, cat);
    }

    console.log("\n🌿 2. CARGANDO NUEVOS INSUMOS");
    for (const insumo of INSUMOS) {
      await crearInsumo(page, insumo);
    }

    console.log("\n🍕 3. CARGANDO VARIEDADES DE PIZZA");
    for (const prod of PRODUCTOS) {
      await crearProducto(page, prod);
    }

    console.log("\n🎉 SEED DE PIZZAS FINALIZADO CON ÉXITO.");
  } catch (error) {
    console.error("\n💥 Error fatal:", error.message);
  } finally {
    console.log("\n⏳ Cerrando navegador en 5 segundos...");
    await new Promise((r) => setTimeout(r, 5000));
    await browser.close();
  }
})();
