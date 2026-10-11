import { makeScene } from './templates.js';

export const defaultBrand = {
  name: 'MotionForge', accent: '#ff8a3d', secondary: '#8b6dff',
  text: '#ffffff', background: '#0b0d10', fontFamily: '"Space Grotesk"',
};
export const ASPECT_DIMS = {
  '16:9': { w: 1920, h: 1080 }, '9:16': { w: 1080, h: 1920 },
  '1:1':  { w: 1080, h: 1080 }, '4:5':  { w: 1080, h: 1350 },
};

function analyze(prompt) {
  const p = String(prompt).toLowerCase();
  return {
    hasStats: /(stat|metric|number|%|data|growth|kpi|analytics)/.test(p),
    hasProcess: /(step|process|how it works|workflow|pipeline|guide)/.test(p),
    hasFeatures: /(feature|why|benefit|capab|advantage)/.test(p),
    hasQuote: /(quote|testimonial|editorial|magazine)/.test(p),
    hasProduct: /(product|device|app|coffee|shoe|bottle|watch|brand)/.test(p),
    isLaunch: /(launch|release|announce|premiere)/.test(p),
    isSocial: /(social|reel|tiktok|instagram|short|vertical)/.test(p),
    isExplainer: /(explain|saas|tutorial|walkthrough|demo)/.test(p),
    isBrand: /(logo|brand|identity|wordmark|reveal)/.test(p),
  };
}
function extractHeadline(prompt) {
  const trimmed = String(prompt || '').trim();
  if (!trimmed) return null;
  const cleaned = trimmed
    .replace(/^(create|make|build|generate|design|produce)\s+(a|an|the)?\s*/i, '')
    .replace(/^(video|animation|motion graphics|reel|short)\s+(about|for|of)\s*/i, '')
    .replace(/[.?!].*$/, '').trim();
  const words = cleaned.split(/\s+/).slice(0, 6).join(' ');
  return words || null;
}

export function buildBrief(input) {
  const intent = analyze(input.prompt);
  const title = extractHeadline(input.prompt) || 'Your idea, in motion';
  const purpose = intent.isLaunch ? 'Product launch' : intent.isExplainer ? 'Explainer'
    : intent.isBrand ? 'Brand reveal' : intent.isSocial ? 'Social promotion' : 'Brand film';
  const tone = intent.isLaunch ? 'Cinematic, confident, precise'
    : intent.isExplainer ? 'Clear, calm, professional'
    : intent.isBrand ? 'Elegant, minimal' : 'Warm, direct, modern';
  return {
    concept: input.prompt.trim() || 'A concise motion graphics story',
    audience: 'Modern digital audience', purpose, keyMessage: title, tone,
    palette: [input.brand.accent, input.brand.secondary, input.brand.background, '#ffffff'],
    style: input.quality === 'cinematic' ? 'Cinematic, high-contrast, controlled glow'
      : input.quality === 'social' ? 'Fast, high energy, punchy' : 'Editorial, precise, professional',
    sceneCount: input.sceneCount, duration: input.duration, aspect: input.aspect,
    quality: input.quality, language: input.language,
    callToAction: intent.isLaunch ? 'Get started' : 'Learn more', title, source: 'template',
  };
}

export function generateStoryboard(brief, brand) {
  const intent = analyze(brief.concept);
  const total = brief.duration;
  const sceneCount = Math.max(3, Math.min(8, brief.sceneCount));
  const weights = buildWeights(intent, sceneCount);
  const sum = weights.reduce((a, b) => a + b.weight, 0);
  const durations = weights.map(w => round2((w.weight / sum) * total));
  const drift = round2(total - durations.reduce((a, b) => a + b, 0));
  durations[durations.length - 1] = round2(durations[durations.length - 1] + drift);
  const dims = ASPECT_DIMS[brief.aspect];
  const scenes = weights.map((w, i) => {
    const transition = i === weights.length - 1 ? 'none' : pickTransition(i);
    const cam = brief.quality === 'cinematic' ? 0.35 : brief.quality === 'social' ? 0.15 : 0.25;
    return makeScene(w.template, durations[i], backgroundFor(i, brand), brand.accent, brand, brief.quality, transition, cam, {
      title: sceneTitleFor(w.template, brief),
      subtitle: sceneSubtitleFor(w.template, brief),
      bullets: intent.hasFeatures ? ['Precision', 'Speed', 'Clarity', 'Control'] : undefined,
      stats: intent.hasStats ? [
        { label: 'Faster', value: '12×' }, { label: 'Retention', value: '+64%' }, { label: 'Edits', value: '∞' },
      ] : undefined,
      cta: brief.callToAction,
    });
  });
  return { version: 1, width: dims.w, height: dims.h, fps: 30, quality: brief.quality, scenes };
}

function buildWeights(intent, count) {
  const seq = [intent.isBrand ? 'logoReveal' : 'kineticHeadline'];
  const pool = [];
  if (intent.hasProduct) pool.push('productShowcase');
  if (intent.hasStats) pool.push('animatedStats');
  if (intent.hasProcess) pool.push('processSteps');
  if (intent.hasFeatures || pool.length === 0) pool.push('featureGrid');
  if (intent.hasQuote) pool.push('quoteCard');
  if (pool.length === 0) pool.push('kineticHeadline');
  for (let i = 0; i < count - 2; i++) seq.push(pool[i % pool.length]);
  seq.push(intent.isBrand ? 'logoReveal' : 'callToAction');
  const weights = { logoReveal: 1.0, kineticHeadline: 0.9, productShowcase: 1.1, animatedStats: 1.1, featureGrid: 1.0, processSteps: 1.2, callToAction: 0.8, quoteCard: 1.0 };
  return seq.map(t => ({ template: t, weight: weights[t] }));
}
const TRANSITIONS = ['fade', 'slide', 'wipe', 'zoom'];
const pickTransition = i => TRANSITIONS[i % TRANSITIONS.length];
function backgroundFor(i, brand) {
  const palettes = ['#0b0d10', '#101319', '#0f1216', '#131018'];
  return i === 0 ? brand.background : palettes[i % palettes.length];
}
function sceneTitleFor(template, brief) {
  const t = brief.title;
  switch (template) {
    case 'logoReveal': return brief.concept.split(/[.!?]/)[0].slice(0, 60) || t;
    case 'kineticHeadline': return t;
    case 'productShowcase': return t;
    case 'animatedStats': return 'By the numbers';
    case 'featureGrid': return 'What sets it apart';
    case 'processSteps': return 'How it works';
    case 'callToAction': return brief.callToAction || 'Get started';
    case 'quoteCard': return t;
    default: return t;
  }
}
function sceneSubtitleFor(template, brief) {
  switch (template) {
    case 'logoReveal': return brief.purpose;
    case 'kineticHeadline': return brief.keyMessage;
    case 'productShowcase': return brief.tone;
    case 'callToAction': return brief.keyMessage;
    case 'quoteCard': return brief.purpose;
    default: return '';
  }
}
const round2 = n => Math.round(n * 100) / 100;
