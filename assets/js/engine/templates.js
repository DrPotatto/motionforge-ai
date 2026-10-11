let _uid = 0;
const uid = p => p + '_' + (++_uid).toString(36) + '_' + Math.random().toString(36).slice(2, 6);

export const TEMPLATE_META = [
  { id: 'logoReveal',        label: 'Logo reveal',         description: 'Brand mark with particles and glow' },
  { id: 'kineticHeadline',   label: 'Kinetic headline',    description: 'Bold typographic entrance' },
  { id: 'productShowcase',   label: 'Product showcase',    description: 'Silhouette + rotating callout' },
  { id: 'animatedStats',     label: 'Animated statistics', description: 'Progressive stat reveal' },
  { id: 'featureGrid',       label: 'Feature presentation',description: 'Grid of features with staggered entrance' },
  { id: 'processSteps',      label: 'Process explanation', description: 'Numbered steps with progressive drawing' },
  { id: 'callToAction',      label: 'Call to action',      description: 'Sharp closing frame with CTA' },
  { id: 'quoteCard',         label: 'Editorial quote',     description: 'Minimal typographic quote card' },
];

export function makeScene(template, duration, background, accent, brand, quality, transition = 'fade', cam = 0.2, ctx = {}) {
  const scene = { id: uid('sc'), name: templateLabel(template), template, duration, background, accent, transition, cameraIntensity: cam, elements: [] };
  const context = { title: ctx.title ?? 'Your message', subtitle: ctx.subtitle ?? '', bullets: ctx.bullets, stats: ctx.stats, cta: ctx.cta ?? 'Get started', brand, quality, accent };
  switch (template) {
    case 'logoReveal': return logoReveal(scene, context);
    case 'kineticHeadline': return kineticHeadline(scene, context);
    case 'productShowcase': return productShowcase(scene, context);
    case 'animatedStats': return animatedStats(scene, context);
    case 'featureGrid': return featureGrid(scene, context);
    case 'processSteps': return processSteps(scene, context);
    case 'callToAction': return callToAction(scene, context);
    case 'quoteCard': return quoteCard(scene, context);
    default: return kineticHeadline(scene, context);
  }
}
function templateLabel(id) { return (TEMPLATE_META.find(t => t.id === id) || {}).label || 'Scene'; }

function text(over = {}) {
  return { id: uid('tx'), kind: 'text', content: 'Text', x: 0.5, y: 0.5, fontSize: 96,
    fontFamily: '"Space Grotesk", "Inter", "Noto Sans Arabic", sans-serif',
    fontWeight: 700, color: '#ffffff', align: 'center', direction: 'ltr',
    letterSpacing: 0, lineHeight: 1.1, opacity: 1, rotation: 0, scale: 1,
    start: 0, end: 3, glow: false,
    entrance: { type: 'slideUp', duration: 0.7, easing: 'easeOutCubic', delay: 0 },
    exit: { type: 'fade', duration: 0.4, easing: 'easeInQuad', delay: 0 }, ...over };
}
function shape(over = {}) {
  return { id: uid('sh'), kind: 'shape', shape: 'rect', x: 0.5, y: 0.5, width: 400, height: 4,
    color: '#ffffff', strokeWidth: 3, fill: true, opacity: 1, radius: 2, start: 0, end: 3, glow: false,
    entrance: { type: 'fade', duration: 0.5, easing: 'easeOutCubic', delay: 0 },
    exit: { type: 'fade', duration: 0.4, easing: 'easeInQuad', delay: 0 }, drawProgress: false, ...over };
}
function particles(over = {}) {
  return { id: uid('pa'), kind: 'particles', color: '#ff8a3d', accentColor: '#8b6dff',
    count: 60, intensity: 1, speed: 1, opacity: 1, start: 0, end: 3, ...over };
}
function counter(over = {}) {
  return { id: uid('ct'), kind: 'counter', x: 0.5, y: 0.5, from: 0, to: 100, decimals: 0,
    prefix: '', suffix: '', fontSize: 128, fontFamily: '"Space Grotesk", sans-serif',
    fontWeight: 700, color: '#ffffff', align: 'center', direction: 'ltr', opacity: 1, glow: true,
    start: 0, end: 3, easing: 'easeOutQuart',
    entrance: { type: 'fade', duration: 0.5, easing: 'easeOutCubic', delay: 0 },
    exit: { type: 'fade', duration: 0.4, easing: 'easeInQuad', delay: 0 }, ...over };
}

