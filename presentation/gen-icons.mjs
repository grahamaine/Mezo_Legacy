import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUT = 'C:/Users/Lenovo/Desktop/Mezo_Legacy/.claude/worktrees/brave-lamarr-5d706a/apps/web-app/public/icons';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page    = await browser.newPage();

async function makeIcon(size) {
  await page.setViewport({ width: size, height: size });
  // Use domcontentloaded — no network requests in inline HTML
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#7c6ef7;">
  <canvas id="c" width="${size}" height="${size}"></canvas>
  <script>
    var c=document.getElementById('c'),ctx=c.getContext('2d');
    var g=ctx.createLinearGradient(0,0,${size},${size});
    g.addColorStop(0,'#7c6ef7');g.addColorStop(1,'#38bdf8');
    var r=${size}*0.22;
    ctx.beginPath();
    ctx.moveTo(r,0);ctx.lineTo(${size}-r,0);
    ctx.quadraticCurveTo(${size},0,${size},r);
    ctx.lineTo(${size},${size}-r);
    ctx.quadraticCurveTo(${size},${size},${size}-r,${size});
    ctx.lineTo(r,${size});
    ctx.quadraticCurveTo(0,${size},0,${size}-r);
    ctx.lineTo(0,r);ctx.quadraticCurveTo(0,0,r,0);ctx.closePath();
    ctx.fillStyle=g;ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.95)';
    ctx.font='bold '+Math.round(${size}*0.58)+'px Arial';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('\\u20BF',${size}/2,${size}/2+${size}*0.03);
  </script>
  </body></html>`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await new Promise(r => setTimeout(r, 200));
  return await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: size, height: size } });
}

console.log('Generating 192×192…');
writeFileSync(join(OUT, 'icon-192.png'), await makeIcon(192));

console.log('Generating 512×512…');
writeFileSync(join(OUT, 'icon-512.png'), await makeIcon(512));

await browser.close();
console.log('✅  Icons saved to', OUT);
