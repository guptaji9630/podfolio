import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true, env: process.env });
try {
const page = await browser.newPage({viewport:{width:1440,height:900}});
const errors = []; const scripts=[];
page.on('pageerror', e=>errors.push(e.message));
page.on('console', m=>{if(m.type()==='error' && m.text().includes('generating PDF')) console.log('PDF_ERROR',m.text());});
page.on('request', r=>{if(r.url().includes('/assets/') && r.url().endsWith('.js')) scripts.push(r.url());});
await page.addInitScript(()=>{
  window.__audio=[]; window.__frames=new Map();
  const Original=window.AudioContext;
  window.AudioContext=class extends Original {constructor(...args){super(...args);window.__audio.push(this);}};
  const raf=window.requestAnimationFrame.bind(window), cancel=window.cancelAnimationFrame.bind(window);
  window.requestAnimationFrame=callback=>{
    const stack=new Error().stack; let id;
    id=raf(t=>{window.__frames.delete(id);callback(t);});
    window.__frames.set(id,stack);return id;
  };
  window.cancelAnimationFrame=id=>{window.__frames.delete(id);cancel(id);};
});
await page.goto(process.env.PODFOLIO_TEST_URL || 'http://127.0.0.1:4173/');
await page.waitForTimeout(1000);
assert.equal(scripts.some(x=>/Finder-|Mail-|Chat-|Resume-|Settings-|Game-|html2canvas|jspdf/.test(x)),false);
console.log('PASS initial app/PDF modules deferred',scripts.length);
const closeTop=async()=>{const panel=await page.locator('main .glass-panel').last().elementHandle();await page.locator('main .glass-panel').last().getByRole('button',{name:'close',exact:true}).click();await page.waitForFunction(element=>!element.isConnected,panel);};
await page.getByRole('button',{name:'settings Settings'}).click();
await page.locator('img[loading="lazy"]').first().waitFor();
const imgs=await page.locator('img[loading="lazy"]').evaluateAll(xs=>xs.map(x=>({src:x.src,set:x.srcset,width:x.width})));
assert.ok(imgs.every(x=>x.src.includes('w=640')&&x.set.includes('320w')));
console.log('PASS wallpaper lazy responsive previews',imgs.length);
await closeTop();
await page.getByRole('button',{name:'smart_toy AI Assistant'}).click();
await page.locator('input').waitFor();
// Simulate an input update that bypasses the browser's maxlength enforcement.
await page.locator('input').evaluate(input => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(input, 'a'.repeat(12005));
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
assert.equal((await page.locator('input').inputValue()).length,12000);
console.log('PASS programmatic oversized chat input is clamped');
let resolveChat; let completionRequests=0;
const waitForCompletions = async (expected) => {
  const deadline = Date.now() + 20000;
  while (completionRequests < expected && Date.now() < deadline) await page.waitForTimeout(100);
  assert.ok(completionRequests >= expected, `Expected ${expected} completions; saw ${completionRequests}`);
};
await page.route('**/api/nim/chat/completions',route=>new Promise(resolve=>{completionRequests++;resolveChat=async()=>{try{await route.fulfill({json:{choices:[{message:{content:'OBSOLETE REPLY'}}]}});}catch{}resolve();};}));
await page.locator('input').fill('Tell me about QA skills');await page.locator('input').press('Enter');
await page.waitForTimeout(100);
await page.getByRole('button',{name:'delete Clear'}).click();
await resolveChat?.();await page.getByText('Tell me about QA skills',{exact:true}).waitFor({state:'detached',timeout:3000});
assert.equal(await page.getByText('OBSOLETE REPLY').count(),0);
assert.equal(await page.getByText('Tell me about QA skills',{exact:true}).count(),0);
assert.equal(await page.evaluate(()=>localStorage.getItem('portfolio_chat_history')),null);
console.log('PASS clear pending chat cannot repopulate history');
await closeTop();
for(let i=0;i<20;i++){
 await page.evaluate(()=>window.postMessage({type:'LAUNCH_GAME',payload:{gameId:'dino'}},location.origin));
 await page.locator('canvas').waitFor();
 await page.keyboard.press('Space');await page.waitForTimeout(30);
 await closeTop();
}
await page.waitForTimeout(150);
const resources=await page.evaluate(()=>({contexts:window.__audio.length,active:window.__audio.filter(x=>x.state!=='closed').length,gameFrames:[...window.__frames.values()].filter(x=>x.includes('DinoGame-')).length}));
console.log('DINO_RESOURCES',resources);assert.equal(resources.active,0);assert.equal(resources.gameFrames,0);
console.log('PASS 20 Dino cycles',resources);
await page.getByRole('button',{name:'description Resume'}).click();
await page.locator('[data-resume-content]').waitFor();await page.waitForTimeout(1500);
assert.equal(scripts.some(x=>/html2canvas|jspdf/.test(x)),false);
const original=await page.locator('[data-resume-content]').getAttribute('style');
const download=page.waitForEvent('download',{timeout:8000}).catch(()=>null);
await page.getByRole('button',{name:'download Download PDF',exact:true}).click();
const result=await download;
await page.waitForTimeout(200);
assert.ok(result, 'PDF export must download');console.log('PASS PDF download',result.suggestedFilename());
assert.equal(await page.locator('[data-resume-content]').getAttribute('style'),original);
assert.ok(scripts.some(x=>/html2canvas/.test(x)));console.log('PASS PDF dependencies loaded on export and styles restored');
// Force export failure and confirm live styles still restore.
await page.evaluate(()=>{
 window.__originalDataURL=HTMLCanvasElement.prototype.toDataURL;
 HTMLCanvasElement.prototype.toDataURL=function(){throw new Error('Controlled export failure');};
});
await page.getByRole('button',{name:'download Download PDF',exact:true}).click();
await page.getByRole('button',{name:'download Download PDF',exact:true}).waitFor();
await page.waitForTimeout(500);
assert.equal(await page.locator('[data-resume-content]').getAttribute('style'),original);
await page.evaluate(()=>{HTMLCanvasElement.prototype.toDataURL=window.__originalDataURL;});
console.log('PASS failed PDF export restores live styles');
await closeTop();
await page.evaluate(()=>{
 window.__countdowns=[];
 Math.random=()=>0; // Deterministically request AI personality at each five-second interval.
 const draw=CanvasRenderingContext2D.prototype.fillText;
 CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(/^\d+s$/.test(text))window.__countdowns.push(text);return draw.call(this,text,...args);};
 window.postMessage({type:'LAUNCH_GAME',payload:{gameId:'pong',mode:'survival'}},location.origin);
});
await page.getByRole('button',{name:'Start Game',exact:true}).click();
await waitForCompletions(2);
const ticks=await page.evaluate(()=>[...new Set(window.__countdowns)]);
assert.ok(ticks.includes('60s') && ticks.includes('58s'));
await page.keyboard.press('p');await page.waitForTimeout(300);
await resolveChat?.(); // A reply arriving after pause must not keep the request owned.
const count=await page.evaluate(()=>window.__countdowns.length);
await page.waitForTimeout(300);
assert.equal(await page.evaluate(()=>window.__countdowns.length),count);
await page.keyboard.press('p');
await waitForCompletions(3);
await resolveChat?.();
assert.ok(await page.evaluate(()=>window.__countdowns.length)>count);
await closeTop();
console.log('PASS Pong countdown, pause/resume and personality cancellation recovery',ticks);
await page.screenshot({path:process.env.PODFOLIO_DESKTOP_SCREENSHOT || '/tmp/podfolio-desktop.png'});
await page.setViewportSize({width:390,height:844});
await page.getByRole('button',{name:'settings Settings'}).click();
await page.locator('img[loading="lazy"]').first().waitFor();
await page.waitForTimeout(1500);
await page.screenshot({path:process.env.PODFOLIO_MOBILE_SCREENSHOT || '/tmp/podfolio-mobile.png'});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
console.log('PASS mobile viewport no horizontal document overflow');
const { build } = await import('esbuild');
const finder = await build({stdin:{contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {Finder} from './components/apps/Finder'; const root=document.createElement('div'); root.id='finder-test'; document.body.append(root);createRoot(root).render(<Finder/>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',define:{'import.meta.env':'{}','process.env.NODE_ENV':'"production"'}});
await page.addScriptTag({content:finder.outputFiles[0].text});
await page.locator('#finder-test img').first().waitFor();
assert.ok(await page.locator('#finder-test img').evaluateAll(xs=>xs.every(x=>x.loading==='lazy' && x.decoding==='async' && x.srcset.includes('320w'))));
console.log('PASS Finder responsive lazy previews');
const failurePage=await browser.newPage();
await failurePage.route('**/assets/Settings-*.js',route=>route.abort());
await failurePage.goto(process.env.PODFOLIO_TEST_URL || 'http://127.0.0.1:4173/');
await failurePage.getByRole('button',{name:'settings Settings'}).click();
await failurePage.getByRole('alert').waitFor();
assert.equal(await failurePage.getByRole('button',{name:'Reload desktop'}).count(),1);
console.log('PASS lazy module failure exposes recovery');
await failurePage.close();
console.log('PAGE_ERRORS',errors);
assert.deepEqual(errors,[]);
} finally {await browser.close();}
