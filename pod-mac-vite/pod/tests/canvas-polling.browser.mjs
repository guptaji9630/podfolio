import assert from 'node:assert/strict';

// Exercise the real editor and its timers, without waiting 15 wall-clock minutes.
export async function verifyCanvasPolling(browser, base, id, proxyApi) {
  // Playwright's clock is shared by pages in a context. Keep smoke tests on real time.
  const context = await browser.newContext();
  await context.route('**/api/**', proxyApi);
  const page = await context.newPage();
  let reads = 0;
  let limited = false;
  let release;
  let hold = false;
  const settle = () => new Promise(resolve => setTimeout(resolve, 100));
  await page.clock.install();
  await page.route('**/api/mcp/canvas/*', async route => {
    if (route.request().method() !== 'GET') return route.fallback();
    reads++;
    if (hold) await new Promise(resolve => { release = resolve; });
    if (limited) return route.fulfill({ status: 429, headers: {
      'Retry-After': '120', 'Access-Control-Allow-Origin': base, 'Access-Control-Expose-Headers': 'Retry-After',
    }, json: { error: 'Too many requests' } });
    return route.fallback();
  });
  try {
    await page.goto(`${base}/mcp/canvas?canvasId=${id}`);
    await page.getByText('Saved', { exact: true }).waitFor();
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    const initial = reads;
    assert.equal(initial, 1, 'mount loads once');
    await page.clock.fastForward(28_000); await settle();
    assert.equal(reads, initial, 'no two-second idle polling');
    await page.clock.fastForward(2000); await settle();
    assert.equal(reads, initial + 1);
    // Exactly 30 refreshes over 15 minutes, comfortably below the 100 request budget.
    for (let i = 1; i < 30; i++) { await page.clock.fastForward(30_000); await settle(); }
    assert.equal(reads, initial + 30);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(300_000); await settle();
    assert.equal(reads, initial + 30, 'hidden canvas does not poll');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.runFor(1); await settle();
    assert.equal(reads, initial + 31, 'visible canvas catches up once');
    limited = true;
    await page.clock.fastForward(30_000); await settle();
    await page.getByText('Too many requests. Sync paused until the server allows retrying.', { exact: true }).waitFor();
    const atLimit = reads;
    // Tool notifications and visibility changes must not bypass Retry-After.
    await page.evaluate(id => {
      window.postMessage({ type: 'podfolio:canvas-updated', canvasId: id }, location.origin);
      document.dispatchEvent(new Event('visibilitychange'));
    }, id);
    await settle();
    await page.clock.fastForward(119_000); await settle();
    assert.equal(reads, atLimit, '429 pauses requests for the entire server deadline');
    limited = false;
    await page.clock.fastForward(1001); await settle();
    await page.getByText('Saved', { exact: true }).waitFor();
    assert.equal(reads, atLimit + 1, 'one request resumes after Retry-After');
    hold = true;
    await page.clock.fastForward(30_000); await settle();
    const heldCount = reads;
    assert.ok(release);
    await page.clock.fastForward(120_000); await settle();
    assert.equal(reads, heldCount, 'slow requests never overlap');
    release(); release = undefined;
    await settle();
    await page.goto('about:blank');
    await page.clock.fastForward(60_000); await settle();
    assert.equal(reads, heldCount, 'unmount stops synchronization');
    console.log('PASS: canvas request budget, hidden tabs, Retry-After, recovery, no overlap and cleanup.');
  } finally { release?.(); await context.close(); }
}


export async function verifyRejectedCanvasSave(browser, base, id, proxyApi) {
  const context = await browser.newContext();
  await context.route('**/api/**', proxyApi);
  const page = await context.newPage();
  let writes = 0;
  let rejectSave = true;
  await page.clock.install();
  await page.route('**/api/mcp/canvas/*', async route => {
    if (route.request().method() !== 'PUT') return route.fallback();
    writes++;
    if (rejectSave) return route.fulfill({ status: 413, headers: { 'Access-Control-Allow-Origin': base }, json: { error: 'SCENE_LIMIT' } });
    return route.fallback();
  });
  const typeText = async (text, x) => {
    await page.keyboard.press('t');
    await page.locator('canvas.interactive').click({ position: { x, y: 250 } });
    await page.keyboard.type(text); await page.keyboard.press('Escape');
  };
  try {
    await page.goto(`${base}/mcp/canvas?canvasId=${id}`);
    await page.getByText('Saved', { exact: true }).waitFor();
    await page.locator('.excalidraw').click({ position: { x: 400, y: 250 } });
    await typeText('Retained edit', 400);
    await page.getByText('Changes could not be saved. Simplify the drawing or reduce its size, then edit to retry.', { exact: true }).waitFor();
    assert.equal(writes, 1);
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
    await page.clock.fastForward(120_000);
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(writes, 1, 'permanent rejection must not retry the unchanged payload');
    rejectSave = false;
    await page.clock.resume();
    await typeText('Corrected edit', 700);
    await page.getByText('Saved', { exact: true }).waitFor();
    const scene = await (await fetch(`${base}/api/mcp/canvas/${id}`)).json();
    assert.ok(scene.elements.some(element => element.text === 'Retained edit'));
    assert.ok(scene.elements.some(element => element.text === 'Corrected edit'));
    assert.equal(writes, 2);
    console.log('PASS: rejected saves pause without discarding edits and resume after editing.');
  } finally { await context.close(); }
}
