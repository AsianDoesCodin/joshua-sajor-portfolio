// Builds the static pages in site/ from src/layout.html, src/partials and src/pages.
// usage: node scripts/build-pages.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src'), SITE = path.join(ROOT, 'site');
const ORIGIN = 'https://joshua-sajor-portfolio.vercel.app';
const read = (p) => fs.readFileSync(path.join(SRC, p), 'utf8');
const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// cache-bust CSS/JS by content
const v = crypto.createHash('sha1').update(fs.readFileSync(path.join(SITE, 'styles.css'))).update(fs.readFileSync(path.join(SITE, 'main.js'))).digest('hex').slice(0, 8);

const cases = {
  crm: { name: 'Blue Lotus CRM', kicker: 'Production software' },
  relay: { name: 'RELAY', kicker: 'Business automation' },
  skillset: { name: 'Skillset', kicker: 'AI with custom skills' },
  demos: { name: 'Ten demo sites', kicker: 'Websites · live gallery' },
  clients: { name: 'Client studios', kicker: 'Real businesses · 21 directions' },
};

const pages = [
  { src: 'home', out: 'index', path: '/', key: 'home', bodyClass: 'page-home', foot: 'contact', preload: true, jsonld: true,
    title: 'Joshua Sajor · Full-stack developer',
    description: 'Joshua Sajor is a full-stack developer and the founder of Blue Lotus Coding. He builds the websites, software and AI that small businesses run on: a production CRM, automation, AI assistants, a ten-site demo gallery and website studios for real local businesses.' },
  { src: 'crm', key: 'crm', next: 'relay',
    title: 'Blue Lotus CRM · Joshua Sajor',
    description: 'Case study: the private sales platform behind Blue Lotus Coding. Realtime pipeline, shift-aware access, a website scanner that writes call prep, and an API that lets AI agents work deals.' },
  { src: 'relay', key: 'relay', next: 'skillset',
    title: 'RELAY · Joshua Sajor',
    description: 'Case study: a back-office automation hub for a plumbing and HVAC company, with node-graph flows, test runs, step logs and a savings dashboard.' },
  { src: 'skillset', key: 'skillset', next: 'demos',
    title: 'Skillset · Joshua Sajor',
    description: 'Case study: a side-by-side demo that shows why an AI assistant needs a business\'s own skills, not a generic prompt.' },
  { src: 'demos', key: 'demos', next: 'clients',
    title: 'Ten demo sites · Joshua Sajor',
    description: 'Ten complete, clickable demo sites for ten kinds of business, each with its own design language and a working core flow.' },
  { src: 'clients', key: 'clients', next: 'crm',
    title: 'Client studios · Joshua Sajor',
    description: 'Website studios for real local businesses: Karter Kitchen, Helecia\'s Dinners & Catering, Blueberry Gal Boutique and Sanders Signature Clean. 21 working directions.' },
  { src: 'about', key: 'about',
    title: 'About · Joshua Sajor',
    description: 'Engineer first, AI-accelerated, accountable for all of it. Experience, toolkit and how Joshua Sajor works.' },
  { src: 'contact', key: 'contact', foot: 'none', bodyClass: 'page-contact',
    title: 'Contact · Joshua Sajor',
    description: 'Open to remote full-stack roles and selected client projects. Email joshuasajor28@gmail.com.' },
  { src: '404', key: '404', noindex: true,
    title: 'Page not found · Joshua Sajor',
    description: 'This page does not exist.' },
];

const layout = read('layout.html');
const navSrc = read('partials/nav.html');
const contact = read('partials/contact.html');
const footer = read('partials/footer.html');
const jsonld = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"Joshua Corbe Sajor","alternateName":"Joshua Sajor","jobTitle":"Full-stack developer","worksFor":{"@type":"Organization","name":"Blue Lotus Coding","url":"https://bluelotuscoding.com"},"email":"mailto:joshuasajor28@gmail.com","url":"' + ORIGIN + '/","sameAs":["https://github.com/AsianDoesCodin","https://bluelotuscoding.com"],"address":{"@type":"PostalAddress","addressCountry":"PH"}}</script>\n';
const preload = '<link rel="preload" as="image" href="/img/hero-mobile.webp" media="(max-width: 760px)">\n<link rel="preload" as="image" href="/img/hero-1672.webp" imagesrcset="/img/hero-960.webp 960w, /img/hero-1672.webp 1672w" imagesizes="100vw" media="(min-width: 761px)">\n';

const pager = (key) => {
  const c = cases[key];
  return `  <nav class="pager wrap" aria-label="Next case study">
    <a href="/${key}"><span class="pager-k">Next case study</span><span class="pager-t">${c.name}</span><span class="pager-s">${c.kicker}</span><span class="pager-a" aria-hidden="true">→</span></a>
  </nav>
`;
};

const urls = [];
for (const p of pages) {
  const out = p.out || p.src;
  const url = p.path || '/' + out;
  let nav = navSrc.replace(new RegExp(`data-key="${p.key}"`, 'g'), `data-key="${p.key}" aria-current="page"`);
  // case studies without their own desktop link light up "Work"
  const desktop = nav.slice(nav.indexOf('class="nav-links"'), nav.indexOf('</nav>'));
  if (cases[p.key] && !desktop.includes('aria-current')) nav = nav.replace('data-key="work"', 'data-key="work" aria-current="true"');
  const foot = p.foot === 'none' || p.foot === 'contact' ? '' : footer;
  let main = read(`pages/${p.src}.html`).replace('{{contact}}', contact.replace(/\s+$/, ''));
  // the contact section is the page's main heading on /contact
  if (p.key === 'contact') main = main.replace(/<h2 class="contact-title"([^>]*)>([\s\S]*?)<\/h2>/, '<h1 class="contact-title"$1>$2</h1>');
  const html = layout
    .replaceAll('{{title}}', esc(p.title))
    .replaceAll('{{description}}', esc(p.description))
    .replaceAll('{{canonical}}', ORIGIN + url)
    .replace('{{robots}}', p.noindex ? '<meta name="robots" content="noindex">\n' : '')
    .replace('{{preload}}', p.preload ? preload : '')
    .replace('{{jsonld}}', p.jsonld ? jsonld : '')
    .replaceAll('{{v}}', v)
    .replace('{{bodyClass}}', p.bodyClass || 'page-sub')
    .replace('{{nav}}', nav.replace(/\s+$/, ''))
    .replace('{{main}}', main.replace(/\s+$/, ''))
    .replace('{{pager}}', p.next ? '\n' + pager(p.next) : '')
    .replace('{{foot}}', foot ? '\n' + foot : '');
  fs.writeFileSync(path.join(SITE, out + '.html'), html);
  if (!p.noindex) urls.push(ORIGIN + url);
}
fs.writeFileSync(path.join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log('built', pages.length, 'pages, v=' + v);
