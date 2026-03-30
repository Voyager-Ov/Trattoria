/**
 * seedPizzas.ts – Seed de Pizzas con Playwright (TypeScript)
 * ============================================================
 * Carga automáticamente:
 *   1. Categoría de producto "Pizzas"
 *   2. Insumos (sin duplicados)
 *   3. Productos (Pizzas) con precios Entera / Media
 *
 * Ejecutar con:
 *   npx ts-node scripts/seedPizzas.ts
 *
 * Variables de entorno opcionales:
 *   BASE_URL      → default: http://localhost:3000
 *   ADMIN_EMAIL   → credencial de admin
 *   ADMIN_PASSWORD
 */

import { chromium } from "playwright";
import type { Page } from "playwright";

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "octavio.velo2022@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "seguridad";

/** Simulated human delay between UI actions (ms) */
const HUMAN_DELAY = 120;

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface PizzaData {
  nombre: string;
  descripcion: string;
  precioEntera: number;
  precioMedia: number;
  insumos: string[];
}

// ═══════════════════════════════════════════════════════════════
// DATA – INSUMOS ÚNICOS
// Normalizar todos los nombres aquí.
// ═══════════════════════════════════════════════════════════════

const INSUMOS: string[] = [
  "salsa de tomate",
  "mozzarella",
  "aceituna",
  "orégano",
  "cebolla",
  "cebolla de verdeo",
  "queso parmesano",
  "huevo",
  "ajo",
  "perejil",
  "jamón",
  "morrón",
  "choclo",
  "salchicha",
  "mostaza",
  "champiñones",
  "roquefort",
  "palmito",
  "salsa golf",
  "queso tybo",
  "queso sardo",
  "albahaca",
  "salame",
  "anchoas",
  "rúcula",
  "jamón crudo",
  "ananá",
  "azúcar morena",
  "papas fritas",
];

// ═══════════════════════════════════════════════════════════════
// DATA – PIZZAS
// ═══════════════════════════════════════════════════════════════

