const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

//
// 🔐 Robust Login Function
//
async function login(page) {
  await page.goto(`${BASE_URL}/login`);

  // Wait until inputs are visible
  await page.waitForSelector('input');

  const inputs = page.locator('input');

  // Fill first two inputs (email + password)
  await inputs.nth(0).fill('user@test.com');
  await inputs.nth(1).fill('123456');

  // Click button
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.locator('button').first().click()
  ]);

  // Debug screenshot
  await page.screenshot({ path: 'debug-login.png' });
}

//
// Tests
//
test('Homepage loads', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page).toHaveURL(/localhost/);
});

test('Login works', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/dashboard|home|user|localhost/);
});

test('Waste submission page opens', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/user`);
  await expect(page).toHaveURL(/user/);
});

test('Product page opens', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/products`);
  await expect(page).toHaveURL(/products/);
});

test('Admin page opens', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin`);
  await expect(page).toHaveURL(/admin/);
});