function logoReveal(scene, ctx) {
  const dur = scene.duration;
  return { ...scene, elements: [
    particles({ color: ctx.accent, accentColor: ctx.brand.secondary, count: ctx.quality === 'cinematic' ? 100 : 65, intensity: 0.9, start: 0, end: dur }),
    shape({ shape: 'line', x: 0.5, y: 0.62, width: 260, height: 3, color: ctx.accent, glow: true, start: 0.8, end: dur - 0.3, drawProgress: true }),
    text({ content: ctx.brand.name.toUpperCase(), x: 0.5, y: 0.5, fontSize: 168, fontWeight: 700, letterSpacing: 6, glow: true, start: 0.2, end: dur - 0.3, entrance: { type: 'scale', duration: 0.9, easing: 'easeOutBack', delay: 0.15 } }),
    text({ content: ctx.subtitle || 'A new standard', x: 0.5, y: 0.68, fontSize: 40, fontWeight: 400, color: 'rgba(255,255,255,0.72)', letterSpacing: 4, start: 1.0, end: dur - 0.3, entrance: { type: 'fade', duration: 0.8, easing: 'easeOutCubic', delay: 0.3 } }),
  ]};
}
function kineticHeadline(scene, ctx) {
  const dur = scene.duration;
  const els = [
    particles({ color: ctx.accent, accentColor: ctx.brand.secondary, count: 45, intensity: 0.5, start: 0, end: dur }),
    shape({ shape: 'rect', x: 0.12, y: 0.42, width: 6, height: 200, color: ctx.accent, radius: 3, glow: true, start: 0.1, end: dur - 0.2, entrance: { type: 'slideDown', duration: 0.7, easing: 'easeOutCubic', delay: 0 } }),
    text({ content: ctx.title, x: 0.16, y: 0.44, align: 'left', fontSize: 130, lineHeight: 1.02, start: 0.25, end: dur - 0.25, entrance: { type: 'slideUp', duration: 0.8, easing: 'easeOutCubic', delay: 0.1 } }),
  ];
  if (ctx.subtitle) els.push(text({ content: ctx.subtitle, x: 0.16, y: 0.68, align: 'left', fontSize: 44, fontWeight: 400, color: 'rgba(255,255,255,0.72)', start: 0.7, end: dur - 0.25, entrance: { type: 'slideUp', duration: 0.7, easing: 'easeOutCubic', delay: 0.2 } }));
  return { ...scene, elements: els };
}
function productShowcase(scene, ctx) {
  const dur = scene.duration;
  const els = [
    particles({ color: ctx.accent, accentColor: ctx.brand.secondary, count: 75, intensity: 0.7, start: 0, end: dur }),
    shape({ shape: 'circle', x: 0.34, y: 0.5, width: 420, height: 420, color: ctx.accent, fill: false, strokeWidth: 2, glow: true, start: 0.1, end: dur - 0.2, entrance: { type: 'scale', duration: 1.0, easing: 'easeOutCubic', delay: 0 } }),
    shape({ shape: 'rect', x: 0.34, y: 0.5, width: 180, height: 240, color: ctx.accent, fill: true, radius: 24, glow: true, start: 0.3, end: dur - 0.2, entrance: { type: 'scale', duration: 0.9, easing: 'easeOutBack', delay: 0.1 } }),
    text({ content: ctx.title, x: 0.62, y: 0.42, align: 'left', fontSize: 104, lineHeight: 1.05, start: 0.55, end: dur - 0.2, entrance: { type: 'slideRight', duration: 0.7, easing: 'easeOutCubic', delay: 0 } }),
  ];
  if (ctx.subtitle) els.push(text({ content: ctx.subtitle, x: 0.62, y: 0.62, align: 'left', fontSize: 40, fontWeight: 400, color: 'rgba(255,255,255,0.72)', start: 0.85, end: dur - 0.2, entrance: { type: 'slideRight', duration: 0.7, easing: 'easeOutCubic', delay: 0.15 } }));
  return { ...scene, elements: els };
}
function animatedStats(scene, ctx) {
  const dur = scene.duration;
  const stats = ctx.stats || [
    { label: 'Retention', value: '94%' }, { label: 'Growth', value: '3.2×' }, { label: 'Latency', value: '12ms' },
  ];
  const els = [
    particles({ color: ctx.accent, accentColor: ctx.brand.secondary, count: 35, intensity: 0.35, start: 0, end: dur }),
    text({ content: ctx.title, x: 0.5, y: 0.22, fontSize: 78, start: 0.1, end: dur - 0.2 }),
  ];
  const gap = 0.9 / stats.length;
  stats.slice(0, 4).forEach((st, i) => {
    const x = 0.05 + gap * (i + 0.5) + i * 0.02;
    // Try to detect a numeric value for the counter
    const numMatch = String(st.value).match(/([\d.,]+)/);
    if (numMatch) {
      const raw = parseFloat(numMatch[1].replace(/,/g, ''));
      const prefix = st.value.slice(0, numMatch.index);
      const suffix = st.value.slice(numMatch.index + numMatch[1].length);
      els.push(counter({
        x, y: 0.55, from: 0, to: raw, prefix, suffix, fontSize: 128, color: ctx.accent,
        start: 0.5 + i * 0.12, end: dur - 0.2,
        entrance: { type: 'slideUp', duration: 0.8, easing: 'easeOutBack', delay: 0 },
      }));
    } else {
      els.push(text({ content: st.value, x, y: 0.55, fontSize: 128, color: ctx.accent, glow: true, start: 0.5 + i * 0.12, end: dur - 0.2, entrance: { type: 'slideUp', duration: 0.8, easing: 'easeOutBack', delay: 0 } }));
    }
    els.push(text({ content: st.label, x, y: 0.72, fontSize: 30, fontWeight: 500, color: 'rgba(255,255,255,0.62)', letterSpacing: 2, start: 0.65 + i * 0.12, end: dur - 0.2, entrance: { type: 'fade', duration: 0.6, easing: 'easeOutCubic', delay: 0.1 } }));
  });
  return { ...scene, elements: els };
}
function featureGrid(scene, ctx) {
  const dur = scene.duration;
  const items = (ctx.bullets && ctx.bullets.length) ? ctx.bullets : ['Fast', 'Precise', 'Composable', 'Realtime'];
  const els = [
    particles({ color: ctx.accent, accentColor: ctx.brand.secondary, count: 30, intensity: 0.3, start: 0, end: dur }),
    text({ content: ctx.title, x: 0.5, y: 0.16, fontSize: 72, start: 0.05, end: dur - 0.2 }),
  ];
  const cols = 2, rows = Math.ceil(items.length / cols);
  items.forEach((it, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = 0.28 + col * 0.44;
    const y = 0.36 + (row * 0.5) / Math.max(1, rows - 1) * 0.6;
    els.push(shape({ shape: 'rect', x, y: y + 0.06, width: 320, height: 140, color: ctx.accent, fill: false, radius: 14, strokeWidth: 1.5, opacity: 0.55, start: 0.3 + i * 0.1, end: dur - 0.2 }));
    els.push(text({ content: it, x, y: y - 0.02, fontSize: 40, fontWeight: 600, start: 0.35 + i * 0.1, end: dur - 0.2, entrance: { type: 'slideUp', duration: 0.6, easing: 'easeOutCubic', delay: 0.05 } }));
  });
  return { ...scene, elements: els };
}
function processSteps(scene, ctx) {
  const dur = scene.duration;
  const steps = (ctx.bullets && ctx.bullets.length) ? ctx.bullets.slice(0, 4) : ['Describe', 'Generate', 'Refine', 'Export'];
  const els = [
    particles({ color: ctx.accent, accentColor: ctx.brand.secondary, count: 25, intensity: 0.3, start: 0, end: dur }),
    text({ content: ctx.title, x: 0.5, y: 0.18, fontSize: 68, start: 0.05, end: dur - 0.2 }),
    shape({ shape: 'line', x: 0.5, y: 0.5, width: 1400, height: 2, color: ctx.accent, glow: true, start: 0.3, end: dur - 0.2, drawProgress: true, entrance: { type: 'fade', duration: 0.3, easing: 'linear', delay: 0 } }),
  ];
  const gap = 1 / (steps.length + 1);
  steps.forEach((s, i) => {
    const x = gap * (i + 1);
    els.push(text({ content: String(i + 1).padStart(2, '0'), x, y: 0.42, fontSize: 64, color: ctx.accent, glow: true, start: 0.5 + i * 0.15, end: dur - 0.2, entrance: { type: 'scale', duration: 0.6, easing: 'easeOutBack', delay: 0 } }));
    els.push(text({ content: s, x, y: 0.58, fontSize: 30, fontWeight: 500, color: 'rgba(255,255,255,0.82)', start: 0.65 + i * 0.15, end: dur - 0.2, entrance: { type: 'slideUp', duration: 0.5, easing: 'easeOutCubic', delay: 0.05 } }));
  });
  return { ...scene, elements: els };
}
function callToAction(scene, ctx) {
  const dur = scene.duration;
  return { ...scene, elements: [
    particles({ color: ctx.accent, accentColor: ctx.brand.secondary, count: 60, intensity: 0.65, start: 0, end: dur }),
    text({ content: ctx.title, x: 0.5, y: 0.44, fontSize: 140, start: 0.1, end: dur - 0.2, entrance: { type: 'scale', duration: 0.9, easing: 'easeOutBack', delay: 0.05 } }),
    shape({ shape: 'rect', x: 0.5, y: 0.62, width: 320, height: 76, color: ctx.accent, fill: true, radius: 38, glow: true, start: 0.7, end: dur - 0.2, entrance: { type: 'slideUp', duration: 0.7, easing: 'easeOutCubic', delay: 0 } }),
    text({ content: ctx.cta, x: 0.5, y: 0.62, fontSize: 34, fontWeight: 600, color: '#0b0d10', start: 0.85, end: dur - 0.2, entrance: { type: 'fade', duration: 0.5, easing: 'easeOutCubic', delay: 0 } }),
  ]};
}
function quoteCard(scene, ctx) {
  const dur = scene.duration;
  const els = [
    shape({ shape: 'line', x: 0.5, y: 0.36, width: 120, height: 2, color: ctx.accent, glow: true, start: 0.1, end: dur - 0.2, drawProgress: true, entrance: { type: 'fade', duration: 0.2, easing: 'linear', delay: 0 } }),
    text({ content: '“' + ctx.title + '”', x: 0.5, y: 0.52, fontSize: 88, fontWeight: 500, lineHeight: 1.15, start: 0.3, end: dur - 0.2, entrance: { type: 'maskUp', duration: 1.0, easing: 'easeOutCubic', delay: 0 } }),
  ];
  if (ctx.subtitle) els.push(text({ content: '— ' + ctx.subtitle, x: 0.5, y: 0.74, fontSize: 30, fontWeight: 500, color: 'rgba(255,255,255,0.55)', letterSpacing: 2, start: 0.9, end: dur - 0.2, entrance: { type: 'fade', duration: 0.6, easing: 'easeOutCubic', delay: 0 } }));
  return { ...scene, elements: els };
}
