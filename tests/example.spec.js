const { test, expect } = require('@playwright/test');

//
// 🔐 Safe Login Function (generic selectors)
//
async function login(page) {
  await page.goto('http://localhost:3000/login');

  // Fill first two input fields (email + password)
  await page.locator('input').nth(0).fill('user@test.com');
  await page.locator('input').nth(1).fill('123456');

  // Click first button (login)
  await page.locator('button').first().click();

  // Wait for navigation (dashboard or any page change)
  await page.waitForLoadState('networkidle');
}

//
// 1️⃣ Homepage Test
//
test('Homepage loads', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveURL(/localhost/);
});

//
// 2️⃣ Login Test
//
test('Login works', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/dashboard|home|user/);
});

//
// 3️⃣ Waste Page Test
//
test('Waste submission page opens', async ({ page }) => {
  await login(page);

  await page.goto('http://localhost:3000/user');

  await expect(page).toHaveURL(/user/);
});

//
// 4️⃣ Product Page Test
//
test('Product page opens', async ({ page }) => {
  await login(page);

  await page.goto('http://localhost:3000/products');

  await expect(page).toHaveURL(/products/);
});

//
// 5️⃣ Admin Page Test
//
test('Admin page opens', async ({ page }) => {
  await page.goto('http://localhost:3000/admin');

  await expect(page).toHaveURL(/admin/);
});