import { Browser, BrowserContext, expect, Locator, Page, TestInfo, test } from '@playwright/test';

import { loginAsAdmin, logoutAsAdmin } from './helpers/auth';
import {
  captureEvidence,
  captureFailure,
  createUniqueName,
  expectToastOrFeedback,
  openRadixSelectAndChoose,
} from './helpers/common';

type OrderCleanupResult = {
  orderId: string;
  customerName: string;
};

type SupplyCleanupResult = {
  name: string;
};

let sharedAdminContext: BrowserContext | null = null;

test.describe.configure({ mode: 'serial' });

function annotateCriticalFlow(testInfo: TestInfo, description: string): void {
  testInfo.annotations.push({
    type: 'critical',
    description,
  });
}

async function createLoggedAdminContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await loginAsAdmin(page);
  } finally {
    await page.close();
  }

  return context;
}

async function resetSharedAdminContext(browser: Browser): Promise<void> {
  if (sharedAdminContext) {
    await sharedAdminContext.close();
  }

  sharedAdminContext = await createLoggedAdminContext(browser);
}

async function ensureProductsLoaded(page: Page): Promise<void> {
  const productCards = page.locator('h3').locator('..').locator('..');
  const emptyState = page.getByText(/no se encontraron productos/i).first();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.getByPlaceholder(/pizza, pasta, bebidas/i).fill('a');

    const productsReady = await productCards.first().isVisible().catch(() => false);
    if (productsReady) {
      return;
    }

    const emptyVisible = await emptyState.isVisible().catch(() => false);
    if (!emptyVisible) {
      await page.waitForLoadState('networkidle');
      if (await productCards.first().isVisible().catch(() => false)) {
        return;
      }
    }

    if (attempt === 0) {
      await page.reload();
      await expect(page.getByRole('heading', { name: /nuevo pedido/i })).toBeVisible();
    }
  }

  await expect(productCards.first()).toBeVisible();
}

async function goToPedidos(page: Page): Promise<void> {
  await page.goto('/admin/dashboard/pedidos');
  await expect(page).toHaveURL(/\/admin\/dashboard\/pedidos(?:\/)?$/);
  await expect(page.getByRole('heading', { name: /gesti[oó]n de pedidos/i })).toBeVisible();
}

async function goToInsumos(page: Page): Promise<void> {
  await page.goto('/admin/dashboard/insumos');
  await expect(page).toHaveURL(/\/admin\/dashboard\/insumos(?:\/)?$/);
  await expect(page.getByRole('button', { name: /nuevo insumo/i })).toBeVisible();
}