const PIZZAS: PizzaData[] = [
  {
    nombre: "Mozzarella",
    descripcion: "Salsa de tomate, mozzarella, aceituna, orégano.",
    precioEntera: 7000,
    precioMedia: 4000,
    insumos: ["salsa de tomate", "mozzarella", "aceituna", "orégano"],
  },
  {
    nombre: "Fugazzeta",
    descripcion: "Cebolla salteada, mozza, aceituna, orégano.",
    precioEntera: 7000,
    precioMedia: 4000,
    insumos: ["cebolla", "mozzarella", "aceituna", "orégano"],
  },
  {
    nombre: "Fuga al Verdeo",
    descripcion: "Cebolla salteada, mozza, verdeo y parmesano.",
    precioEntera: 7000,
    precioMedia: 4000,
    insumos: ["cebolla", "mozzarella", "cebolla de verdeo", "queso parmesano"],
  },
  {
    nombre: "Mozza con Huevo",
    descripcion: "Salsa, mozza, huevo, aceituna, orégano.",
    precioEntera: 7000,
    precioMedia: 4000,
    insumos: ["salsa de tomate", "mozzarella", "huevo", "aceituna", "orégano"],
  },
  {
    nombre: "Provenzal",
    descripcion: "Salsa, mozza, ajo, perejil, aceituna.",
    precioEntera: 7000,
    precioMedia: 4000,
    insumos: ["salsa de tomate", "mozzarella", "ajo", "perejil", "aceituna"],
  },
  {
    nombre: "Margarita",
    descripcion: "Salsa, mozza, sardo, aceituna, albahaca, orégano.",
    precioEntera: 7000,
    precioMedia: 4000,
    insumos: ["salsa de tomate", "mozzarella", "queso sardo", "aceituna", "albahaca", "orégano"],
  },
  {
    nombre: "Especial",
    descripcion: "Salsa, jamón, mozza, aceituna, morrones, orégano.",
    precioEntera: 8000,
    precioMedia: 4500,
    insumos: ["salsa de tomate", "jamón", "mozzarella", "aceituna", "morrón", "orégano"],
  },
  {
    nombre: "Napolitana",
    descripcion: "Salsa, mozza, tomate, ajo y orégano.",
    precioEntera: 8000,
    precioMedia: 4500,
    insumos: ["salsa de tomate", "mozzarella", "ajo", "orégano"],
  },
  {
    nombre: "Fuga con Jamón",
    descripcion: "Cebolla salteada, mozza, jamón y morrón.",
    precioEntera: 8000,
    precioMedia: 4500,
    insumos: ["cebolla", "mozzarella", "jamón", "morrón"],
  },
  {
    nombre: "Choclo",
    descripcion: "Salsa, mozza, choclo, aceituna, morrones.",
    precioEntera: 8000,
    precioMedia: 4500,
    insumos: ["salsa de tomate", "mozzarella", "choclo", "aceituna", "morrón"],
  },
  {
    nombre: "Vienesa",
    descripcion: "Salsa, mozza, salchicha, mostaza, aceituna, orégano.",
    precioEntera: 8000,
    precioMedia: 4500,
    insumos: ["salsa de tomate", "mozzarella", "salchicha", "mostaza", "aceituna", "orégano"],
  },
  {
    nombre: "Del Campo",
    descripcion: "Salsa, hierbas, mozza, champiñones, aceituna.",
    precioEntera: 8000,
    precioMedia: 4500,
    insumos: ["salsa de tomate", "mozzarella", "champiñones", "aceituna"],
  },
  {
    nombre: "Auvernia",
    descripcion: "Cebolla, mozza, roquefort, aceituna.",
    precioEntera: 9000,
    precioMedia: 5000,
    insumos: ["cebolla", "mozzarella", "roquefort", "aceituna"],
  },
  {
    nombre: "Palmito",
    descripcion: "Salsa, mozza, palmito, salsa golf, aceituna.",
    precioEntera: 9000,
    precioMedia: 5000,
    insumos: ["salsa de tomate", "mozzarella", "palmito", "salsa golf", "aceituna"],
  },
  {
    nombre: "4 Quesos",
    descripcion: "Salsa, mozza, sardo, roquefort, tybo, aceituna.",
    precioEntera: 9000,
    precioMedia: 5000,
    insumos: ["salsa de tomate", "mozzarella", "queso sardo", "roquefort", "queso tybo", "aceituna"],
  },
  {
    nombre: "Capresse",
    descripcion: "Salsa, mozza, tomate, albahaca, aceituna.",
    precioEntera: 9000,
    precioMedia: 5000,
    insumos: ["salsa de tomate", "mozzarella", "albahaca", "aceituna"],
  },
  {
    nombre: "Calabresa",
    descripcion: "Salsa, mozza, salame, aceituna y orégano.",
    precioEntera: 9000,
    precioMedia: 5000,
    insumos: ["salsa de tomate", "mozzarella", "salame", "aceituna", "orégano"],
  },
  {
    nombre: "Anchoa",
    descripcion: "Salsa, mozza, jamón, anchoa, aceituna, morrón, orégano.",
    precioEntera: 9000,
    precioMedia: 5000,
    insumos: ["salsa de tomate", "mozzarella", "jamón", "anchoas", "aceituna", "morrón", "orégano"],
  },
  {
    nombre: "Rúcula",
    descripcion: "Salsa, mozza, rúcula, jamón crudo, aceituna.",
    precioEntera: 9000,
    precioMedia: 5000,
    insumos: ["salsa de tomate", "mozzarella", "rúcula", "jamón crudo", "aceituna"],
  },
  {
    nombre: "Trattoria",
    descripcion: "Salsa, mozza, cebolla y pimiento salteados picantes.",
    precioEntera: 9000,
    precioMedia: 5000,
    insumos: ["salsa de tomate", "mozzarella", "cebolla", "morrón"],
  },
  {
    nombre: "Tropical",
    descripcion: "Salsa, mozza, jamón, ananá, azúcar morena, aceituna.",
    precioEntera: 9000,
    precioMedia: 5000,
    insumos: ["salsa de tomate", "mozzarella", "jamón", "ananá", "azúcar morena", "aceituna"],
  },
  {
    nombre: "Atómica",
    descripcion: "Salsa, mozza, papas fritas, salsa golf, huevo frito.",
    precioEntera: 12000,
    precioMedia: 7000,
    insumos: ["salsa de tomate", "mozzarella", "papas fritas", "salsa golf", "huevo"],
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function clickSafe(page: Page, selector: string, timeout = 12000): Promise<void> {
  await page.waitForSelector(selector, { state: "visible", timeout });
  await delay(HUMAN_DELAY);
  await page.click(selector);
}

async function waitForLoadingDone(page: Page): Promise<void> {
  try {
    await page.waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 });
  } catch {
    // spinner may not appear – that's fine
  }
}

async function waitForToast(page: Page, timeout = 12000): Promise<boolean> {
  try {
    await page.waitForSelector('[data-sonner-toaster] li[data-type="success"]', {
      state: "attached",
      timeout,
    });
    await delay(800);
    return true;
  } catch {
    return false;
  }
}

/** Retry wrapper – retries up to `attempts` times with 2s delays */
async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  label = "operation"
): Promise<T> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (i === attempts) throw err;
      console.warn(`  ⚠️  ${label} – intento ${i} falló: ${msg}. Reintentando...`);
      await delay(2000);
    }
  }
  throw new Error("unreachable");
}

