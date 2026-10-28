import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import express from '../../pod-backend/node_modules/express/index.js';

process.env.RESEND_API_KEY = 're_test_placeholder';
process.env.NVIDIA_NIM_API_KEY = 'test-placeholder';
process.env.MCP_CONNECTIONS = '[]';
const provider = createServer((req, res) => {
  req.resume(); res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(req.url === '/embeddings' ? { data: [{ embedding: [1, 0] }] } : { choices: [{ message: { content: 'Abhishek has QA and testing skills.' } }] }));
});
provider.listen(0, '127.0.0.1'); await once(provider, 'listening');
process.env.NVIDIA_NIM_API_URL = `http://127.0.0.1:${provider.address().port}`;
const { createApp } = await import('../../../mcp-server-excalidraw/dist/service.js');
const canvas = createApp().listen(0, '127.0.0.1'); await once(canvas, 'listening');
process.env.EXCALIDRAW_SERVICE_URL = `http://127.0.0.1:${canvas.address().port}`;
process.env.EXCALIDRAW_MCP_URL = `${process.env.EXCALIDRAW_SERVICE_URL}/mcp`;
const app = express(); app.use(express.json());
const httpServer = app.listen(0, '127.0.0.1'); await once(httpServer, 'listening');
const base = `http://127.0.0.1:${httpServer.address().port}`;
process.env.FRONTEND_URL = base;
const { default: routes } = await import('../../pod-backend/dist/routes/index.js');
app.use('/api', routes); app.use(express.static('dist')); app.get('*', (_req, res) => res.sendFile(`${process.cwd()}/dist/index.html`));
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = []; const scripts = [];
  page.on('console', message => { if (message.type() === 'error') console.log('BROWSER_ERROR', message.text().slice(0, 500)); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('/assets/') && request.url().endsWith('.js')) scripts.push(request.url()); });
  // The local app uses same-origin /api. Override only if an old developer .env bakes in another origin.
  await page.context().route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const headers = { 'access-control-allow-origin': base, 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS', 'access-control-allow-headers': 'content-type' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const response = await route.fetch({ url: `${base}${url.pathname}${url.search}` });
    await route.fulfill({ response, headers: { ...response.headers(), ...headers } });
  });
  await page.goto(base); await page.waitForTimeout(500);
  assert.equal(scripts.some(url => /MCPCanvas|percentages|subset-shared/.test(url)), false);
  await page.goto(`${base}/mcp`);
  await page.getByRole('heading', { name: 'Assistant playground' }).waitFor();
  await page.getByText('Excalidraw: connected', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Draw a rectangle', exact: true }).click();
  await page.getByText('Your drawing is ready. Open the canvas to edit it.', { exact: false }).waitFor();
  const frame = page.frameLocator('iframe[title="Interactive Excalidraw canvas"]');
  await frame.getByText('Saved', { exact: true }).waitFor({ timeout: 20000 });
  await frame.locator('canvas').first().waitFor();
  const iframeSrc = await page.locator('iframe').getAttribute('src');
  const id = new URL(iframeSrc).searchParams.get('canvasId');
  const getScene = async () => (await fetch(`${base}/api/mcp/canvas/${id}`)).json();
  assert.equal((await getScene()).elements.filter(e => !e.isDeleted).length, 1);
  // Exercise actual Excalidraw text editing, persistence and remote updates.
  await frame.locator('.excalidraw').click({ position: { x: 350, y: 250 } });
  await page.keyboard.press('t');
  await frame.locator('canvas.interactive').click({ position: { x: 350, y: 250 } });
  await page.keyboard.type('Browser edit'); await page.keyboard.press('Escape');
  // Start a tool update before the editor's debounce saves. A revision conflict must merge both changes.
  await page.getByRole('button', { name: 'Draw a flowchart', exact: true }).click();
  await page.waitForFunction(async ({ base, id }) => {
    const scene = await (await fetch(`${base}/api/mcp/canvas/${id}`)).json();
    return scene.elements.some(e => e.text === 'Browser edit' && !e.isDeleted) && scene.elements.some(e => e.text === 'Start' && !e.isDeleted);
  }, { base, id }, { timeout: 15000 });
  await frame.getByText('Saved', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Export canvas', exact: true }).click();
  await page.getByRole('link', { name: 'Download SVG', exact: true }).waitFor();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download SVG', exact: true }).click();
  const download = await downloadPromise; assert.match(download.suggestedFilename(), /\.svg$/);
  const svg = await (await fetch(`${base}/api/mcp/canvas/${id}/export.svg`)).text();
  assert.match(svg, /Browser edit/); assert.match(svg, /Start/);
  const xmlError = await page.evaluate(svg => new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('parsererror')?.textContent, svg);
  assert.equal(xmlError, undefined);
  await page.screenshot({ path: '/tmp/podfolio-mcp-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: '/tmp/podfolio-mcp-mobile.png', fullPage: true });
  const separate = await page.context().newPage(); await separate.goto(`${base}/mcp`);
  await separate.getByRole('button', { name: 'Draw a rectangle', exact: true }).click();
  await separate.locator('iframe').waitFor();
  assert.notEqual(await separate.locator('iframe').getAttribute('src'), iframeSrc);
  await separate.close();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  await page.getByRole('button', { name: 'smart_toy AI Assistant' }).click();
  await page.locator('input').fill('play dino'); await page.locator('input').press('Enter');
  await page.locator('canvas').first().waitFor();
  await page.locator('main .glass-panel').last().getByRole('button', { name: 'close', exact: true }).click();
  // Clearing a held unified response must not restore obsolete history.
  let release;
  await page.route('**/api/chat', route => {
    if (route.request().method() === 'OPTIONS') return route.fallback();
    return new Promise(resolve => { release = async () => {
      try { await route.fulfill({ json: { success: true, data: { message: 'OBSOLETE REPLY', source: 'llm', cached: false } } }); } catch {}
      resolve();
    }; });
  });
  await page.locator('input').fill('Tell me about QA skills'); await page.locator('input').press('Enter');
  const holdDeadline = Date.now() + 3000;
  while (!release && Date.now() < holdDeadline) await page.waitForTimeout(10);
  assert.ok(release);
  await page.getByRole('button', { name: 'delete Clear' }).click(); await release();
  await page.waitForTimeout(100);
  assert.equal(await page.getByText('OBSOLETE REPLY').count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('portfolio_chat_history')), null);
  assert.deepEqual(errors, []);
  console.log('PASS: lazy desktop, tool discovery, actual canvas render/edit/save, remote diagram, SVG download/XML, mobile overflow, session isolation, desktop game launch and pending-chat cancellation.');
} catch (error) {
  console.log('BROWSER_PAGES', await Promise.all(browser.contexts().flatMap(c => c.pages()).map(async p => ({ url: p.url(), text: (await p.locator('body').innerText()).slice(-4000) }))));
  throw error;
} finally {
  await browser.close();
  for (const server of [httpServer, provider, canvas]) server.closeAllConnections();
  await Promise.all([httpServer, provider, canvas].map(server => new Promise(resolve => server.close(resolve))));
}
