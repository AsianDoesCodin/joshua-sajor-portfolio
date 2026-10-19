// Converts captured screenshots and scenery into the WebP files the site serves.
// usage: node scripts/build-images.mjs <shotsDir> <crmDir> <fullDir>
// (sharp is resolved from the scratch tooling folder; run with NODE_PATH pointing at it)
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [shots, crm, full] = process.argv.slice(2);
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'site/img');
const W = path.join(OUT, 'work');
fs.mkdirSync(W, { recursive: true });
const webp = (src, dst, width, q = 78, extra = (s) => s) => extra(sharp(src).resize({ width, withoutEnlargement: true })).webp({ quality: q, effort: 5 }).toFile(dst);
const jobs = [];

// scenery
for (const [name, src] of [['hero', 'hero-studio.png'], ['contact', 'contact-window.png']]) {
  const s = path.join(ROOT, 'src-assets', src);
  jobs.push(webp(s, path.join(OUT, `${name}-1672.webp`), 1672, 74));
  jobs.push(webp(s, path.join(OUT, `${name}-960.webp`), 960, 72));
}
// hero on phones: crop to the desk + window side
jobs.push(sharp(path.join(ROOT, 'src-assets/hero-studio.png')).extract({ left: 700, top: 0, width: 972, height: 941 }).resize({ width: 800 }).webp({ quality: 72 }).toFile(path.join(OUT, 'hero-mobile.webp')));

// demos: desktop + phone viewport shots
const demos = ['form', 'common', 'studio', 'spaces', 'luna', 'hale', 'ironwood', 'workbench', 'relay', 'skillset'];
for (const d of demos) {
  jobs.push(webp(path.join(shots, `${d}-d.png`), path.join(W, `${d}.webp`), 1440));
  jobs.push(webp(path.join(shots, `${d}-d.png`), path.join(W, `${d}-720.webp`), 720));
  jobs.push(webp(path.join(shots, `${d}-m.png`), path.join(W, `${d}-m.webp`), 480));
  const f = path.join(full, `${d}.png`);
  if (fs.existsSync(f)) jobs.push(webp(f, path.join(W, `${d}-full.webp`), 640, 66));
}
for (const inner of ['relay-automations', 'relay-runs', 'skillset-try', 'luna-menu', 'ironwood-book', 'workbench-tasks', 'spaces-buy', 'common-shop']) {
  jobs.push(webp(path.join(shots, `${inner}.png`), path.join(W, `${inner}.webp`), 1440));
  jobs.push(webp(path.join(shots, `${inner}.png`), path.join(W, `${inner}-720.webp`), 720));
}
// CRM (fictional data)
for (const c of ['overview', 'pipeline', 'deal', 'calendar', 'team', 'messenger', 'scanner']) {
  jobs.push(webp(path.join(crm, `crm-${c}.png`), path.join(W, `crm-${c}.webp`), 1600));
  jobs.push(webp(path.join(crm, `crm-${c}.png`), path.join(W, `crm-${c}-800.webp`), 800));
}
jobs.push(webp(path.join(crm, 'crm-mobile.png'), path.join(W, 'crm-mobile.webp'), 480));

await Promise.all(jobs);
let total = 0; for (const f of fs.readdirSync(W)) total += fs.statSync(path.join(W, f)).size;
console.log('images', jobs.length, 'work dir KB', Math.round(total / 1024));
