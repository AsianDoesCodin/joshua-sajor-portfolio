// Screenshots of the live CRM UI with 100% fictional data.
// Every request to Supabase is answered locally (never forwarded); websockets are stubbed.
// usage: node crm-mock.mjs <outDir> [mode=all|probe]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/My PC/Documents/Bluelotuscoding LLC/crm/package.json');
const puppeteer = require('puppeteer-core');
const OUT = process.argv[2];
const MODE = process.argv[3] || 'all';
fs.mkdirSync(OUT, { recursive: true });

const REF = process.env.CRM_SUPABASE_REF; // the CRM's Supabase project ref; every request to it is intercepted and answered with the fictional data below
if (!REF) throw new Error('Set CRM_SUPABASE_REF');
const BASE = 'https://crm.bluelotuscoding.com/';
const now = Math.floor(Date.now() / 3600000) * 3600000;
const iso = (ms) => new Date(ms).toISOString();
const day = 86400000, hour = 3600000;

// ---------- fictional people ----------
const ME = { id: '00000000-0000-4000-8000-000000000001', email: 'joshua@example.com', full_name: 'Joshua Sajor', role: 'master' };
const staff = [
  { id: '00000000-0000-4000-8000-000000000002', email: 'maya@example.com', full_name: 'Maya Torres' },
  { id: '00000000-0000-4000-8000-000000000003', email: 'daniel@example.com', full_name: 'Daniel Reyes' },
  { id: '00000000-0000-4000-8000-000000000004', email: 'priya@example.com', full_name: 'Priya Nair' },
  { id: '00000000-0000-4000-8000-000000000005', email: 'sam@example.com', full_name: 'Sam Okafor' },
];
const profiles = [ME, ...staff.map((s) => ({ ...s, role: 'staff' }))].map((p, i) => ({
  ...p, created_at: iso(now - (200 - i * 10) * day), active: true, removed_at: null, avatar_path: null, avatar_updated_at: null,
}));
const ids = profiles.map((p) => p.id);

