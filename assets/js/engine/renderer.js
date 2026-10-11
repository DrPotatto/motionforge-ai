import { EASINGS, clamp, lerp, smoothstep } from './easing.js';

/* Deterministic PRNG */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

/* Layout: absolute scene timings */
export function layout(spec) {
  let t = 0;
  return spec.scenes.map(scene => { const start = t; const end = start + scene.duration; t = end; return { scene, start, end }; });
}
export const totalDuration = spec => spec.scenes.reduce((a, s) => a + s.duration, 0);

/* Main entry — deterministic given (spec, globalTime) */
export function renderFrame(ctx, spec, globalTime) {
  const { width: W, height: H } = spec;
  const scenes = layout(spec);
  const total = scenes.length ? scenes[scenes.length - 1].end : 0;
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#05060a';
  ctx.fillRect(0, 0, W, H);
  if (!scenes.length || globalTime >= total) { ctx.restore(); return; }
  const clamped = clamp(globalTime, 0, total);
  let idx = scenes.findIndex(s => clamped >= s.start && clamped < s.end);
  if (idx === -1) idx = scenes.length - 1;
  const active = scenes[idx];
  const sceneTime = clamped - active.start;

  // Transition window
  const transitionDur = Math.min(0.6, active.scene.duration * 0.28);
  const inTransition = sceneTime > active.scene.duration - transitionDur && idx < scenes.length - 1;

  if (inTransition) {
    const p = (sceneTime - (active.scene.duration - transitionDur)) / transitionDur;
    drawTransition(ctx, spec, scenes, idx, p);
  } else {
    drawScene(ctx, spec, active.scene, sceneTime, scenes[idx].start);
  }
  ctx.restore();
}

/* -------- Transitions -------- */
function drawTransition(ctx, spec, scenes, idx, p) {
  const out = scenes[idx], inc = scenes[idx + 1];
  const { width: W, height: H } = spec;
  const ease = EASINGS.easeInOutCubic(clamp(p));
  const transition = inc.scene.transition;

  if (transition === 'slide') {
    ctx.save(); ctx.translate(-ease * W, 0); drawScene(ctx, spec, out.scene, out.scene.duration, out.start, true); ctx.restore();
    ctx.save(); ctx.translate(W - ease * W, 0); drawScene(ctx, spec, inc.scene, 0, inc.start, true); ctx.restore();
  } else if (transition === 'wipe') {
    ctx.save(); drawScene(ctx, spec, out.scene, out.scene.duration, out.start, true); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * ease, H); ctx.clip();
    drawScene(ctx, spec, inc.scene, 0, inc.start, true); ctx.restore();
  } else if (transition === 'zoom') {
    ctx.save(); ctx.globalAlpha = 1 - ease;
    const s = 1 + ease * 0.25;
    ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
    drawScene(ctx, spec, out.scene, out.scene.duration, out.start, true); ctx.restore();
    ctx.save(); ctx.globalAlpha = ease;
    const si = 0.85 + ease * 0.15;
    ctx.translate(W / 2, H / 2); ctx.scale(si, si); ctx.translate(-W / 2, -H / 2);
    drawScene(ctx, spec, inc.scene, 0, inc.start, true); ctx.restore();
  } else {
    // Fade with subtle light streak
    ctx.save(); drawScene(ctx, spec, out.scene, out.scene.duration, out.start, true); ctx.restore();
    ctx.save(); ctx.globalAlpha = ease; drawScene(ctx, spec, inc.scene, 0, inc.start, true); ctx.restore();
    // Streak
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const y = H * (1 - ease);
    const grad = ctx.createLinearGradient(0, y - 60, 0, y + 60);
    grad.addColorStop(0, 'rgba(255,138,61,0)');
    grad.addColorStop(0.5, 'rgba(255,138,61,' + (0.4 * Math.sin(ease * Math.PI)) + ')');
    grad.addColorStop(1, 'rgba(255,138,61,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - 60, W, 120);
    ctx.restore();
  }
}

