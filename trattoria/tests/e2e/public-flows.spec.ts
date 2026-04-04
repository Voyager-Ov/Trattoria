import { expect, Locator, Page, TestInfo, test } from '@playwright/test';

import {
  captureEvidence,
  captureFailure,
  createUniqueName,
  expectToastOrFeedback,
} from './helpers/common';
import { expectWhatsAppRedirect } from './helpers/public';

test.describe.configure({ mode: 'serial' });

function annotateCriticalFlow(testInfo: TestInfo, description: string): void {
  testInfo.annotations.push({
    type: 'critical',
    description,
  });
}

function annotateCondition(testInfo: TestInfo, description: string): void {
  testInfo.annotations.push({
    type: 'condition',
    description,
  });
}

async function getCartButton(page: Page): Promise<Locator> {
  const cartButton = page.getByRole('button', { name: /tu carrito/i });
  await expect(cartButton).toBeVisible();
  return cartButton;
}

async function openCart(page: Page): Promise<Locator> {
  const cartButton = await getCartButton(page);
  await cartButton.click();

  const drawer = page.getByRole('dialog').last();
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText(/mi pedido|datos de entrega/i).first()).toBeVisible();
  return drawer;
}

async function openFirstCategory(page: Page): Promise<string> {
  const firstCategory = page.locator('main a[href^="/categoria/"]').first();
  await expect(firstCategory).toBeVisible();

  const categoryName = (await firstCategory.getByRole('heading', { level: 3 }).textContent())?.trim();
  if (!categoryName) {
    throw new Error('No se pudo obtener el nombre de la primera categoria visible');
  }

  await firstCategory.click();
  await expect(page).toHaveURL(/\/categoria\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1, name: new RegExp(categoryName, 'i') })).toBeVisible();

  return categoryName;
}

async function addFirstVisibleProductToCart(page: Page): Promise<string> {
  const productHeading = page.getByRole('heading', { level: 4 }).first();
  await expect(productHeading).toBeVisible();

  const productName = (await productHeading.textContent())?.trim();
  if (!productName) {
    throw new Error('No se pudo obtener el nombre del primer producto visible');
  }

  const productCard = productHeading.locator('xpath=ancestor::div[contains(@class,"group")]').first();
  const addButton = productCard.getByRole('button').first();

  await expect(addButton).toBeVisible();
  await addButton.click();
  await expectToastOrFeedback(page, /agregado al carrito/i);

  return productName;
}

async function openCategoryAndAddProduct(page: Page): Promise<string> {
  await openFirstCategory(page);
  return addFirstVisibleProductToCart(page);
}

async function getCartItemRow(drawer: Locator, productName: string): Promise<Locator> {
  const row = drawer.locator('div').filter({ hasText: productName }).first();
  await expect(row).toBeVisible();
  return row;
}

async function goToCheckout(page: Page, drawer: Locator): Promise<Locator> {
  const continueButton = drawer.getByRole('button', { name: /continuar pedido/i });
  await expect(continueButton).toBeVisible();
  await continueButton.click();

  const checkoutDrawer = page.getByRole('dialog').last();
  await expect(checkoutDrawer.getByText(/datos de entrega/i)).toBeVisible();
  return checkoutDrawer;
}

async function selectDeliveryMode(drawer: Locator, mode: 'delivery' | 'retiro'): Promise<void> {
  const target = mode === 'delivery' ? /delivery/i : /retiro/i;
  const button = drawer.getByRole('button', { name: target }).first();
  await expect(button).toBeVisible();
  await button.click();
}

async function selectCashPayment(drawer: Locator): Promise<void> {
  const cashOption = drawer.getByText(/efectivo/i).first();
  await expect(cashOption).toBeVisible();
  await cashOption.click();
  await expect(drawer.getByLabel(/con cu[aá]nto vas a pagar/i)).toBeVisible();
}

