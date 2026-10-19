// Portrait treatment: real photo pixels, only tone/colour/light adjustments + composite.
// Source: src-assets/joshua-hq-45.png (the 1086px photo cropped to 4:5) and its segmentation
// cutout src-assets/joshua-cutout-hq.png. Run where sharp is installed.
import sharp from 'sharp';
const P = 'C:/Users/My PC/Documents/Bluelotuscoding LLC/portfolio/';
const W = 800, H = 1000, N = W * H, K = W / 640; // K scales the pixel-sized effects

// --- subject: colour straight from the photo (one lanczos downscale), alpha from the cutout
const rgb = await sharp(P + 'src-assets/joshua-hq-45.png').resize(W, H, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
const mask = await sharp(P + 'src-assets/joshua-cutout-hq.png').resize(W, H, { kernel: 'lanczos3' }).ensureAlpha().extractChannel(3).raw().toBuffer();
let alpha = new Float32Array(N);
for (let i = 0; i < N; i++) alpha[i] = mask[i] / 255;

// erode alpha by 2px (min filter) then feather, to drop the grey halo
function minFilter(a, r) {
  const out = new Float32Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let m = 1;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const yy = Math.min(H - 1, Math.max(0, y + dy)), xx = Math.min(W - 1, Math.max(0, x + dx));
      const v = a[yy * W + xx]; if (v < m) m = v;
    }
    out[y * W + x] = m;
  }
  return out;
}
async function blurF(a, sigma) {
  const buf = Buffer.alloc(N); for (let i = 0; i < N; i++) buf[i] = Math.round(Math.min(1, Math.max(0, a[i])) * 255);
  const b = await sharp(buf, { raw: { width: W, height: H, channels: 1 } }).blur(sigma).extractChannel(0).raw().toBuffer();
  const out = new Float32Array(N); for (let i = 0; i < N; i++) out[i] = b[i] / 255; return out;
}
alpha = await blurF(minFilter(alpha, 2), 1.2);
// bottom rows of the photo are the frame edge: keep them solid
for (let y = H - 6; y < H; y++) for (let x = 0; x < W; x++) alpha[y * W + x] = alpha[(H - 7) * W + x];

// rim masks: edge band on the right / left side of the silhouette
const shift = (a, dx) => { const o = new Float32Array(N); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const xx = Math.min(W - 1, Math.max(0, x - dx)); o[y * W + x] = a[y * W + xx]; } return o; };
const aSoft = await blurF(alpha, 3 * K);
const fromRight = shift(aSoft, -Math.round(18 * K)), fromLeft = shift(aSoft, Math.round(18 * K));
const rimR = new Float32Array(N), rimL = new Float32Array(N);
for (let i = 0; i < N; i++) { rimR[i] = Math.max(0, alpha[i] - fromRight[i]); rimL[i] = Math.max(0, alpha[i] - fromLeft[i]); }
const rimRb = await blurF(rimR.map((v) => Math.min(1, v * 1.6)), 6 * K);
const rimLb = await blurF(rimL.map((v) => Math.min(1, v * 1.6)), 6 * K);

// grade subject
const sub = new Float32Array(N * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x; let r = rgb[i * 3] / 255, g = rgb[i * 3 + 1] / 255, b = rgb[i * 3 + 2] / 255;
  // defringe semi-transparent edge pixels toward shadow
  const a = alpha[i]; if (a < 0.98) { const k = 0.55 + 0.45 * a; r *= k; g *= k; b *= k; }
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // saturation +5%
  r = l + (r - l) * 1.05; g = l + (g - l) * 1.05; b = l + (b - l) * 1.05;
  // gentle split tone: warm highs, navy shadows
  const hi = Math.min(1, Math.max(0, (l - 0.35) / 0.5)), sh = 1 - Math.min(1, l / 0.35);
  r += 0.018 * hi - 0.015 * sh; g += 0.006 * hi - 0.003 * sh; b += -0.016 * hi + 0.025 * sh;
  // key light from the right (monitor side), light fall-off to the left and bottom
  const kx = 0.9 + 0.12 * (x / W), ky = 1.0 - 0.12 * Math.max(0, (y - H * 0.6) / (H * 0.4));
  const k = kx * ky; r *= k; g *= k; b *= k;
  // rim lights: cool blue right, warm amber left
  const a2 = alpha[i] * alpha[i] * alpha[i]; const rr = rimRb[i] * 0.42 * a2, rl = rimLb[i] * 0.22 * a2;
  r = 1 - (1 - r) * (1 - rr * 0.62); g = 1 - (1 - g) * (1 - rr * 0.74); b = 1 - (1 - b) * (1 - rr * 1.0);
  r = 1 - (1 - r) * (1 - rl * 1.0); g = 1 - (1 - g) * (1 - rl * 0.68); b = 1 - (1 - b) * (1 - rl * 0.3);
  sub[i * 3] = r; sub[i * 3 + 1] = g; sub[i * 3 + 2] = b;
}

// --- backdrop: lightly defocused crop of the hero scene (monitor + window)
const bg = await sharp(P + 'src-assets/hero-studio.png').extract({ left: 980, top: 120, width: 600, height: 750 })
  .resize(W, H).blur(7 * K).modulate({ brightness: 0.74, saturation: 1.05 }).raw().toBuffer();
const out = Buffer.alloc(N * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x, o = i * 3;
  let r = bg[o] / 255, g = bg[o + 1] / 255, b = bg[o + 2] / 255;
  // background light: soft cool glow behind the head, vignette at the edges
  const dx = (x - W * 0.52) / W, dy = (y - H * 0.34) / H;
  const glow = Math.exp(-(dx * dx + dy * dy) / 0.045) * 0.22;
  r += glow * 0.55; g += glow * 0.7; b += glow * 1.0;
  const vx = (x / W - 0.5) * 2, vy = (y / H - 0.5) * 2; const vig = 1 - 0.38 * Math.min(1, (vx * vx + vy * vy) * 0.55);
  r *= vig; g *= vig; b *= vig;
  const a = alpha[i];
  r = r * (1 - a) + sub[o] * a; g = g * (1 - a) + sub[o + 1] * a; b = b * (1 - a) + sub[o + 2] * a;
  // fine film grain (deterministic)
  const s0 = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; const n = s0 - Math.floor(s0); const gr = (n - 0.5) * 0.016;
  out[o] = Math.round(Math.min(1, Math.max(0, r + gr)) * 255);
  out[o + 1] = Math.round(Math.min(1, Math.max(0, g + gr)) * 255);
  out[o + 2] = Math.round(Math.min(1, Math.max(0, b + gr)) * 255);
}
const img = sharp(out, { raw: { width: W, height: H, channels: 3 } });
await img.clone().png().toFile(P + 'src-assets/joshua-portrait.png');
await img.clone().webp({ quality: 90 }).toFile(P + 'site/img/joshua-portrait.webp');
await img.clone().resize(400, 500, { kernel: 'lanczos3' }).webp({ quality: 90 }).toFile(P + 'site/img/joshua-portrait-sm.webp');
// also a transparent graded cutout (for other layouts)
const rgba = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) { rgba[i * 4] = sub[i * 3] * 255; rgba[i * 4 + 1] = sub[i * 3 + 1] * 255; rgba[i * 4 + 2] = sub[i * 3 + 2] * 255; rgba[i * 4 + 3] = alpha[i] * 255; }
await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 88, alphaQuality: 90 }).toFile(P + 'site/img/joshua-cutout.webp');
console.log('portrait done');