// ---------- fictional deals ----------
const companies = [
  ['Harbor Point Dental', 'Elena Brooks'], ['Copper Kettle Bakery', 'Marcus Lee'], ['Summit Ridge Roofing', 'Tom Walsh'],
  ['Bright Path Tutoring', 'Aisha Grant'], ['Pinecrest Animal Clinic', 'Dr. Laura Kim'], ['Lakeside Yoga Loft', 'Nina Patel'],
  ['Ridgeline Heating & Air', 'Chris Dunn'], ['Golden Hour Studio', 'Jade Moreno'], ['Maple & Main Realty', 'Grace Holloway'],
  ['Crescent Landscaping', 'Luis Ortega'], ['Oak & Iron Fitness', 'Derek Cole'], ['Seaside Smiles Ortho', 'Dr. Ben Hart'],
  ['Tidewater Law Group', 'Rachel Stone'], ['Fern & Fig Florist', 'Holly Vance'], ['Atlas Moving Co.', 'Victor Hale'],
  ['Red Clay Coffee', 'Owen Price'], ['Cornerstone Chiropractic', 'Dr. Mia Ford'], ['Evergreen Pest Control', 'Kyle Marsh'],
  ['Northside Auto Glass', 'Andre Wells'], ['Willow Creek Vet', 'Sara Lin'], ['Blue Fin Sushi Bar', 'Ken Ito'],
  ['Granite State Plumbing', 'Pete Rowan'], ['Little Sprouts Daycare', 'Tara Quinn'], ['Velvet Chair Salon', 'Bianca Ruiz'],
  ['Ironclad Garage Doors', 'Mike Doyle'], ['Sunrise Senior Care', 'Linda Shaw'], ['Peak Performance PT', 'Jordan Ames'],
  ['Harvest Table Catering', 'Rosa Diaz'], ['Keystone Accounting', 'Neil Banks'], ['Driftwood Inn', 'Claire Moss'],
  ['Brightline Electric', 'Ray Foster'], ['Stonebridge Dental', 'Dr. Omar Aziz'], ['Rolling Pin Pizza', 'Gina Russo'],
  ['Clearview Window Co.', 'Hank Bishop'], ['Magnolia Wedding Co.', 'Ivy Carter'], ['Trailhead Outfitters', 'Cole Barrett'],
];
const stagePlan = ['created', 'created', 'created', 'qualification', 'qualification', 'meeting', 'proposal', 'negotiation', 'won', 'lost'];
const sources = ['Site scanner', 'Referral', 'Google Maps', 'Cold call', 'Website form'];
const tagSets = [['website', 'hot'], ['seo'], ['automation'], ['ai-assistant', 'website'], ['booking'], ['website'], ['ordering', 'website'], ['seo', 'speed']];
const notes = [
  'Site loads in 9s on mobile. Owner wants online booking before the holidays.',
  'Asked for a quote on a redesign plus monthly SEO care.',
  'Missed-call text-back would save the front desk hours each week.',
  'Wants an assistant that answers pricing questions after hours.',
  'Current site has no tappable phone number. Strong fit for a rebuild.',
];
const deals = companies.map(([company, contact], i) => {
  const stage = stagePlan[i % stagePlan.length];
  const created = now - (i * 0.9 + 0.2) * day;
  const first = contact.replace(/^Dr\. /, '').split(' ')[0].toLowerCase();
  return {
    id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    lead_number: 1340 - i,
    title: i % 3 === 0 ? 'Website redesign' : i % 3 === 1 ? 'Booking + automation' : 'SEO and speed rebuild',
    company, contact_name: contact,
    email: `${first}@example.com`, phone: `(555) 01${String(10 + i).slice(-2)}-${String(4200 + i * 37).slice(-4)}`,
    source: sources[i % sources.length], stage,
    score: [92, 78, 64, 88, 55, 71, 83, 47, 95, 38][i % 10],
    lost_reason: stage === 'lost' ? 'Went with a cheaper template' : null,
    value: [4800, 2500, 7200, 3600, 9500, 1800, 6400, 12000, 5200, 3000][i % 10],
    tags: tagSets[i % tagSets.length], notes: notes[i % notes.length],
    next_action_at: stage === 'won' || stage === 'lost' ? null : iso(now + ((i % 6) - 1) * day + (10 + (i % 7)) * hour),
    claimed_by: i % 4 === 3 ? null : ids[1 + (i % 4)] ?? ids[1],
    created_by: ids[i % ids.length], created_at: iso(created), updated_at: iso(created + 3 * hour),
  };
});
const focus = deals[0];
const activity = [
  ['comment', 'Maya Torres commented: Sent the speed report, they loved the before/after.', 2],
  ['stage', 'Moved from Meeting / Demo to Proposal', 5],
  ['schedule', 'Scheduled “Proposal walkthrough” for Thu 10:00 AM', 26],
  ['tag', 'Added tag hot', 30],
  ['claim', 'Daniel Reyes claimed this opportunity', 50],
  ['created', 'Created from Site scanner', 72],
].map(([kind, description, h], i) => ({ id: `20000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, deal_id: focus.id, actor_id: ids[(i % 3) + 1], kind, description, created_at: iso(now - h * hour) }));
const comments = [
  [ids[1], 'Ran the scanner on their site: mobile performance 31, no booking, phone number not tappable. Great opener for the call.', 30],
  [ids[2], 'Call went well. Elena wants online booking and reminder texts before the holiday rush.', 6],
  [ids[0], '@Maya Torres send the proposal with the Ironwood booking demo link.', 2],
].map(([author_id, body, h], i) => ({ id: `30000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, deal_id: focus.id, author_id, body, created_at: iso(now - h * hour) }));
const schedules = deals.filter((d) => d.next_action_at).slice(0, 12).map((d, i) => ({
  id: `40000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, deal_id: d.id, created_by: ids[(i % 4) + 1],
  title: ['Discovery call', 'Demo walkthrough', 'Proposal review', 'Follow-up call'][i % 4],
  starts_at: d.next_action_at, ends_at: iso(Date.parse(d.next_action_at) + 30 * 60000), notes: null, created_at: iso(now - 2 * day),
}));
const notifications = [
  ['comment', 'Maya Torres commented on Harbor Point Dental', 0.5],
  ['stage', 'Daniel Reyes moved Copper Kettle Bakery to Proposal', 3],
  ['schedule', 'Priya Nair scheduled a demo with Summit Ridge Roofing', 20],
].map(([kind, message, h], i) => ({ id: `50000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, recipient_id: ME.id, deal_id: deals[i].id, actor_id: ids[i + 1], activity_id: null, message_id: null, kind, message, created_at: iso(now - h * hour), read_at: i ? iso(now) : null }));
const shiftRules = staff.map((s, i) => ({ user_id: s.id, shift_start: i === 3 ? '13:00' : '09:00', shift_end: i === 3 ? '21:00' : '17:00', timezone: 'America/Chicago', weekdays: [1, 2, 3, 4, 5], updated_at: iso(now - 9 * day) }));
const stagePerms = staff.flatMap((s, i) => ['created', 'qualification', 'meeting', 'proposal', 'negotiation'].slice(0, 3 + (i % 3)).map((stage) => ({ user_id: s.id, stage, created_at: iso(now - 40 * day) })));
const messages = [
  [ids[2], null, 'Morning team, 14 new leads from the scanner overnight. I took the dental ones.', 3],
  [ids[1], null, 'Nice. I have the Copper Kettle proposal call at 11.', 2.6],
  [ids[0], null, '@Daniel Reyes great. Use the Luna ordering demo for any restaurants today.', 2.2],
  [ids[3], null, 'Booked two demos for Thursday afternoon.', 1.1],
].map(([sender_id, recipient_id, body, h], i) => ({ id: `60000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, sender_id, recipient_id, body, mention_ids: [], created_at: iso(now - h * hour) }));

const tables = {
  crm_profiles: profiles, crm_deals: deals, crm_activity: activity, crm_comments: comments, crm_schedules: schedules,
  crm_notifications: notifications, crm_shift_rules: shiftRules, crm_stage_permissions: stagePerms, crm_member_permissions: [],
  crm_follows: deals.slice(0, 5).map((d) => ({ deal_id: d.id, user_id: ME.id, created_at: iso(now - day) })),
  crm_messages: messages, crm_workspace_settings: [], crm_theme_preferences: [], crm_backups: [], crm_deleted_deals: [], crm_clock_sessions: [],
};
const rpcs = {
  crm_work_status: { can_work: true, within_window: true, clocked_in_at: iso(now - 2.5 * hour), shift_start: '09:00', shift_end: '17:00', timezone: 'America/Chicago', weekdays: [1, 2, 3, 4, 5], server_now: iso(now) },
};

// ---------- fictional scanner result (seeded into the scanner's local history) ----------
const issue = (id, title, display, score, ms = null) => ({ id, title, description: '', display, score, savingsMs: ms, savingsBytes: null });
const scans = [{
  url: 'https://harborpointdental.example', finalUrl: 'https://harborpointdental.example/', scannedAt: iso(now - 40 * 60000), durationMs: 23400,
  device: 'mobile', throttled: true, lighthouseVersion: '13.5.0',
  scores: { performance: 31, accessibility: 72, 'best-practices': 78, seo: 83 },
  metrics: [
    { id: 'first-contentful-paint', title: 'First Contentful Paint', display: '4.8 s', value: 4800, score: 0.12 },
    { id: 'largest-contentful-paint', title: 'Largest Contentful Paint', display: '9.1 s', value: 9100, score: 0.02 },
    { id: 'total-blocking-time', title: 'Total Blocking Time', display: '1,240 ms', value: 1240, score: 0.08 },
    { id: 'cumulative-layout-shift', title: 'Cumulative Layout Shift', display: '0.31', value: 0.31, score: 0.4 },
    { id: 'speed-index', title: 'Speed Index', display: '7.6 s', value: 7600, score: 0.15 },
    { id: 'server-response-time', title: 'Server response', display: '1.3 s', value: 1300, score: 0.3 },
  ],
  stats: { totalBytes: 6.4 * 1048576, requests: 142 },
  issues: {
    performance: [issue('render-blocking', 'Eliminate render-blocking resources', '2.1 s', 0.1, 2100), issue('images', 'Properly size images', '3.4 MB', 0.2, 1800), issue('unused-js', 'Reduce unused JavaScript', '820 KB', 0.3, 900)],
    accessibility: [issue('contrast', 'Text does not have enough contrast', '', 0), issue('tap-targets', 'Tap targets are too small', '', 0)],
    seo: [issue('meta-description', 'Document does not have a meta description', '', 0)],
  },
  signals: {
    platform: 'WordPress', ecommerce: false, https: true, mobileViewport: true, copyrightYear: 2019,
    phone: { shown: true, tappable: false }, email: true, contactForm: true, booking: [], ordering: [], bookingWords: true,
    chat: [], analytics: ['Google Analytics'], socials: ['Facebook'], schema: [], industry: 'health', words: 640,
    checks: { title: true, description: false, indexable: true, consoleErrors: true },
  },
  screenshot: null, warnings: [], error: null,
}];

// ---------- fake auth ----------
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const exp = Math.floor(now / 1000) + 6 * 3600;
const user = { id: ME.id, aud: 'authenticated', role: 'authenticated', email: ME.email, app_metadata: { provider: 'email' }, user_metadata: {}, created_at: iso(now - 200 * day) };
const access_token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: ME.id, email: ME.email, role: 'authenticated', aud: 'authenticated', exp, iat: exp - 7200, session_id: 'mock' })}.mock`;
const session = { access_token, refresh_token: 'mock-refresh', expires_in: 6 * 3600, expires_at: exp, token_type: 'bearer', user };

function filterRows(rows, params) {
  let out = rows;
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'columns', 'on_conflict'].includes(k)) continue;
    const m = /^eq\.(.*)$/.exec(v);
    if (m) out = out.filter((r) => String(r[k]) === m[1]);
    const inm = /^in\.\((.*)\)$/.exec(v);
    if (inm) { const set = new Set(inm[1].split(',').map((s) => s.replace(/"/g, ''))); out = out.filter((r) => set.has(String(r[k]))); }
  }
  return out;
}

async function handle(req) {
  const url = new URL(req.url());
  const p = url.pathname;
  const json = (body, status = 200, extra = {}) => req.respond({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Expose-Headers': 'Content-Range', ...extra }, body: JSON.stringify(body) });
  if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' } });
  if (p.startsWith('/auth/v1/user')) return json(user);
  if (p.startsWith('/auth/v1/token')) return json(session);
  if (p.startsWith('/auth/v1/logout')) return json({});
  if (p.startsWith('/auth/v1/')) return json({});
  if (p.startsWith('/storage/')) return req.respond({ status: 404, body: '' });
  if (p.startsWith('/functions/')) return json({});
  if (p.startsWith('/rest/v1/rpc/')) { const fn = p.split('/').pop(); return json(rpcs[fn] ?? null); }
  if (p.startsWith('/rest/v1/')) {
    const table = p.split('/')[3];
    if (req.method() !== 'GET' && req.method() !== 'HEAD') return json([]);
    let rows = filterRows(tables[table] ?? [], url.searchParams);
    const offset = Number(url.searchParams.get('offset') || 0);
    const limit = Number(url.searchParams.get('limit') || rows.length || 1);
    const total = rows.length;
    rows = rows.slice(offset, offset + limit);
    const accept = req.headers()['accept'] || '';
    const range = `${rows.length ? offset : '*'}-${rows.length ? offset + rows.length - 1 : ''}/${total}`.replace('*-/', '*/');
    if (accept.includes('vnd.pgrst.object')) return rows.length ? json(rows[0], 200, { 'Content-Range': range }) : json(null, 200);
    return json(rows, 200, { 'Content-Range': range });
  }
  return json({});
}

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new', args: ['--hide-scrollbars', '--no-first-run', '--disable-extensions'] });
const leaked = [];
async function open(vp) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes(`${REF}.supabase.co`)) return handle(req).catch(() => req.abort());
    if (u.includes('/api/')) return req.respond({ status: 404, body: '' });
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:') || u.includes('fonts.g')) return req.continue();
    leaked.push(u);
    return req.continue();
  });
  await page.evaluateOnNewDocument((key, sess, scans) => {
    localStorage.setItem(key, JSON.stringify(sess));
    localStorage.setItem('bl-crm-site-scans', JSON.stringify(scans));
    class StubSocket { constructor() { this.readyState = 0; } send() {} close() {} addEventListener() {} removeEventListener() {} }
    StubSocket.CONNECTING = 0; StubSocket.OPEN = 1; StubSocket.CLOSING = 2; StubSocket.CLOSED = 3;
    window.WebSocket = StubSocket;
  }, `sb-${REF}-auth-token`, session, scans);
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1800));
  return page;
}
const shot = async (page, name) => { await new Promise((r) => setTimeout(r, 900)); await page.screenshot({ path: path.join(OUT, name), type: 'png' }); console.log('ok', name); };
const clickText = (page, text, sel = 'button, a, [role=button], [role=tab]') => page.evaluate((t, s) => {
  const el = [...document.querySelectorAll(s)].find((e) => e.textContent.trim().toLowerCase().startsWith(t.toLowerCase()) && e.offsetParent !== null);
  if (el) { el.click(); return true; } return false;
}, text, sel);