async function fillCheckoutFields(
  drawer: Locator,
  options: {
    customerName: string;
    phone: string;
    address?: string;
    cashAmount?: string;
  },
): Promise<void> {
  await drawer.getByLabel(/tu nombre/i).fill(options.customerName);
  await drawer.getByLabel(/tel[eé]fono/i).fill(options.phone);

  const addressInput = drawer.getByLabel(/direcci[oó]n de entrega/i);
  if ((await addressInput.isVisible().catch(() => false)) && options.address !== undefined) {
    await addressInput.fill(options.address);
  }

  const cashInput = drawer.getByLabel(/con cu[aá]nto vas a pagar/i);
  if ((await cashInput.isVisible().catch(() => false)) && options.cashAmount !== undefined) {
    await cashInput.fill(options.cashAmount);
  }
}

async function expectStoreClosedOrOpen(
  drawer: Locator,
  testInfo: TestInfo,
): Promise<{ isClosed: boolean }> {
  const closedAlert = drawer.getByText(
    /cerrad|no estamos recibiendo pedidos|por el momento no estamos recibiendo pedidos/i,
  ).first();

  if (await closedAlert.isVisible().catch(() => false)) {
    annotateCondition(testInfo, 'store-closed-visible-in-ui');
    return { isClosed: true };
  }

  annotateCondition(testInfo, 'store-open-during-public-suite');
  return { isClosed: false };
}

