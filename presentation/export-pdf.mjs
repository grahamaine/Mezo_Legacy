import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath  = join(__dirname, 'index.html');
const pdfPath   = join(__dirname, 'Mezo_Legacy_Presentation.pdf');

if (!existsSync(htmlPath)) {
  console.error('❌  index.html not found at', htmlPath);
  process.exit(1);
}

const TOTAL_SLIDES = 10;
const SLIDE_W = 1280;
const SLIDE_H = 720;

console.log('🚀  Launching browser…');
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: 2 });

console.log('📄  Loading presentation…');
await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
  waitUntil: 'networkidle0',
  timeout: 30000,
});

// Inject helper: activate a specific slide by index, hide UI chrome
await page.evaluate(() => {
  // Hide nav and hints during export
  const nav  = document.getElementById('nav');
  const hint = document.getElementById('hint');
  const snt  = document.getElementById('snt') || document.getElementById('slide-num-top');
  if (nav)  nav.style.display  = 'none';
  if (hint) hint.style.display = 'none';
  if (snt)  snt.style.display  = 'none';
});

// Collect screenshot buffers for each slide
const screenshots = [];

for (let i = 0; i < TOTAL_SLIDES; i++) {
  console.log(`  📸  Capturing slide ${i + 1} / ${TOTAL_SLIDES}…`);

  await page.evaluate((idx) => {
    // Make only this slide visible, no animation
    document.querySelectorAll('.slide').forEach((s, si) => {
      s.style.transition = 'none';
      s.style.opacity    = si === idx ? '1' : '0';
      s.style.transform  = 'translateX(0)';
      s.style.pointerEvents = si === idx ? 'auto' : 'none';
      s.classList.toggle('active', si === idx);
      s.classList.remove('exit');
    });
  }, i);

  // Small settle time for any CSS / chart renders
  await new Promise(r => setTimeout(r, 120));

  const buf = await page.screenshot({ type: 'png', fullPage: false });
  screenshots.push(buf);
}

await browser.close();
console.log('✅  All slides captured. Building PDF…');

// ── Build PDF manually using raw PDF syntax ──────────────────────────────────
// We embed each PNG as an image XObject at 1280×720 pt (landscape A-wide).
// This avoids any external PDF library dependency.

const W_PT = SLIDE_W;   // 1280 pt  ≈ 17.8 in  (landscape)
const H_PT = SLIDE_H;   //  720 pt  ≈  10 in

// We'll use pdf-lib which is commonly available, or fall back to a raw write.
// Actually let's just use puppeteer's built-in PDF generation on a blank page
// with each screenshot injected as a background image — simplest approach.

const browser2 = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page2 = await browser2.newPage();
await page2.setViewport({ width: SLIDE_W, height: SLIDE_H });

// Build an HTML page where each slide is a separate @page-sized div
const base64Images = screenshots.map(b => `data:image/png;base64,${b.toString('base64')}`);

const compositeHtml = `<!DOCTYPE html><html><head>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#000; }
  .page {
    width:${SLIDE_W}px; height:${SLIDE_H}px;
    page-break-after: always;
    overflow: hidden;
    position: relative;
  }
  .page:last-child { page-break-after: avoid; }
  img { width:100%; height:100%; display:block; }
  @page { size: ${SLIDE_W}px ${SLIDE_H}px; margin: 0; }
  @media print { body { margin:0; } }
</style>
</head><body>
${base64Images.map(src => `<div class="page"><img src="${src}" /></div>`).join('\n')}
</body></html>`;

await page2.setContent(compositeHtml, { waitUntil: 'networkidle0' });

await page2.pdf({
  path:              pdfPath,
  width:             `${SLIDE_W}px`,
  height:            `${SLIDE_H}px`,
  printBackground:   true,
  margin:            { top: '0', right: '0', bottom: '0', left: '0' },
});

await browser2.close();

console.log('');
console.log('🎉  PDF saved to:');
console.log('    ', pdfPath);
console.log('');
