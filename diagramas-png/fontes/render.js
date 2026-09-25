const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const EXE = process.env.USERPROFILE + '/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const only = process.argv[2];
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ deviceScaleFactor: Number(process.env.SCALE || 3), viewport: { width: 1600, height: 1200 } });
  await page.setContent(`<html><head><style>body{margin:0;background:#fff;font-family:"Segoe UI",Arial,sans-serif}#c{display:inline-block;padding:40px;background:#fff}</style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script></head><body><div id="c"></div></body></html>`);
  await page.waitForFunction(() => window.mermaid);
  await page.evaluate(() => mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: { primaryColor:'#EEF0FF', primaryBorderColor:'#4F46E5', primaryTextColor:'#111', lineColor:'#3F3F46', clusterBkg:'#FAFAFA', clusterBorder:'#A1A1AA', actorBkg:'#EEF0FF', actorBorder:'#4F46E5', signalColor:'#27272A', noteBkgColor:'#FEF9C3', noteBorderColor:'#CA8A04', labelBoxBkgColor:'#EEF0FF', labelBoxBorderColor:'#4F46E5', edgeLabelBackground:'#FFFFFF', fontSize:'15px' }, securityLevel: 'loose',
    fontFamily: '"Segoe UI", Arial, sans-serif', er: { useMaxWidth: false }, flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis' },
    sequence: { useMaxWidth: false, mirrorActors: false, showSequenceNumbers: true, wrap: false }, class: { useMaxWidth: false } }));
  for (const f of fs.readdirSync('src').filter(f => f.endsWith('.mmd')).sort()) {
    if (only && !f.startsWith(only)) continue;
    const src = fs.readFileSync(path.join('src', f), 'utf8');
    const err = await page.evaluate(async (src) => {
      try { const { svg } = await mermaid.render('d' + Math.random().toString(36).slice(2), src);
        const c=document.getElementById('c'); c.innerHTML = svg; const el=c.querySelector('svg'); const vb=el.viewBox.baseVal; el.style.maxWidth='none'; el.setAttribute('width', vb.width); el.setAttribute('height', vb.height); return null; } catch (e) { return String(e.message || e); }
    }, src);
    if (err) { console.log('ERRO', f, err); continue; }
    await page.waitForTimeout(300);
    const box = await page.locator('#c').boundingBox();
    await page.setViewportSize({ width: Math.ceil(box.width) + 10, height: Math.ceil(box.height) + 10 });
    await page.locator('#c').screenshot({ path: path.join('out', f.replace('.mmd', '.png')) });
    console.log('ok', f, Math.round(box.width), 'x', Math.round(box.height));
  }
  await browser.close();
})();