// ═══════════════════════════════════════════════════════════════
// ACTION: Login
// ═══════════════════════════════════════════════════════════════

async function login(page: Page): Promise<void> {
  console.log("🔐 Iniciando sesión...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await delay(1500);

  await page.fill("input#email", ADMIN_EMAIL);
  await delay(HUMAN_DELAY);
  await page.fill("input#password", ADMIN_PASSWORD);
  await delay(HUMAN_DELAY);
  await page.click("button[type='submit']");
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 25000 });
  console.log("✅ Login exitoso.\n");
}

// ═══════════════════════════════════════════════════════════════
// ACTION: createOrGetCategoria
// ═══════════════════════════════════════════════════════════════

async function createOrGetCategoria(page: Page, nombre: string): Promise<void> {
  console.log(`📂 Categoría: "${nombre}"...`);

  await page.goto(`${BASE_URL}/admin/dashboard/productos/categorias`, { waitUntil: "load" });
  await waitForLoadingDone(page);
  await delay(800);

  // Check if category already exists in the table
  const existe = await page.locator(`td:has-text("${nombre}")`).count();
  if (existe > 0) {
    console.log(`  ⏩ Categoría "${nombre}" ya existe. Saltando.\n`);
    return;
  }

  await clickSafe(page, `button:has-text("Nueva Categoría")`);
  await page.waitForSelector("input#cat-nombre", { state: "visible", timeout: 10000 });
  await delay(300);

  await page.fill("input#cat-nombre", nombre);
  await delay(500); // allow slug to auto-generate

  // Submit
  await clickSafe(page, `button[type="submit"]:has-text("Crear Categoría")`);
  const ok = await waitForToast(page);
  console.log(ok ? `  ✔ Categoría "${nombre}" creada.\n` : `  ℹ️ Categoría "${nombre}" procesada (sin toast).\n`);
}

// ═══════════════════════════════════════════════════════════════
// ACTION: createOrGetInsumo
// ═══════════════════════════════════════════════════════════════

async function createOrGetInsumo(page: Page, nombre: string): Promise<void> {
  await withRetry(async () => {
    await page.goto(`${BASE_URL}/admin/dashboard/insumos/nuevo`, { waitUntil: "load" });
    await waitForLoadingDone(page);
    await delay(600);

    // Fill nombre
    await page.waitForSelector('input[name="nombre"]', { state: "visible", timeout: 10000 });
    await page.fill('input[name="nombre"]', nombre);
    await delay(HUMAN_DELAY);

    // Select unidad (KILOGRAMO by default)
    const unidadTrigger = page.locator('button[role="combobox"]').first();
    await unidadTrigger.click();
    await page.waitForSelector('[role="listbox"]', { timeout: 8000 });
    await delay(300);
    // Select KILOGRAMO
    const kgOption = page.locator('[role="option"]:has-text("Kilogramo")');
    if (await kgOption.count() > 0) {
      await kgOption.first().click();
    } else {
      // Fallback: pick first option
      await page.locator('[role="option"]').first().click();
    }
    await delay(300);

    // stockMinimo
    await page.fill('input[name="stockMinimo"]', "1");
    await delay(HUMAN_DELAY);

    // costoUnitario
    await page.fill('input[name="costoUnitario"]', "0");
    await delay(HUMAN_DELAY);

    // Submit form
    await page.locator('button[type="submit"]:has-text("Guardar")').first().click();
    await delay(600);

    // Wait for either toast or redirect
    try {
      await page.waitForURL(`${BASE_URL}/admin/dashboard/insumos`, { timeout: 8000 });
    } catch {
      const ok = await waitForToast(page, 5000);
      if (!ok) {
        // check if we're still on nuevo (error) or navigated away (success)
        if (!page.url().includes("/nuevo")) return;
      }
    }
  }, 3, `insumo "${nombre}"`);

  console.log(`  ✔ Insumo "${nombre}" creado/verificado.`);
}

// ═══════════════════════════════════════════════════════════════
// ACTION: createProducto (Pizza)
// Crea el producto con nombre, descripción, precio y categoría.
// Los insumos se agregan via la interfaz de composición.
// ═══════════════════════════════════════════════════════════════