test.describe('public', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('catalogo carga header, cuenta y navegacion por categorias', async ({ page }, testInfo) => {
    try {
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole('button', { name: /mi cuenta/i })).toBeVisible();
      await expect(page.getByRole('heading', { level: 1, name: /categor[ií]as/i })).toBeVisible();

      const searchInput = page.getByPlaceholder(/buscar categor/i);
      await expect(searchInput).toBeVisible();

      const firstCategory = page.locator('main a[href^="/categoria/"]').first();
      await expect(firstCategory).toBeVisible();
      const categoryName = (await firstCategory.getByRole('heading', { level: 3 }).textContent())?.trim();
      if (!categoryName) {
        throw new Error('No se pudo leer el nombre de la categoria para el filtro');
      }

      await searchInput.fill(categoryName);
      await expect(firstCategory).toContainText(categoryName);

      await firstCategory.click();
      await expect(page).toHaveURL(/\/categoria\/[^/]+$/);
      await expect(page.getByRole('heading', { level: 1, name: new RegExp(categoryName, 'i') })).toBeVisible();
      await expect(page.getByPlaceholder(/buscar productos/i)).toBeVisible();

      await captureEvidence(page, testInfo, 'public-catalog-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'public-catalog', error);
    }
  });

  test('carrito permite agregar, subir, bajar y eliminar items', async ({ page }, testInfo) => {
    annotateCriticalFlow(testInfo, 'public-cart-flow');

    try {
      const productName = await openCategoryAndAddProduct(page);
      const drawer = await openCart(page);
      const row = await getCartItemRow(drawer, productName);
      const rowButtons = row.locator('button');
      const quantityLabel = row.locator('span').filter({ hasText: /^1$|^2$/ }).first();

      await expect(row).toContainText(productName);
      await expect(quantityLabel).toContainText('1');

      const plusButton = rowButtons.nth(2);
      const minusButton = rowButtons.nth(1);
      const removeButton = rowButtons.nth(0);

      await expect(plusButton).toBeVisible();
      await plusButton.click();
      await expect(row.locator('span').filter({ hasText: /^2$/ }).first()).toBeVisible();

      await expect(minusButton).toBeVisible();
      await minusButton.click();
      await expect(row.locator('span').filter({ hasText: /^1$/ }).first()).toBeVisible();

      await expect(removeButton).toBeVisible();
      await removeButton.click();
      await expect(drawer.getByText(/tu carrito est[aá] vac[ií]o/i)).toBeVisible();

      await captureEvidence(page, testInfo, 'public-cart-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'public-cart', error);
    }
  });

  test('checkout valida carrito vacio, campos requeridos, delivery, retiro y efectivo', async ({
    page,
  }, testInfo) => {
    annotateCriticalFlow(testInfo, 'public-checkout-validations');

    try {
      const emptyDrawer = await openCart(page);
      await expect(emptyDrawer.getByText(/tu carrito est[aá] vac[ií]o/i)).toBeVisible();
      await expect(emptyDrawer.getByRole('button', { name: /continuar pedido/i })).toHaveCount(0);

      await page.reload();

      await openCategoryAndAddProduct(page);
      const drawer = await openCart(page);
      const checkoutDrawer = await goToCheckout(page, drawer);
      const { isClosed } = await expectStoreClosedOrOpen(checkoutDrawer, testInfo);
      const confirmButton = checkoutDrawer.getByRole('button', { name: /confirmar v[ií]a whatsapp/i });

      if (isClosed) {
        await expect(confirmButton).toBeDisabled();
        await captureEvidence(page, testInfo, 'public-checkout-store-closed-success');
        return;
      }

      await expect(checkoutDrawer.getByLabel(/tu nombre/i)).toBeVisible();
      await expect(checkoutDrawer.getByLabel(/tel[eé]fono/i)).toBeVisible();
      await expect(confirmButton).toBeDisabled();

      await fillCheckoutFields(checkoutDrawer, {
        customerName: createUniqueName('QA-Publico'),
        phone: '1160000000',
      });
      await expect(checkoutDrawer.getByLabel(/direcci[oó]n de entrega/i)).toBeVisible();
      await expect(confirmButton).toBeDisabled();

      await fillCheckoutFields(checkoutDrawer, {
        customerName: createUniqueName('QA-Publico'),
        phone: '1160000000',
        address: 'Calle QA 123',
      });

      await selectCashPayment(checkoutDrawer);
      await expect(confirmButton).toBeDisabled();

      await checkoutDrawer.getByLabel(/con cu[aá]nto vas a pagar/i).fill('20000');
      await expect(confirmButton).toBeEnabled();

      await selectDeliveryMode(checkoutDrawer, 'retiro');
      await expect(checkoutDrawer.getByLabel(/direcci[oó]n de entrega/i)).toHaveCount(0);
      await expect(confirmButton).toBeEnabled();

      await captureEvidence(page, testInfo, 'public-checkout-validations-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'public-checkout-validations', error);
    }
  });

  test('confirmar via WhatsApp genera intent con items total y tipo de entrega', async ({
    page,
  }, testInfo) => {
    annotateCriticalFlow(testInfo, 'public-whatsapp-intent');

    try {
      const productName = await openCategoryAndAddProduct(page);
      const drawer = await openCart(page);
      const checkoutDrawer = await goToCheckout(page, drawer);
      const { isClosed } = await expectStoreClosedOrOpen(checkoutDrawer, testInfo);
      const confirmButton = checkoutDrawer.getByRole('button', { name: /confirmar v[ií]a whatsapp/i });

      if (isClosed) {
        await expect(confirmButton).toBeDisabled();
        await captureEvidence(page, testInfo, 'public-whatsapp-store-closed-success');
        return;
      }

      await selectDeliveryMode(checkoutDrawer, 'retiro');
      await selectCashPayment(checkoutDrawer);

      const customerName = createUniqueName('QA-WhatsApp');
      await fillCheckoutFields(checkoutDrawer, {
        customerName,
        phone: '1160000001',
        cashAmount: '30000',
      });

      await expect(confirmButton).toBeEnabled();

      const messagePromise = expectWhatsAppRedirect(page, [
        productName,
        'Tipo de entrega',
        'Retiro en el local',
        'Total productos',
      ]);

      await confirmButton.click();
      const whatsappMessage = await messagePromise;

      expect(whatsappMessage).toContain(customerName);
      expect(whatsappMessage).toContain('Paga con');

      await captureEvidence(page, testInfo, 'public-whatsapp-success');
    } catch (error) {
      await captureFailure(page, testInfo, 'public-whatsapp', error);
    }
  });
});