try {
  const page = await open({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  if (MODE === 'probe') {
    await shot(page, 'probe.png');
    const nav = await page.evaluate(() => [...document.querySelectorAll('nav button, aside button, nav a, aside a')].map((e) => e.textContent.trim()).filter(Boolean).slice(0, 40));
    console.log('nav', JSON.stringify(nav));
  } else {
    await shot(page, 'crm-overview.png');
    console.log('scanner', await clickText(page, 'Site scanner'));
    await shot(page, 'crm-scanner.png');
    await page.evaluate(() => window.scrollTo(0, 0));
    console.log('pipeline', await clickText(page, 'Pipeline'));
    console.log('stage', await clickText(page, 'Lead Generation'));
    await page.evaluate(() => document.querySelector('[aria-label="Card view"]')?.click());
    await shot(page, 'crm-pipeline.png');
    console.log('overview', await clickText(page, 'Overview'));
    // open the focus deal
    console.log('deal', await page.evaluate((c) => { const el = [...document.querySelectorAll('article, li, button, [role=button], tr')].find((e) => e.textContent.includes(c) && e.offsetParent !== null); if (el) { el.click(); return true; } return false; }, focus.company));
    await shot(page, 'crm-deal.png');
    await page.keyboard.press('Escape');
    console.log('calendar', await clickText(page, 'Calendar'));
    await shot(page, 'crm-calendar.png');
    console.log('team', await clickText(page, 'Team'));
    await shot(page, 'crm-team.png');
    console.log('messenger', await clickText(page, 'Messenger'));
    await shot(page, 'crm-messenger.png');
    await page.close();
    const m = await open({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await shot(m, 'crm-mobile.png');
  }
  console.log('non-mock external requests:', JSON.stringify([...new Set(leaked.map((u) => new URL(u).host))]));
} finally {
  await browser.close();
}
