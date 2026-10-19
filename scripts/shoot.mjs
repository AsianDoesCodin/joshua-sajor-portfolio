// usage: node shoot.mjs jobs.json
// jobs: [{url, out, w=1440, h=900, mobile=false, full=false, wait=1200, scrollTo, scale=1, js}]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/My PC/Documents/Bluelotuscoding LLC/crm/package.json');
const puppeteer = require('puppeteer-core');
const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: 'new',
  args: ['--hide-scrollbars', '--no-first-run', '--disable-extensions', '--ignore-certificate-errors'],
});
try {
  for (const j of jobs) {
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: j.w || (j.mobile ? 390 : 1440), height: j.h || (j.mobile ? 844 : 900), deviceScaleFactor: j.scale || (j.mobile ? 2 : 1), isMobile: !!j.mobile, hasTouch: !!j.mobile });
      if (j.mobile) await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
      if (j.reducedMotion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.goto(j.url, { waitUntil: 'networkidle2', timeout: 60000 });
      if (j.js) await page.evaluate(j.js);
      if (j.full) {
        // trigger lazy/reveal content
        await page.evaluate(async () => {
          const H = document.documentElement.scrollHeight;
          for (let y = 0; y < H; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
          window.scrollTo(0, 0);
        });
      }
      if (j.scrollTo) await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.scrollIntoView({ block: 'start' }); else window.scrollTo(0, Number(s) || 0); }, j.scrollTo);
      await new Promise(r => setTimeout(r, j.wait ?? 1200));
      fs.mkdirSync(path.dirname(j.out), { recursive: true });
      await page.screenshot({ path: j.out, fullPage: !!j.full, type: j.out.endsWith('.jpg') ? 'jpeg' : 'png', ...(j.out.endsWith('.jpg') ? { quality: 88 } : {}) });
      if (j.metrics) {
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight }));
        console.log('metrics', j.out, JSON.stringify(m));
      }
      console.log('ok', j.out);
    } catch (e) {
      console.log('FAIL', j.url, e.message);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