/* -------- Scene -------- */
function drawScene(ctx, spec, scene, t, sceneStart, isTransition) {
  const { width: W, height: H } = spec;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, scene.background);
  bg.addColorStop(1, shiftColor(scene.background, -14));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Technical grid background (cinematic upgrade)
  const gtime = (sceneStart || 0) + t;
  drawTechGrid(ctx, W, H, gtime, scene.accent);

  // Camera transform
  const cam = scene.cameraIntensity || 0;
  const dur = scene.duration || 1;
  const cp = clamp(t / dur);
  const zoom = 1 + cam * 0.06 * cp;
  const panX = cam * 18 * (cp - 0.5);
  const panY = cam * 10 * Math.sin(cp * Math.PI);

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2 + panX, -H / 2 + panY);

  // Elements sorted by render rank
  const order = scene.elements.slice().sort((a, b) => rank(a) - rank(b));
  for (const el of order) drawElement(ctx, spec, scene, el, t, sceneStart || 0);

  ctx.restore();

  // Scan line — thin horizontal sweep every ~4s (cinematic technical detail)
  const scanPeriod = 4.5;
  const scanP = ((gtime % scanPeriod) / scanPeriod);
  const scanY = scanP * H;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const sg = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
  sg.addColorStop(0, 'rgba(255,138,61,0)');
  sg.addColorStop(0.5, 'rgba(255,138,61,0.10)');
  sg.addColorStop(1, 'rgba(255,138,61,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, scanY - 40, W, 80);
  ctx.restore();

  // Vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

/* Technical grid — subtle panning fine grid + brighter intersections */
function drawTechGrid(ctx, W, H, time, accent) {
  const cell = Math.round(W / 32);
  const offset = (time * 6) % cell;

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -offset; x < W + cell; x += cell) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = -offset; y < H + cell; y += cell) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();

  // Brighter accent intersections (sparse)
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = accent;
  const seed = mulberry32(42);
  for (let i = 0; i < 22; i++) {
    const gx = Math.floor(seed() * 32) * cell - offset;
    const gy = Math.floor(seed() * ((H / cell) | 0)) * cell - offset;
    const pulse = 0.6 + 0.4 * Math.sin(time * 1.6 + i);
    ctx.globalAlpha = 0.10 * pulse;
    ctx.fillRect(gx - 2, gy - 2, 4, 4);
  }
  ctx.restore();
}

const rank = el => el.kind === 'particles' ? 0 : el.kind === 'shape' ? 1 : 2;

/* -------- Element dispatch -------- */
function drawElement(ctx, spec, scene, el, t, sceneStart) {
  if (t < el.start || t > el.end) return;
  if (el.kind === 'text') return drawText(ctx, spec, el, t);
  if (el.kind === 'shape') return drawShape(ctx, spec, el, t);
  if (el.kind === 'particles') return drawParticles(ctx, spec, scene, el, t, sceneStart);
  if (el.kind === 'counter') return drawCounter(ctx, spec, el, t);
}

/* Animation state — entrance + exit combined */
function animState(el, t) {
  const s = { alpha: 1, dx: 0, dy: 0, scale: 1, blur: 0, mask: 1 };
  const local = t - el.start;
  const total = el.end - el.start;
  const eIn = el.entrance || { type: 'fade', duration: 0.5, easing: 'easeOutCubic', delay: 0 };
  const eOut = el.exit || { type: 'fade', duration: 0.4, easing: 'easeInQuad', delay: 0 };
  const inDelay = eIn.delay || 0;
  const inP = clamp((local - inDelay) / Math.max(0.001, eIn.duration));
  const inEase = (EASINGS[eIn.easing || 'easeOutCubic'] || EASINGS.easeOutCubic)(inP);
  applyEntrance(s, eIn.type || 'fade', inEase);
  const exitStart = total - eOut.duration;
  const outP = clamp((local - exitStart) / Math.max(0.001, eOut.duration));
  const outEase = (EASINGS[eOut.easing || 'easeInQuad'] || EASINGS.easeInQuad)(outP);
  if (outP > 0 && eOut.type !== 'none') applyExit(s, eOut.type || 'fade', outEase);
  return s;
}
function applyEntrance(s, type, p) {
  const inv = 1 - p;
  switch (type) {
    case 'fade': s.alpha *= p; break;
    case 'slideUp': s.alpha *= p; s.dy += 60 * inv; break;
    case 'slideDown': s.alpha *= p; s.dy -= 60 * inv; break;
    case 'slideLeft': s.alpha *= p; s.dx += 90 * inv; break;
    case 'slideRight': s.alpha *= p; s.dx -= 90 * inv; break;
    case 'scale': s.alpha *= p; s.scale *= 0.85 + p * 0.15; break;
    case 'blur': s.alpha *= p; s.blur += 14 * inv; break;
    case 'maskUp': s.mask = p; break;
    case 'none': break;
  }
}
function applyExit(s, type, p) {
  switch (type) {
    case 'fade': s.alpha *= 1 - p; break;
    case 'slideUp': s.alpha *= 1 - p; s.dy -= 50 * p; break;
    case 'slideDown': s.alpha *= 1 - p; s.dy += 50 * p; break;
    case 'slideLeft': s.alpha *= 1 - p; s.dx -= 80 * p; break;
    case 'slideRight': s.alpha *= 1 - p; s.dx += 80 * p; break;
    case 'scale': s.alpha *= 1 - p; s.scale *= 1 - p * 0.15; break;
    case 'blur': s.alpha *= 1 - p; s.blur += 12 * p; break;
    case 'maskUp': s.mask = 1 - p; break;
    case 'none': break;
  }
}

