const { chromium } = require('playwright');
const { setupAuthMocks } = require('/tmp/playwright-test-auth.cjs');
const { setupBuilderMocks } = require('/tmp/playwright-test-builder.cjs');
const { setupDeployMocks } = require('/tmp/playwright-test-deploy.cjs');
const TARGET_URL = 'http://localhost:3198';
const OUTPUT = '/Users/pablowiedemann/conductor/workspaces/platform/tunis/.context';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, baseURL: TARGET_URL, deviceScaleFactor: 1 });
  try {
    await setupAuthMocks(page);
    await setupBuilderMocks(page);
    await setupDeployMocks(page);
    await page.route('**/api/cloud/billing/balance', route => route.fulfill({ json: { amount_micros: 100000000, effective_balance_micros: 100000000 } }));
    let failedRequests = 0;
    await page.route('**/posthog/**', async route => { failedRequests++; await route.abort('failed'); });
    await page.goto('/login');
    const toggle = page.getByTestId('login-email-toggle');
    if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
    await page.getByTestId('login-email-input').fill('test@example.com');
    await page.getByTestId('login-password-input').fill('TestPassword123!');
    await page.getByTestId('login-submit-button').click();
    await page.waitForURL(/\/profile\//, { timeout: 30000 });
    const retryPath = '/profile/playground?workspace=mock-workspace-personal#models';
    await page.goto(retryPath);
    await page.getByTestId('feature-flag-retry').waitFor({ state: 'visible', timeout: 30000 });
    const navigation = page.waitForRequest(request => request.isNavigationRequest() && request.frame() === page.mainFrame());
    await page.getByTestId('feature-flag-retry').click();
    await navigation;
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('feature-flag-retry').waitFor({ state: 'visible', timeout: 30000 });
    if (page.url() !== TARGET_URL + retryPath) throw new Error('Retry lost the requested URL: ' + page.url());
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${OUTPUT}/cursor-retry-error.png`, fullPage: true });
    await page.getByTestId('feature-flag-back-home').click();
    await page.waitForURL(/\/profile\/(home|api-keys)/, { timeout: 30000 });
    console.log(JSON.stringify({ hardReloadPreservedQueryAndFragment: true, homeRecovered: true, failedRequests }));
  } catch(error) {
    await page.screenshot({ path: `${OUTPUT}/screenshot-debug.png`, fullPage: true, animations: 'disabled' });
    console.log('URL:', page.url());
    throw error;
  } finally { await browser.close(); }
})();