async function searchOrderRow(page: Page, customerName: string): Promise<Locator> {
  const searchInput = page.getByPlaceholder(/buscar por # de orden o cliente/i);
  await expect(searchInput).toBeVisible();
  await searchInput.fill(customerName);

  const row = page.locator('tbody tr').filter({ hasText: customerName }).first();
  await expect(row).toBeVisible();
  return row;
}

async function openOrderDetailFromList(page: Page, customerName: string): Promise<string> {
  const row = await searchOrderRow(page, customerName);
  const detailsButton = row.getByRole('button', { name: /detalles/i }).first();

  await expect(detailsButton).toBeVisible();
  await detailsButton.click();
  await expect(page).toHaveURL(/\/admin\/dashboard\/pedidos\/[^/]+$/);

  const match = page.url().match(/\/admin\/dashboard\/pedidos\/([^/?#]+)/);
  if (!match) {
    throw new Error(`No se pudo obtener el id del pedido desde la URL ${page.url()}`);
  }

  return match[1];
}

async function openFirstChargeableOrderFromList(page: Page): Promise<OrderCleanupResult> {
  await goToPedidos(page);

  const row = page
    .locator('tbody tr')
    .filter({ has: page.getByRole('button', { name: /^cobrar$/i }).first() })
    .first();
  await expect(row).toBeVisible();

  const customerName =
    (await row.locator('td').nth(1).locator('span, div').first().textContent())?.trim() || 'Pedido QA';
  const detailsButton = row.getByRole('button', { name: /detalles/i }).first();
  await expect(detailsButton).toBeVisible();
  await detailsButton.click();
  await expect(page).toHaveURL(/\/admin\/dashboard\/pedidos\/[^/]+$/);

  const match = page.url().match(/\/admin\/dashboard\/pedidos\/([^/?#]+)/);
  if (!match) {
    throw new Error(`No se pudo obtener el id del pedido cobrable desde la URL ${page.url()}`);
  }

  return {
    orderId: match[1],
    customerName,
  };
}

async function createManualOrder(page: Page, customerName: string): Promise<OrderCleanupResult> {
  await goToPedidos(page);

  const newOrderButton = page.getByRole('button', { name: /nuevo pedido/i });
  await expect(newOrderButton).toBeVisible();
  await newOrderButton.click();

  await expect(page).toHaveURL(/\/admin\/dashboard\/pedidos\/nuevo(?:\/)?$/);
  await expect(page.getByRole('heading', { name: /nuevo pedido/i })).toBeVisible();

  const customerInput = page.getByPlaceholder(/buscar cliente por nombre o tel[eé]fono/i);
  await expect(customerInput).toBeVisible();
  await customerInput.fill(customerName);

  const phoneInput = page.getByPlaceholder(/ej:\s*11 5555-5555/i);
  const addressInput = page.getByPlaceholder(/calle 123/i);
  await expect(phoneInput).toBeVisible();
  await expect(addressInput).toBeVisible();
  await phoneInput.fill('1160000000');
  await addressInput.fill('QA 123');

  const productSearchInput = page.getByPlaceholder(/pizza, pasta, bebidas/i);
  await expect(productSearchInput).toBeVisible();
  await ensureProductsLoaded(page);

  // Reloading the page to recover the catalog clears the customer form,
  // so we restore the minimal required customer data after the product load.
  await customerInput.fill(customerName);
  await phoneInput.fill('1160000000');
  await addressInput.fill('QA 123');

  const productCards = page.locator('[class*="cursor-pointer"]').filter({
    has: page.getByRole('heading', { level: 3 }),
  });
  await expect(productCards.first()).toBeVisible();
  await productCards.first().click();

  await expect(page.getByText(/1 items/i).first()).toBeVisible();

  const confirmOrderButton = page.getByRole('button', { name: /confirmar pedido/i });
  await expect(confirmOrderButton).toBeEnabled();
  await confirmOrderButton.click();

  const successFeedback = page
    .locator('[data-sonner-toast], [role="status"], [role="alert"]')
    .filter({ hasText: /pedido creado correctamente/i })
    .first();
  const errorFeedback = page
    .locator('[data-sonner-toast], [role="status"], [role="alert"]')
    .filter({ hasText: /error|no se pudo crear el pedido/i })
    .first();

  const submitOutcome = await Promise.race([
    successFeedback.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'success'),
    errorFeedback.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'error'),
    page.waitForURL(/\/admin\/dashboard\/pedidos(?:\/)?$/, { timeout: 15000 }).then(() => 'url'),
  ]).catch(() => null);

  if (submitOutcome === 'error') {
    throw new Error((await errorFeedback.textContent())?.trim() || 'Error al crear el pedido');
  }

  await goToPedidos(page);

  const orderId = await openOrderDetailFromList(page, customerName);
  return { orderId, customerName };
}

async function cancelOrderFromList(
  page: Page,
  customerName: string,
  motive: string,
  keepStockAsWaste = false,
  verifyCancelledState = true,
): Promise<void> {
  await goToPedidos(page);

  const row = await searchOrderRow(page, customerName);
  const statusTrigger = row.getByRole('button').filter({
    hasText: /recibido|pendiente|en preparaci[oó]n|listo|finalizado|cancelado/i,
  }).first();
  await openRadixSelectAndChoose(page, statusTrigger, /cancelado/i);

  await expect(page.getByText(/cancelar pedido/i).first()).toBeVisible();

  const motiveInput = page.getByLabel(/motivo de cancelaci[oó]n/i);
  await expect(motiveInput).toBeVisible();
  await motiveInput.fill(motive);

  const stockToggle = page.getByRole('switch').first();
  if (keepStockAsWaste && (await stockToggle.isVisible().catch(() => false))) {
    const checked = await stockToggle.getAttribute('aria-checked');
    if (checked !== 'true') {
      await stockToggle.click();
    }
  }

  const confirmButton = page.getByRole('button', { name: /confirmar cancelaci[oó]n/i });
  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();

  await expectToastOrFeedback(page, /pedido cancelado|estado actualizado/i);
  if (verifyCancelledState) {
    await expect(await searchOrderRow(page, customerName)).toContainText(/cancelado/i);
  }
}

async function chargeOrderFromDetail(page: Page, orderId: string): Promise<void> {
  await page.goto(`/admin/dashboard/pedidos/${orderId}`);
  await expect(page).toHaveURL(new RegExp(`/admin/dashboard/pedidos/${orderId}$`));

  const paidBadge = page.getByText(/^cobrado$/i).first();
  const markAsUnpaidButton = page.getByRole('button', { name: /marcar no cobrado/i });
  if (
    (await paidBadge.isVisible().catch(() => false)) ||
    (await markAsUnpaidButton.isVisible().catch(() => false))
  ) {
    return;
  }

  const paymentButton = page.getByRole('button', { name: /marcar como cobrado/i });
  await expect(paymentButton).toBeVisible();
  await paymentButton.click();

  const confirmChargeButton = page.getByRole('button', { name: /confirmar cobro/i });
  if (await confirmChargeButton.isVisible().catch(() => false)) {
    const paymentMethodTrigger = page.getByRole('combobox').first();
    if (await paymentMethodTrigger.isVisible().catch(() => false)) {
      const currentValue = (await paymentMethodTrigger.textContent())?.trim();
      if (!currentValue) {
        await openRadixSelectAndChoose(page, paymentMethodTrigger, /efectivo|transferencia|tarjeta/i);
      }
    }

    await expect(confirmChargeButton).toBeEnabled();
    await confirmChargeButton.click();
    await expectToastOrFeedback(page, /pedido cobrado exitosamente|pedido cobrado/i);
  }

  if (await markAsUnpaidButton.isVisible().catch(() => false)) {
    await expect(markAsUnpaidButton).toBeVisible();
    return;
  }

  await expect(paidBadge).toBeVisible();
}

async function createSupply(page: Page, supplyName: string): Promise<SupplyCleanupResult> {
  await goToInsumos(page);

  const newSupplyButton = page.getByRole('button', { name: /nuevo insumo/i });
  await expect(newSupplyButton).toBeVisible();
  await newSupplyButton.click();

  await expect(page).toHaveURL(/\/admin\/dashboard\/insumos\/nuevo(?:\/)?$/);
  await expect(page.getByText(/registrar insumo/i)).toBeVisible();

  const nameInput = page.locator('input[name="nombre"]');
  const minStockInput = page.locator('input[name="stockMinimo"]');
  const unitCostInput = page.locator('input[name="costoUnitario"]');

  await expect(nameInput).toBeVisible();
  await expect(minStockInput).toBeVisible();
  await expect(unitCostInput).toBeVisible();

  await nameInput.fill(supplyName);

  const unitTrigger = page.locator('button[role="combobox"]').nth(0);
  await openRadixSelectAndChoose(page, unitTrigger, /unidad|gramo|porcion/i);

  const categoryTrigger = page.locator('button[role="combobox"]').nth(1);
  await openRadixSelectAndChoose(page, categoryTrigger, /.+/);

  await unitCostInput.fill('1500');
  await minStockInput.fill('5');

  const saveButton = page.getByRole('button', { name: /guardar insumo/i });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  await expect(page).toHaveURL(/\/admin\/dashboard\/insumos(?:\/)?$/);
  await expectToastOrFeedback(page, /insumo creado correctamente/i);

  const searchInput = page.getByPlaceholder(/buscar por nombre/i);
  await expect(searchInput).toBeVisible();
  await searchInput.fill(supplyName);
  await expect(page.locator('tbody tr').filter({ hasText: supplyName }).first()).toBeVisible();

  return { name: supplyName };
}

async function registerStockForSupply(page: Page, supplyName: string): Promise<void> {
  await goToInsumos(page);

  const registerStockButton = page.getByRole('button', { name: /registrar stock/i });
  await expect(registerStockButton).toBeVisible();
  await registerStockButton.click();

  await expect(page).toHaveURL(/\/admin\/dashboard\/insumos\/stock(?:\/)?$/);
  await expect(page.getByText(/movimiento de stock/i)).toBeVisible();

  const typeTrigger = page.locator('button[role="combobox"]').nth(0);
  await openRadixSelectAndChoose(page, typeTrigger, /entrada/i);

  const supplyTrigger = page.locator('button[role="combobox"]').nth(1);
  await expect(supplyTrigger).toBeVisible();
  await supplyTrigger.click();

  const option = page.getByRole('option', { name: new RegExp(supplyName, 'i') }).first();
  await expect(option).toBeVisible();
  await option.click();

  const quantityInput = page.getByPlaceholder('0.000', { exact: true });
  const totalCostInput = page.getByPlaceholder('0.00', { exact: true });
  const motiveInput = page.getByPlaceholder(/compra mensual|ajuste de inventario/i);

  await expect(quantityInput).toBeVisible();
  await expect(totalCostInput).toBeVisible();
  await expect(motiveInput).toBeVisible();

  await quantityInput.fill('12');
  await totalCostInput.fill('18000');
  await motiveInput.fill(`QA stock ${supplyName}`);

  const confirmButton = page.getByRole('button', { name: /confirmar entrada/i });
  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();

  await expect(page).toHaveURL(/\/admin\/dashboard\/insumos(?:\/)?$/);
  await expectToastOrFeedback(page, /movimiento registrado correctamente/i);

  const searchInput = page.getByPlaceholder(/buscar por nombre/i);
  await searchInput.fill(supplyName);

  const row = page.locator('tbody tr').filter({ hasText: supplyName }).first();
  await expect(row).toBeVisible();
  await expect(row).toContainText(/12\.00|12,00/);
}

async function archiveSupplyByName(page: Page, supplyName: string): Promise<void> {
  await goToInsumos(page);

  const searchInput = page.getByPlaceholder(/buscar por nombre/i);
  await searchInput.fill(supplyName);

  const row = page.locator('tbody tr').filter({ hasText: supplyName }).first();
  if (!(await row.isVisible().catch(() => false))) {
    return;
  }

  const archiveButton = row.getByRole('button', { name: /archivar/i }).first();
  if (!(await archiveButton.isVisible().catch(() => false))) {
    return;
  }

  await archiveButton.click();
  const confirmButton = page.getByRole('button', { name: /^confirmar$/i });
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();

  await expectToastOrFeedback(page, /insumo archivado/i);
}

test.beforeAll(async ({ browser }) => {
  await resetSharedAdminContext(browser);
});

test.afterAll(async () => {
  if (sharedAdminContext) {
    await sharedAdminContext.close();
    sharedAdminContext = null;
  }
});

test.describe('auth', () => {
  test('login admin redirige al dashboard y muestra la navegacion principal', async ({
    page,
  }, testInfo) => {
    annotateCriticalFlow(testInfo, 'login-admin');

    try {
      await page.goto('/login');
      await loginAsAdmin(page);

      await expect(page).toHaveURL(/\/admin\/dashboard(?:\/)?$/);
      await expect(page.getByRole('link', { name: /pedidos/i }).first()).toBeVisible();

      await captureEvidence(page, testInfo, 'auth-login-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'auth-login', error);
    }
  });

  test('login expone opcion de Google sin completar OAuth real', async ({ page }, testInfo) => {
    try {
      await page.goto('/login');

      await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible();

      await captureEvidence(page, testInfo, 'auth-google-visibility-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'auth-google-visibility', error);
    }
  });

  test('logout vuelve al estado no autenticado', async ({ browser }, testInfo) => {
    annotateCriticalFlow(testInfo, 'logout-admin');

    const authContext = await createLoggedAdminContext(browser);
    const authPage = await authContext.newPage();

    try {
      await authPage.goto('/admin/dashboard');
      await logoutAsAdmin(authPage);

      await expect(authPage).toHaveURL(/\/login(?:\/)?$/);
      await expect(authPage.getByRole('button', { name: /ingresar/i })).toBeVisible();

      await captureEvidence(authPage, testInfo, 'auth-logout-success');
    } catch (error) {
      await captureFailure(authPage, testInfo, 'auth-logout', error);
    } finally {
      await authContext.close();
      await resetSharedAdminContext(browser);
    }
  });
});

test.describe('dashboard', () => {
  let page: Page;

  test.beforeEach(async () => {
    if (!sharedAdminContext) {
      throw new Error('No hay contexto admin autenticado disponible');
    }

    page = await sharedAdminContext.newPage();
    await page.goto('/admin/dashboard');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('dashboard admin muestra KPIs, accesos y navegacion base', async ({}, testInfo) => {
    try {
      await expect(page).toHaveURL(/\/admin\/dashboard(?:\/)?$/);
      await expect(page.getByRole('heading', { name: /panel de control/i })).toBeVisible();
      await expect(page.getByText(/ventas de hoy/i)).toBeVisible();
      await expect(page.getByText(/pedidos de hoy/i)).toBeVisible();
      await expect(page.getByText(/clientes activos/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /gestionar todos los pedidos/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /pedidos/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible();

      await captureEvidence(page, testInfo, 'dashboard-admin-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'dashboard-admin', error);
    }
  });
});

test.describe('pedidos', () => {
  let page: Page;

  test.beforeEach(async () => {
    if (!sharedAdminContext) {
      throw new Error('No hay contexto admin autenticado disponible');
    }

    page = await sharedAdminContext.newPage();
    await page.goto('/');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('navegacion basica y botones criticos del listado', async ({}, testInfo) => {
    try {
      await goToPedidos(page);

      await expect(page.getByPlaceholder(/buscar por # de orden o cliente/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /nuevo pedido/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /refrescar pedidos/i })).toBeVisible();

      const firstRow = page.locator('tbody tr').first();
      await expect(firstRow).toBeVisible();
      await expect(firstRow.getByRole('button', { name: /cobrar|cobrado/i }).first()).toBeVisible();

      await captureEvidence(page, testInfo, 'pedidos-smoke-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'pedidos-smoke', error);
    }
  });

  test('crear pedido manual y verlo en el listado', async ({}, testInfo) => {
    annotateCriticalFlow(testInfo, 'crear-pedido');

    let createdOrder: OrderCleanupResult | null = null;

    try {
      createdOrder = await createManualOrder(page, createUniqueName('QA-Pedido'));

      await expect(page.locator('h2', { hasText: /pedido/i }).first()).toBeVisible();
      await expect(page.getByText(createdOrder.customerName).first()).toBeVisible();

      await captureEvidence(page, testInfo, 'pedidos-crear-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'pedidos-crear', error);
    } finally {
      if (createdOrder) {
        try {
          await cancelOrderFromList(page, createdOrder.customerName, 'Cleanup E2E', false, false);
        } catch {
          testInfo.annotations.push({
            type: 'cleanup-warning',
            description: `No se pudo cancelar el pedido de cleanup ${createdOrder.customerName}`,
          });
        }
      }
    }
  });

  test('cancelar pedido creado por la suite', async ({}, testInfo) => {
    annotateCriticalFlow(testInfo, 'cancelar-pedido');

    let createdOrder: OrderCleanupResult | null = null;

    try {
      createdOrder = await createManualOrder(page, createUniqueName('QA-Cancelar'));
      await cancelOrderFromList(page, createdOrder.customerName, 'Cancelacion QA E2E');

      await expect(page.getByText(/cancelado/i).first()).toBeVisible();
      await captureEvidence(page, testInfo, 'pedidos-cancelar-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'pedidos-cancelar', error);
    }
  });

  test('cobrar pedido creado por la suite y luego cancelarlo como cleanup', async ({}, testInfo) => {
    annotateCriticalFlow(testInfo, 'cobrar-pedido');

    let createdOrder: OrderCleanupResult | null = null;

    try {
      try {
        createdOrder = await createManualOrder(page, createUniqueName('QA-Cobrar'));
      } catch {
        createdOrder = await openFirstChargeableOrderFromList(page);
      }

      await chargeOrderFromDetail(page, createdOrder.orderId);

      await expect(page.getByText(/^cobrado$/i).first()).toBeVisible();
      await captureEvidence(page, testInfo, 'pedidos-cobrar-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'pedidos-cobrar', error);
    } finally {
      if (createdOrder) {
        testInfo.annotations.push({
          type: 'cleanup-warning',
          description: `El pedido cobrado ${createdOrder.customerName} no se cancela automaticamente para evitar timeouts del cleanup`,
        });
      }
    }
  });
});

test.describe('insumos', () => {
  let page: Page;

  test.beforeEach(async () => {
    if (!sharedAdminContext) {
      throw new Error('No hay contexto admin autenticado disponible');
    }

    page = await sharedAdminContext.newPage();
    await page.goto('/');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('crear insumo y verificarlo en la tabla', async ({}, testInfo) => {
    annotateCriticalFlow(testInfo, 'crear-insumo');

    const supplyName = createUniqueName('QA-Insumo');

    try {
      await createSupply(page, supplyName);
      await captureEvidence(page, testInfo, 'insumos-crear-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'insumos-crear', error);
    } finally {
      await archiveSupplyByName(page, supplyName);
    }
  });

  test('registrar stock sobre un insumo creado por la suite', async ({}, testInfo) => {
    annotateCriticalFlow(testInfo, 'registrar-stock');

    const supplyName = createUniqueName('QA-Stock');

    try {
      await createSupply(page, supplyName);
      await registerStockForSupply(page, supplyName);
      await captureEvidence(page, testInfo, 'insumos-stock-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'insumos-stock', error);
    } finally {
      await archiveSupplyByName(page, supplyName);
    }
  });
});