/* -------- Text -------- */
function drawText(ctx, spec, el, t) {
  const { width: W } = spec;
  const s = animState(el, t);
  if (s.alpha <= 0.001) return;
  const k = W / 1920;
  const fontSize = el.fontSize * k;

  ctx.save();
  ctx.globalAlpha = clamp(s.alpha * el.opacity);
  if (s.blur > 0.2) ctx.filter = 'blur(' + (s.blur * k) + 'px)';

  const cx = el.x * W + s.dx * k;
  const cy = el.y * spec.height + s.dy * k;

  ctx.translate(cx, cy);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.scale(el.scale * s.scale, el.scale * s.scale);

  ctx.font = el.fontWeight + ' ' + fontSize + 'px ' + el.fontFamily;
  ctx.fillStyle = el.color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = el.align;
  ctx.direction = el.direction || 'ltr';
  if ('letterSpacing' in ctx) ctx.letterSpacing = (el.letterSpacing * k) + 'px';

  // Glow for accent text
  if (el.glow) {
    ctx.shadowColor = el.color;
    ctx.shadowBlur = 24 * k;
  }

  const lines = wrapLines(ctx, el.content, W * 0.88);
  const lineHeight = fontSize * el.lineHeight;
  const totalH = lineHeight * lines.length;
  const startY = -totalH / 2 + lineHeight / 2;

  if (s.mask < 1) {
    const mh = totalH + 40 * k;
    ctx.beginPath();
    ctx.rect(-W, -totalH / 2 - 20 * k, W * 2, mh * s.mask);
    ctx.clip();
  }
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], 0, startY + i * lineHeight);
  ctx.restore();
}

function wrapLines(ctx, content, maxWidth) {
  const out = [];
  for (const para of String(content).split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); continue; }
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = w; } else line = test;
    }
    if (line) out.push(line);
  }
  return out;
}