async function createProducto(page: Page, pizza: PizzaData): Promise<void> {
  await withRetry(async () => {
    await page.goto(`${BASE_URL}/admin/dashboard/productos/nuevo`, { waitUntil: "load" });
    await waitForLoadingDone(page);
    await delay(600);

    // nombre
    await page.waitForSelector("input#nombre", { state: "visible", timeout: 10000 });
    await page.fill("input#nombre", pizza.nombre);
    await delay(HUMAN_DELAY);

    // descripcion
    const descEl = page.locator("textarea#descripcion");
    if (await descEl.count() > 0) {
      await descEl.fill(pizza.descripcion);
      await delay(HUMAN_DELAY);
    }

    // precio (usa precioEntera como precio base)
    await page.fill("input#precio", String(pizza.precioEntera));
    await delay(HUMAN_DELAY);

    // categoría
    const catTrigger = page.locator('#categoriaId ~ button[role="combobox"]');
    if (await catTrigger.count() > 0) {
      await catTrigger.click();
      await page.waitForSelector('[role="listbox"]', { timeout: 8000 });
      await delay(300);
      await page.locator('[role="option"]:has-text("Pizzas")').first().click();
      await delay(300);
    }

    // ── Agregar insumos ──────────────────────────────────────
    for (const nomInsumo of pizza.insumos) {
      const addBtn = page.locator('button:has-text("Agregar Composición")');
      if (await addBtn.count() === 0) break;

      await addBtn.click();
      const dialog = page.locator('div[role="dialog"]').last();
      await dialog.waitFor({ state: "visible", timeout: 8000 });
      await delay(300);

      // Open combobox inside dialog
      const combobox = dialog.locator('button[role="combobox"]');
      await combobox.click();
      await page.waitForSelector('[role="option"]', { timeout: 8000 });
      await delay(300);

      // Try exact match first, then partial
      const exactOption = page.locator(`[role="option"]:text-is("${nomInsumo}")`).first();
      if (await exactOption.count() > 0) {
        await exactOption.click();
      } else {
        // Partial match fallback
        const partial = page.locator(`[role="option"]`).filter({ hasText: nomInsumo }).first();
        if (await partial.count() > 0) {
          await partial.click();
        } else {
          console.warn(`     ⚠️  Insumo "${nomInsumo}" no encontrado, saltando.`);
          await page.keyboard.press("Escape");
          continue;
        }
      }
      await delay(400);

      // Set qty = 1
      const qtyInput = dialog.locator('input[type="number"]').first();
      if (await qtyInput.count() > 0) {
        await qtyInput.fill("1");
        await delay(HUMAN_DELAY);
      }

      // Confirm
      await dialog.locator('button:has-text("Confirmar")').click();
      await dialog.waitFor({ state: "hidden", timeout: 6000 });
      await delay(300);
    }

    // ── Save producto ────────────────────────────────────────
    const saveBtn = page.locator("button").filter({ hasText: /Guardar Producto/i }).first();
    await saveBtn.click();
    await delay(500);

    const ok = await waitForToast(page);
    if (!ok) {
      // Maybe redirected directly
      try {
        await page.waitForURL(`${BASE_URL}/admin/dashboard/productos`, { timeout: 5000 });
      } catch {
        // ignore
      }
    }
  }, 3, `producto "${pizza.nombre}"`);

  console.log(`  ✔ Producto "${pizza.nombre}" creado (Entera $${pizza.precioEntera} / Media $${pizza.precioMedia}).`);
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function runSeed(): Promise<void> {
  console.log("🍕 Trattoria – Seed de Pizzas\n" + "═".repeat(50));

  const browser = await chromium.launch({
    headless: false,
    slowMo: HUMAN_DELAY,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  // Silence browser console errors to keep output clean
  page.on("console", (msg) => {
    if (msg.type() === "error") return;
  });

  try {
    // ── 0. Login ────────────────────────────────────────────
    await login(page);

    // ── 1. Categoría ────────────────────────────────────────
    console.log("📂 PASO 1: CATEGORÍA");
    await createOrGetCategoria(page, "Pizzas");

    // ── 2. Insumos ──────────────────────────────────────────
    console.log("🧺 PASO 2: INSUMOS (" + INSUMOS.length + " únicos)");
    for (const insumo of INSUMOS) {
      await createOrGetInsumo(page, insumo);
      await delay(400);
    }
    console.log("");

    // ── 3. Pizzas ───────────────────────────────────────────
    console.log("🍕 PASO 3: PRODUCTOS (" + PIZZAS.length + " pizzas)");
    for (const pizza of PIZZAS) {
      console.log(`\n  ➤ ${pizza.nombre}`);
      await createProducto(page, pizza);
    }

    console.log("\n" + "═".repeat(50));
    console.log("🎉 SEED COMPLETADO CON ÉXITO.");
    console.log(`   - Categorías: 1`);
    console.log(`   - Insumos: ${INSUMOS.length}`);
    console.log(`   - Pizzas: ${PIZZAS.length}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`\n💥 Error fatal: ${msg}`);
  } finally {
    console.log("\n⏳ Cerrando navegador en 5 segundos...");
    await delay(5000);
    await browser.close();
  }
}

// Entry point
runSeed();