/* -------- Shape -------- */
function drawShape(ctx, spec, el, t) {
  const { width: W } = spec;
  const s = animState(el, t);
  if (s.alpha <= 0.001) return;
  const k = W / 1920;

  ctx.save();
  ctx.globalAlpha = clamp(s.alpha * el.opacity);
  const x = el.x * W + s.dx * k;
  const y = el.y * spec.height + s.dy * k;
  const w = el.width * k * s.scale;
  const h = el.height * k * s.scale;

  ctx.strokeStyle = el.color;
  ctx.fillStyle = el.color;
  ctx.lineWidth = el.strokeWidth * k;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const localP = clamp((t - el.start) / (el.end - el.start));

  if (el.glow) { ctx.shadowColor = el.color; ctx.shadowBlur = 18 * k; }

  if (el.shape === 'rect') {
    roundRect(ctx, x - w / 2, y - h / 2, w, h, (el.radius || 2) * k);
    el.fill ? ctx.fill() : ctx.stroke();
  } else if (el.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(x, y, Math.min(w, h) / 2, 0, Math.PI * 2);
    el.fill ? ctx.fill() : ctx.stroke();
  } else if (el.shape === 'line') {
    const len = el.drawProgress ? localP : 1;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x - w / 2 + w * len, y);
    ctx.stroke();
  } else if (el.shape === 'route' && Array.isArray(el.points)) {
    // Progressive path drawing through normalized points
    const pts = el.points.map(p => ({ x: p.x * W, y: p.y * spec.height }));
    const total = pts.length - 1;
    const reached = localP * total;
    ctx.beginPath();
    for (let i = 0; i <= Math.floor(reached) && i < pts.length; i++) {
      const p = pts[i];
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    if (reached < total) {
      const i0 = Math.floor(reached);
      const frac = reached - i0;
      const a = pts[i0], b = pts[i0 + 1];
      if (a && b) ctx.lineTo(a.x + (b.x - a.x) * frac, a.y + (b.y - a.y) * frac);
    }
    ctx.stroke();

    // Traveling pulse along the drawn path
    if (localP > 0 && localP < 1) {
      const pulseIdx = reached;
      const i0 = Math.floor(pulseIdx);
      const frac = pulseIdx - i0;
      const a = pts[i0], b = pts[i0 + 1];
      if (a && b) {
        const px = a.x + (b.x - a.x) * frac;
        const py = a.y + (b.y - a.y) * frac;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 28 * k);
        grad.addColorStop(0, hexAlpha(el.color, 1));
        grad.addColorStop(1, hexAlpha(el.color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 28 * k, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/* -------- Number counter -------- */
function drawCounter(ctx, spec, el, t) {
  const { width: W } = spec;
  const s = animState(el, t);
  if (s.alpha <= 0.001) return;
  const k = W / 1920;
  const local = clamp((t - el.start) / (el.end - el.start));
  const eased = (EASINGS[el.easing || 'easeOutQuart'] || EASINGS.easeOutQuart)(local);
  const value = lerp(el.from ?? 0, el.to ?? 100, eased);
  const display = formatNumber(value, el.decimals ?? 0, el.prefix || '', el.suffix || '');

  ctx.save();
  ctx.globalAlpha = clamp(s.alpha * el.opacity);
  ctx.font = el.fontWeight + ' ' + (el.fontSize * k) + 'px ' + el.fontFamily;
  ctx.fillStyle = el.color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = el.align || 'center';
  ctx.direction = el.direction || 'ltr';
  if (el.glow) { ctx.shadowColor = el.color; ctx.shadowBlur = 24 * k; }
  ctx.translate(el.x * W + s.dx * k, el.y * spec.height + s.dy * k);
  ctx.scale(s.scale, s.scale);
  ctx.fillText(display, 0, 0);
  ctx.restore();
}
function formatNumber(v, decimals, prefix, suffix) {
  const n = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
  const parts = n.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return prefix + parts.join('.') + suffix;
}

/* -------- Particles (cinematic) -------- */
function drawParticles(ctx, spec, scene, el, t, sceneStart) {
  const { width: W, height: H } = spec;
  const local = clamp((t - el.start) / Math.max(0.001, el.end - el.start));
  const env = Math.sin(local * Math.PI);
  const alpha = env * el.opacity * clamp(el.intensity, 0, 1);
  if (alpha <= 0.001) return;
  const rnd = mulberry32(hash(scene.id + el.id));
  const count = Math.round(el.count * clamp(el.intensity, 0.1, 1.6));
  const k = W / 1920;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < count; i++) {
    const seedX = rnd(), seedY = rnd(), seedS = 0.4 + rnd() * 1.6, speed = 0.4 + rnd() * 1.2;
    const py = ((seedY - local * speed * 0.35) % 1 + 1) % 1;
    const px = (seedX + Math.sin((local * 2 + i) * 0.6) * 0.02) % 1;
    const size = (1.5 + seedS * 3) * k;
    const x = px * W, y = py * H;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 6);
    grad.addColorStop(0, hexAlpha(el.color, 0.9));
    grad.addColorStop(0.4, hexAlpha(el.color, 0.25));
    grad.addColorStop(1, hexAlpha(el.accentColor, 0));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, size * 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hexAlpha('#ffffff', 0.85);
    ctx.beginPath(); ctx.arc(x, y, size * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* Color helpers */
export function hexAlpha(hex, a) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}
function shiftColor(hex, amount) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const cv = v => Math.max(0, Math.min(255, v));
  const r = cv(parseInt(n.slice(0, 2), 16) + amount);
  const g = cv(parseInt(n.slice(2, 4), 16) + amount);
  const b = cv(parseInt(n.slice(4, 6), 16) + amount);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
