#!/usr/bin/env node
/**
 * MotionForge AI — Director patch
 * Makes the local engine actually understand prompts and apply the doctrine.
 *
 * Run from the motionforge-ai project root:
 *   node patch-director.js
 *   node patch-director.js --push     (also git commit + push)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUSH = process.argv.includes('--push');
const ROOT = process.cwd();

if (!fs.existsSync(path.join(ROOT, 'index.html')) || !fs.existsSync(path.join(ROOT, 'config.js'))) {
  console.error('Run this from the motionforge-ai project root.');
  process.exit(1);
}

const C = { r:'\x1b[0m', d:'\x1b[2m', b:'\x1b[1m', a:'\x1b[38;5;215m', g:'\x1b[38;5;114m', y:'\x1b[38;5;245m' };
const ok = s => console.log(`  \x1b[38;5;114m✓\x1b[0m ${s}`);

const F = {};

/* ═══════════════════════════════════════════════════════════════════
   1. director-analysis.js — real prompt understanding
   ═══════════════════════════════════════════════════════════════════ */
F['assets/js/ai/director-analysis.js'] = `/**
 * Director Analysis
 *
 * Extracts structured creative intent from a user prompt — brand name,
 * product category, tone, audience, CTA, palette hints. Used by both the
 * local engine (to build rich scene plans without an AI key) and by AI
 * providers (to enrich the user message with clean signals).
 */

const CATEGORY_SIGNALS = [
  ['coffee',      /(coffee|caf[ée]|espresso|latte|roast|brew|barista|bean)/i],
  ['restaurant',  /(restaurant|bistro|kitchen|chef|menu|dining|eatery|food|pizza|sushi|burger)/i],
  ['sneaker',     /(sneaker|shoe|kick|trainer|footwear|running shoe|dunk|jordan)/i],
  ['fashion',     /(fashion|clothing|apparel|collection|lookbook|style|wear|couture)/i],
  ['saas',        /(saas|platform|software|dashboard|analytics|workflow|api|b2b|enterprise)/i],
  ['fintech',     /(fintech|bank|payment|wallet|finance|trading|investment|crypto|loan)/i],
  ['fitness',     /(fitness|gym|workout|training|athletic|yoga|pilates|sport)/i],
  ['realestate',  /(real estate|property|apartment|home|housing|listing|condo|villa)/i],
  ['beauty',      /(beauty|cosmetic|skincare|makeup|fragrance|spa|perfume)/i],
  ['tech',        /(tech|device|gadget|hardware|robot|drone|wearable)/i],
  ['travel',      /(travel|hotel|resort|destination|flight|tour|airbnb|villa)/i],
  ['education',   /(course|education|learn|tutorial|school|academy|bootcamp)/i],
  ['event',       /(event|conference|festival|concert|summit|meetup|launch party)/i],
  ['music',       /(music|album|track|song|artist|band|dj|label)/i],
  ['agency',      /(agency|studio|creative|design|branding|consultancy)/i],
];

const TONE_SIGNALS = [
  ['cinematic',  /(cinematic|film|filmic|dramatic|atmospheric|moody|noir|epic)/i],
  ['punchy',     /(punchy|fast|high[- ]?energy|bold|aggressive|hyped|explosive|kinetic)/i],
  ['elegant',    /(elegant|refined|sophisticated|luxurious|premium|classy|minimal|understated)/i],
  ['technical',  /(technical|precise|engineered|grid|systematic|industrial|blueprint|spec)/i],
  ['warm',       /(warm|cozy|inviting|friendly|artisanal|handcrafted|organic|rustic)/i],
  ['playful',    /(playful|fun|quirky|vibrant|youthful|energetic)/i],
  ['editorial',  /(editorial|magazine|clean|typographic|swiss|helvetica)/i],
];

const TONE_COPY = {
  cinematic:  { opener: 'A cinematic reveal for', verb: 'Watch', closing: 'Experience it.' },
  punchy:     { opener: 'A high-energy drop for', verb: 'Get', closing: 'Don\\'t miss it.' },
  elegant:    { opener: 'A refined introduction to', verb: 'Discover', closing: 'Elevate every moment.' },
  technical:  { opener: 'A precise look at', verb: 'See how it works.', closing: 'Built for people who care.' },
  warm:       { opener: 'A warm welcome to', verb: 'Come see', closing: 'Made with care.' },
  playful:    { opener: 'A fresh take on', verb: 'Meet', closing: 'Say hello.' },
  editorial:  { opener: 'An editorial feature on', verb: 'Read the story.', closing: 'The details matter.' },
};

const CATEGORY_LIBRARY = {
  coffee: {
    tone: 'warm',
    palette: ['#1a0f08', '#2a1810', '#ff8a3d'],
    tagline: 'Coffee, the way it should be.',
    product: 'Every cup, crafted',
    productSub: 'From bean to pour, nothing rushed',
    bullets: ['Single-origin beans', 'Hand-roasted daily', 'Small-batch only', 'Poured with intent'],
    stats: [
      { label: 'Origins', value: '6' },
      { label: 'Roast', value: '14d' },
      { label: 'Cups/day', value: '400+' },
    ],
    cta: { headline: 'Visit us', button: 'Find your nearest' },
    secondary: 'Roasted fresh. Poured with care.',
  },
  restaurant: {
    tone: 'warm',
    palette: ['#0f0a06', '#1e1410', '#ff8a3d'],
    tagline: 'Where every plate tells a story.',
    product: 'The kitchen, live',
    productSub: 'Seasonal ingredients, honest cooking',
    bullets: ['Seasonal menu', 'Locally sourced', 'Handmade daily', 'Open kitchen'],
    stats: [
      { label: 'Dishes', value: '24' },
      { label: 'Local farms', value: '9' },
      { label: 'Since', value: '2018' },
    ],
    cta: { headline: 'Reserve a table', button: 'Book tonight' },
    secondary: 'Come hungry. Leave happy.',
  },
  sneaker: {
    tone: 'punchy',
    palette: ['#050608', '#14171d', '#ff8a3d'],
    tagline: 'Built for the streets.',
    product: 'The new silhouette',
    productSub: 'Engineered for movement, made for the culture',
    bullets: ['Feather-light', 'All-day grip', 'Cushioned drop', 'Iconic profile'],
    stats: [
      { label: 'Weight', value: '240g' },
      { label: 'Drop', value: '8mm' },
      { label: 'Colorways', value: '4' },
    ],
    cta: { headline: 'Drop date', button: 'Get notified' },
    secondary: 'Limited run. No restock.',
  },
  fashion: {
    tone: 'elegant',
    palette: ['#0a0807', '#181410', '#d4b48f'],
    tagline: 'Wear the season.',
    product: 'The collection',
    productSub: 'Cut for real bodies. Made for real life.',
    bullets: ['Tailored fit', 'Natural fabrics', 'Small batches', 'Made to last'],
    stats: [
      { label: 'Pieces', value: '32' },
      { label: 'Palette', value: '5' },
      { label: 'Season', value: 'SS26' },
    ],
    cta: { headline: 'Shop the collection', button: 'Explore now' },
    secondary: 'Crafted for the everyday.',
  },
  saas: {
    tone: 'technical',
    palette: ['#050608', '#0f1419', '#8b6dff'],
    tagline: 'The intelligence behind the work.',
    product: 'See the platform',
    productSub: 'Everything your team needs. Nothing it doesn\\'t.',
    bullets: ['Real-time sync', 'Instant search', 'Zero config', 'Built-in audit'],
    stats: [
      { label: 'Uptime', value: '99.99%' },
      { label: 'Latency', value: '12ms' },
      { label: 'Teams', value: '4k+' },
    ],
    cta: { headline: 'Start free', button: 'Open the studio' },
    secondary: 'No credit card. Cancel anytime.',
  },
  fintech: {
    tone: 'technical',
    palette: ['#050608', '#0a0f15', '#3dd6a0'],
    tagline: 'Money, without the friction.',
    product: 'The new standard',
    productSub: 'Built for how you actually move money',
    bullets: ['Instant transfers', 'Zero hidden fees', 'Bank-grade security', 'Global coverage'],
    stats: [
      { label: 'Countries', value: '42' },
      { label: 'Transfer time', value: '<1s' },
      { label: 'Fees', value: '0%' },
    ],
    cta: { headline: 'Open an account', button: 'Get started' },
    secondary: 'Regulated. Insured. Fast.',
  },
  fitness: {
    tone: 'punchy',
    palette: ['#07080a', '#12161c', '#ff8a3d'],
    tagline: 'Built to be stronger.',
    product: 'The workout',
    productSub: 'Train with intent. Recover with purpose.',
    bullets: ['Coach-led', 'All levels', 'Open 24/7', 'Track everything'],
    stats: [
      { label: 'Members', value: '2k+' },
      { label: 'Classes/wk', value: '48' },
      { label: 'Locations', value: '3' },
    ],
    cta: { headline: 'Start today', button: 'Claim free week' },
    secondary: 'Your first week is on us.',
  },
  realestate: {
    tone: 'elegant',
    palette: ['#08090a', '#141414', '#c9a961'],
    tagline: 'Where you come home to.',
    product: 'The residence',
    productSub: 'Designed for living. Built for life.',
    bullets: ['Smart-home ready', 'Concierge', 'Private parking', 'Rooftop garden'],
    stats: [
      { label: 'Units', value: '48' },
      { label: 'Floors', value: '12' },
      { label: 'From', value: '$340k' },
    ],
    cta: { headline: 'Book a viewing', button: 'Schedule now' },
    secondary: 'Now selling.',
  },
  beauty: {
    tone: 'elegant',
    palette: ['#0a0807', '#1a1216', '#e8b4b8'],
    tagline: 'Your skin, elevated.',
    product: 'The ritual',
    productSub: 'Clean formulas. Visible results.',
    bullets: ['Cruelty-free', 'Dermatologist-tested', 'Clean ingredients', 'Refillable'],
    stats: [
      { label: 'Results in', value: '14d' },
      { label: 'Ingredients', value: '100% clean' },
      { label: 'Reviews', value: '4.9/5' },
    ],
    cta: { headline: 'Shop the ritual', button: 'Discover' },
    secondary: 'Glow, refined.',
  },
  tech: {
    tone: 'technical',
    palette: ['#050608', '#0f1216', '#8b6dff'],
    tagline: 'Engineered to disappear.',
    product: 'The device',
    productSub: 'Precision in every detail',
    bullets: ['Ultra-portable', 'All-day battery', 'Premium materials', 'Instant pairing'],
    stats: [
      { label: 'Weight', value: '189g' },
      { label: 'Battery', value: '22h' },
      { label: 'Colors', value: '3' },
    ],
    cta: { headline: 'Order now', button: 'Pre-order' },
    secondary: 'Ships in 7 days.',
  },
  travel: {
    tone: 'cinematic',
    palette: ['#050810', '#0a1220', '#ffb066'],
    tagline: 'Somewhere worth going.',
    product: 'The destination',
    productSub: 'Perfectly placed. Unforgettable.',
    bullets: ['Ocean view', 'Private beach', 'Full service', 'Hidden gem'],
    stats: [
      { label: 'Rating', value: '5.0' },
      { label: 'Rooms', value: '32' },
      { label: 'From', value: '$180' },
    ],
    cta: { headline: 'Book your stay', button: 'Check dates' },
    secondary: 'A place you\\'ll remember.',
  },
  education: {
    tone: 'technical',
    palette: ['#050608', '#0f1419', '#8b6dff'],
    tagline: 'Learn something that lasts.',
    product: 'The course',
    productSub: 'Built by practitioners, not lecturers',
    bullets: ['Self-paced', 'Real projects', 'Lifetime access', 'Certificate'],
    stats: [
      { label: 'Lessons', value: '84' },
      { label: 'Hours', value: '12' },
      { label: 'Projects', value: '6' },
    ],
    cta: { headline: 'Enroll now', button: 'Start learning' },
    secondary: '30-day refund. No questions.',
  },
  event: {
    tone: 'punchy',
    palette: ['#050608', '#141018', '#ff8a3d'],
    tagline: 'Save the date.',
    product: 'The lineup',
    productSub: 'Two days. One stage. Zero filler.',
    bullets: ['Keynotes', 'Workshops', 'Networking', 'Afterparty'],
    stats: [
      { label: 'Speakers', value: '24' },
      { label: 'Days', value: '2' },
      { label: 'Attendees', value: '800' },
    ],
    cta: { headline: 'Get tickets', button: 'Register now' },
    secondary: 'Early bird ends soon.',
  },
  music: {
    tone: 'cinematic',
    palette: ['#050608', '#0f0f18', '#c4b5fd'],
    tagline: 'Turn it up.',
    product: 'The release',
    productSub: 'New single. Streaming everywhere.',
    bullets: ['Produced by', 'Mixed in-house', 'Mastered analog', 'Pressed on vinyl'],
    stats: [
      { label: 'Tracks', value: '12' },
      { label: 'Runtime', value: '48min' },
      { label: 'Release', value: 'Oct 24' },
    ],
    cta: { headline: 'Listen now', button: 'Stream' },
    secondary: 'Out everywhere.',
  },
  agency: {
    tone: 'editorial',
    palette: ['#08080a', '#131316', '#ff8a3d'],
    tagline: 'We build brands that move.',
    product: 'The work',
    productSub: 'Strategy, design, and motion under one roof',
    bullets: ['Brand systems', 'Motion design', 'Product films', 'Launch films'],
    stats: [
      { label: 'Projects', value: '180+' },
      { label: 'Clients', value: '42' },
      { label: 'Awards', value: '9' },
    ],
    cta: { headline: 'Start a project', button: 'Get in touch' },
    secondary: 'We take on 4 new clients per quarter.',
  },
  generic: {
    tone: 'cinematic',
    palette: ['#050608', '#0f1216', '#ff8a3d'],
    tagline: 'Made with intent.',
    product: 'What you get',
    productSub: 'Considered, crafted, ready.',
    bullets: ['Thoughtful', 'Precise', 'Composable', 'Realtime'],
    stats: [
      { label: 'Faster', value: '12×' },
      { label: 'Retention', value: '+64%' },
      { label: 'Edits', value: '∞' },
    ],
    cta: { headline: 'Get started', button: 'Begin' },
    secondary: 'Built for what comes next.',
  },
};

/* ─── Brand extraction ─── */
function extractBrand(prompt) {
  const p = prompt;

  // "called X" / "named X"
  let m = p.match(/(?:called|named|titled|for)\s+["'“”‘’]?([A-Za-z0-9][A-Za-z0-9\\s&'\\-]{1,30}?)["'“”‘’]?(?:\\s|$|[.,!?])/i);
  if (m && m[1]) return cleanBrand(m[1]);

  // Quoted
  m = p.match(/["'“”‘’]([^"'“”‘’]{1,30})["'“”‘’]/);
  if (m && m[1] && m[1].length < 30) return cleanBrand(m[1]);

  // ALL CAPS word >= 2 chars
  m = p.match(/\\b([A-Z][A-Z0-9]{1,15})\\b/);
  if (m) return m[1];

  // Title-case word(s) at start
  m = p.match(/^\\s*(?:an?|the)?\\s*(?:cinematic|punchy|elegant|kinetic|fast)?\\s*(?:video|ad|animation|promo|advertisement|reel|short)?\\s*(?:for|about)?\\s*([A-Z][a-zA-Z0-9]+(?:\\s+[A-Z][a-zA-Z0-9]+){0,2})/);
  if (m) return cleanBrand(m[1]);

  return null;
}
function cleanBrand(s) {
  return String(s).trim().replace(/[.,!?]+$/, '').slice(0, 28);
}

/* ─── Category detection ─── */
function detectCategory(prompt) {
  for (const [id, rx] of CATEGORY_SIGNALS) if (rx.test(prompt)) return id;
  return 'generic';
}

/* ─── Tone detection ─── */
function detectTone(prompt, category) {
  for (const [id, rx] of TONE_SIGNALS) if (rx.test(prompt)) return id;
  return (CATEGORY_LIBRARY[category] || CATEGORY_LIBRARY.generic).tone;
}

/* ─── Aspect hint ─── */
function detectAspect(prompt, fallback) {
  if (/(9:16|vertical|reel|tiktok|instagram story|youtube shorts|shorts)/i.test(prompt)) return '9:16';
  if (/(16:9|landscape|widescreen|youtube)/i.test(prompt)) return '16:9';
  if (/(1:1|square|feed post)/i.test(prompt)) return '1:1';
  if (/(4:5|portrait|instagram feed)/i.test(prompt)) return '4:5';
  return fallback;
}

/* ─── CTA detection ─── */
function detectCTA(prompt, category) {
  if (/(download|install)/i.test(prompt)) return 'Download now';
  if (/(shop|buy|order)/i.test(prompt)) return 'Shop now';
  if (/(sign ?up|register|join)/i.test(prompt)) return 'Sign up free';
  if (/(book|reserve|schedule)/i.test(prompt)) return 'Book now';
  if (/(visit|come|drop by)/i.test(prompt)) return 'Visit us';
  if (/(subscribe|follow)/i.test(prompt)) return 'Follow along';
  if (/(learn more|discover)/i.test(prompt)) return 'Learn more';
  return (CATEGORY_LIBRARY[category] || CATEGORY_LIBRARY.generic).cta.button;
}

/* ─── Main ─── */
export function analyzeUserPrompt(prompt, opts = {}) {
  const category = detectCategory(prompt);
  const lib = CATEGORY_LIBRARY[category] || CATEGORY_LIBRARY.generic;
  const tone = detectTone(prompt, category);
  const brand = extractBrand(prompt) || opts.brandName || 'Your Brand';
  const aspect = detectAspect(prompt, opts.aspect || '16:9');
  const cta = detectCTA(prompt, category);
  const toneCopy = TONE_COPY[tone] || TONE_COPY.cinematic;

  return {
    rawPrompt: prompt,
    brand,
    category,
    tone,
    toneCopy,
    aspect,
    cta,
    palette: lib.palette,
    tagline: lib.tagline,
    product: lib.product,
    productSub: lib.productSub,
    bullets: lib.bullets,
    stats: lib.stats,
    ctaScene: lib.cta,
    secondary: lib.secondary,
  };
}

export function getCategoryLibrary() { return CATEGORY_LIBRARY; }
`;

/* ═══════════════════════════════════════════════════════════════════
   2. storyboard.js — rewritten to use the analysis
   ═══════════════════════════════════════════════════════════════════ */
F['assets/js/engine/storyboard.js'] = `import { makeScene } from './templates.js';
import { analyzeUserPrompt } from '../ai/director-analysis.js';

export const defaultBrand = {
  name: 'MotionForge', accent: '#ff8a3d', secondary: '#8b6dff',
  text: '#ffffff', background: '#0b0d10', fontFamily: '"Space Grotesk"',
};
export const ASPECT_DIMS = {
  '16:9': { w: 1920, h: 1080 }, '9:16': { w: 1080, h: 1920 },
  '1:1':  { w: 1080, h: 1080 }, '4:5':  { w: 1080, h: 1350 },
};

/* ---------- Brief ---------- */
export function buildBrief(input) {
  const analysis = analyzeUserPrompt(input.prompt, {
    brandName: input.brand && input.brand.name,
    aspect: input.aspect,
  });

  return {
    concept: input.prompt.trim(),
    audience: 'Modern audience',
    purpose: purposeFor(analysis.category),
    keyMessage: analysis.tagline,
    tone: toneLabel(analysis.tone),
    palette: analysis.palette,
    style: styleFor(analysis.tone, input.quality),
    sceneCount: input.sceneCount,
    duration: input.duration,
    aspect: analysis.aspect || input.aspect,
    quality: input.quality,
    language: input.language,
    callToAction: analysis.cta,
    title: analysis.brand || extractTitleFromPrompt(input.prompt),
    brand: analysis.brand,
    category: analysis.category,
    source: 'template',
    analysis,
  };
}

function purposeFor(cat) {
  return ({
    coffee: 'Coffee shop promotion',
    restaurant: 'Restaurant promotion',
    sneaker: 'Product drop',
    fashion: 'Collection launch',
    saas: 'Product launch',
    fintech: 'Product launch',
    fitness: 'Gym promotion',
    realestate: 'Property showcase',
    beauty: 'Product launch',
    tech: 'Product launch',
    travel: 'Destination promo',
    education: 'Course promo',
    event: 'Event promotion',
    music: 'Release promo',
    agency: 'Agency reel',
    generic: 'Brand film',
  })[cat] || 'Brand film';
}

function toneLabel(t) {
  return ({
    cinematic: 'Cinematic, controlled, atmospheric',
    punchy: 'High-energy, punchy, kinetic',
    elegant: 'Elegant, refined, minimal',
    technical: 'Technical, precise, engineered',
    warm: 'Warm, inviting, artisanal',
    playful: 'Playful, vibrant, youthful',
    editorial: 'Editorial, typographic, clean',
  })[t] || 'Cinematic';
}

function styleFor(t, quality) {
  const base = ({
    cinematic: 'Dark, high-contrast, cinematic',
    punchy: 'Fast, high-contrast, kinetic',
    elegant: 'Clean, minimal, editorial',
    technical: 'Grid-based, systematic, cold',
    warm: 'Warm, amber, artisanal',
    playful: 'Vibrant, bold, energetic',
    editorial: 'Swiss, typographic, precise',
  })[t] || 'Cinematic';
  return base + ' · ' + quality;
}

function extractTitleFromPrompt(prompt) {
  const trimmed = prompt.trim();
  const cleaned = trimmed
    .replace(/^(create|make|build|generate|design|produce)\\s+(a|an|the)?\\s*/i, '')
    .replace(/^(video|animation|motion graphics|reel|short|ad|advertisement|promo)\\s+(about|for|of)\\s*/i, '')
    .replace(/[.?!].*$/, '').trim();
  return cleaned.split(/\\s+/).slice(0, 6).join(' ') || 'Untitled';
}

/* ---------- Storyboard (local engine) ----------
   Uses director analysis to produce a real, per-scene plan that reflects
   the doctrine: signal → demo → proof → CTA, with doctrine-driven pacing,
   transitions, and per-scene copy shaped for the product category.
   ---------------------------------------------------------------- */
export function generateStoryboard(brief, brand) {
  const a = brief.analysis || analyzeUserPrompt(brief.concept, { brandName: brand && brand.name });
  const total = brief.duration;
  const sceneCount = Math.max(3, Math.min(8, brief.sceneCount));
  const dims = ASPECT_DIMS[brief.aspect] || ASPECT_DIMS['16:9'];

  // Build the sequence: reveal → demo(s) → proof → CTA
  const sequence = composeSequence(a, sceneCount);
  const durations = distributeTime(total, sequence);
  const transitions = pickTransitions(sequence.length);

  const scenes = sequence.map((step, i) => {
    const duration = durations[i];
    const template = step.template;
    const transition = transitions[i];
    const cam = camFor(brief.quality, step.role);
    const bg = backgroundFor(i, brand, a);

    return makeScene(
      template,
      duration,
      bg,
      brand.accent,
      brand,
      brief.quality,
      transition,
      cam,
      {
        title: step.title,
        subtitle: step.subtitle,
        bullets: step.bullets,
        stats: step.stats,
        cta: step.cta,
      }
    );
  });

  return {
    version: 1,
    width: dims.w,
    height: dims.h,
    fps: 30,
    quality: brief.quality,
    scenes,
  };
}

/* Sequence composer — this is where the doctrine shows up */
function composeSequence(a, count) {
  const steps = [];

  // 1. Brand signal / reveal (always)
  steps.push({
    role: 'reveal',
    template: a.category === 'saas' || a.category === 'fintech' ? 'kineticHeadline' : 'logoReveal',
    title: a.brand,
    subtitle: a.tagline,
    bullets: null,
    stats: null,
    cta: null,
  });

  // 2. Product showcase (most categories)
  if (count >= 3) {
    steps.push({
      role: 'demo',
      template: 'productShowcase',
      title: a.product,
      subtitle: a.productSub,
      bullets: null,
      stats: null,
      cta: null,
    });
  }

  // 3. Proof — pick based on remaining budget and category
  const remaining = count - steps.length - 1; // -1 for CTA
  if (remaining > 0) {
    if (a.stats && a.stats.length) {
      steps.push({
        role: 'proof',
        template: 'animatedStats',
        title: a.proofTitle || 'By the numbers',
        subtitle: '',
        bullets: null,
        stats: a.stats,
        cta: null,
      });
    }
  }
  if (remaining > 1) {
    steps.push({
      role: 'proof',
      template: 'featureGrid',
      title: a.featuresTitle || 'What makes it different',
      subtitle: '',
      bullets: a.bullets,
      stats: null,
      cta: null,
    });
  }
  if (remaining > 2) {
    steps.push({
      role: 'story',
      template: 'processSteps',
      title: a.processTitle || 'How it works',
      subtitle: '',
      bullets: a.bullets ? a.bullets.slice(0, 4) : null,
      stats: null,
      cta: null,
    });
  }

  // Fill any leftover middle slots with a duplicate showcase but new copy
  while (steps.length < count - 1) {
    steps.splice(steps.length - 1, 0, {
      role: 'demo',
      template: 'productShowcase',
      title: a.secondary || a.product,
      subtitle: '',
      bullets: null,
      stats: null,
      cta: null,
    });
  }

  // Final CTA (always)
  steps.push({
    role: 'cta',
    template: 'callToAction',
    title: a.ctaScene.headline,
    subtitle: a.secondary,
    bullets: null,
    stats: null,
    cta: a.ctaScene.button,
  });

  return steps.slice(0, count);
}

/* Time distribution — doctrine: 15% reveal, 20% each demo, 10% CTA min */
function distributeTime(total, sequence) {
  const n = sequence.length;
  const weights = sequence.map(s => {
    if (s.role === 'reveal') return 1.15;
    if (s.role === 'cta')    return 0.85;
    if (s.role === 'proof')  return 1.05;
    return 1.10;
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map(w => (w / sum) * total);
  const rounded = raw.map(v => Math.round(v * 100) / 100);
  const drift = Math.round((total - rounded.reduce((a, b) => a + b, 0)) * 100) / 100;
  rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + drift) * 100) / 100;
  return rounded;
}

/* Transitions — doctrine: motivated, varied, never generic crossfade */
function pickTransitions(n) {
  const ordered = ['fade', 'wipe', 'slide', 'zoom', 'fade', 'wipe', 'slide'];
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(i === n - 1 ? 'none' : ordered[i % ordered.length]);
  }
  return out;
}

function camFor(quality, role) {
  const base = quality === 'cinematic' ? 0.35 : quality === 'social' ? 0.15 : 0.25;
  if (role === 'reveal') return base * 1.2;
  if (role === 'cta') return base * 0.9;
  return base;
}

function backgroundFor(i, brand, a) {
  // First scene uses brand background; subsequent scenes shift hue slightly for pacing
  const shift = ['#0b0d10', '#101319', '#0f1216', '#131018', '#0d0f14'];
  if (i === 0) return brand.background || '#0b0d10';
  return shift[i % shift.length];
}
`;

/* ═══════════════════════════════════════════════════════════════════
   3. creative-director.js — enriched system directive
   ═══════════════════════════════════════════════════════════════════ */
F['assets/js/ai/creative-director.js'] = `/**
 * Creative Director Directive
 *
 * The Baqalati master prompt transformed into a reusable internal creative
 * specification, parameterized by the subscriber's actual idea.
 *
 * The user's prompt supplies the CONTENT. This directive supplies the CRAFT.
 */

import { analyzeUserPrompt } from './director-analysis.js';

export function buildDirectorDirective(input) {
  const { aspect, duration, quality, language, brand, sceneCount, prompt } = input;

  // Extract structured signals from the user's prompt so the AI has clean context
  const a = analyzeUserPrompt(prompt, { brandName: brand && brand.name, aspect });
  const brandFromPrompt = a.brand;
  const category = a.category;
  const tone = a.tone;

  return [
    'You are an elite Motion Graphics Director, Creative Technologist, and senior Canvas/WebGL engineer.',
    '',
    'Given the subscriber\\'s specific idea below, return a structured scene plan for a ' + duration + '-second, ' + aspect + ' motion graphics composition.',
    '',
    'The output is a JSON object. Not a website. Not a storyboard PDF. Not a plan. An executable scene plan.',
    '',
    '══════════════════════════════════════════════════════════════',
    'CREATIVE DOCTRINE — the level of craft required',
    '══════════════════════════════════════════════════════════════',
    '',
    'Visual language:',
    '  • Dark, cinematic environment. High contrast. Selective lighting.',
    '  • Technical, code-driven aesthetic: fine grids, interface fragments,',
    '    terminal-style monospace details, geometric outlines, precise markings.',
    '  • Kinetic typography in short, deliberate bursts — never stationary cards.',
    '  • One accent color used as a controlled energy source, not blanket coverage.',
    '  • Rapid editorial cuts mixed with controlled slow moments.',
    '  • Camera-like zooms, perspective shifts, subtle parallax, layered depth.',
    '  • Elements that assemble, disassemble, and transform into one another.',
    '  • A feeling that the graphics are being constructed live, as if a system is coming online.',
    '',
    'What you must NOT produce:',
    '  • Static cards with text that just fade in.',
    '  • Every scene looking like the same UI pattern.',
    '  • Random effects with no relationship to the message.',
    '  • Excessive bounce or wobble.',
    '  • Screenshots, mock photos, or references to stock imagery.',
    '  • Continuously flashing the screen white.',
    '',
    'What you MUST produce:',
    '  • A continuous timeline, not seven independent slides.',
    '  • Motivated transitions — the outgoing element BECOMES the incoming element.',
    '  • Clear hierarchy at every moment: dominant message + supporting graphic + 1–2 small details.',
    '  • Motion that communicates the message.',
    '',
    '══════════════════════════════════════════════════════════════',
    'SCENE TEMPLATE VOCABULARY — you may only use these',
    '══════════════════════════════════════════════════════════════',
    '',
    '  "logoReveal"       — brand mark with particle field and glow',
    '  "kineticHeadline"  — bold typographic entrance with animated side rule',
    '  "productShowcase"  — silhouette + rotating ring + callout copy',
    '  "animatedStats"    — progressive counting statistics (2–4 metrics)',
    '  "featureGrid"      — 4–6 tiles with staggered entrance',
    '  "processSteps"     — numbered sequence with progressive line drawing',
    '  "callToAction"     — closing frame with CTA pill',
    '  "quoteCard"        — minimal typographic quote with masked reveal',
    '',
    'Do not invent new template ids.',
    '',
    '══════════════════════════════════════════════════════════════',
    'NARRATIVE ARC for a ' + sceneCount + '-scene composition',
    '══════════════════════════════════════════════════════════════',
    '',
    '  Scene 1:         Brand signal / identity reveal',
    '  Scenes 2..N-1:   Product demonstration — pick from middle templates based on what the idea needs',
    '  Scene N:         Call to action — closing message and CTA',
    '',
    'Every scene must have a purpose. Do not pad to hit a scene count.',
    '',
    '══════════════════════════════════════════════════════════════',
    'COPY RULES',
    '══════════════════════════════════════════════════════════════',
    '',
    'Headlines: 2–6 words. In the language of the subscriber\\'s idea.',
    'Supporting copy: one short line. Never a paragraph.',
    'Call to action: one clear verb phrase.',
    'Do not invent statistics. If the subscriber did not supply numbers, use',
    'placeholder-flavored language instead of fabricating false data.',
    'Do not claim features the prompt did not state.',
    language === 'ar' ? 'Arabic must be natural, connected, right-to-left. Never split Arabic letters.' : '',
    '',
    '══════════════════════════════════════════════════════════════',
    'BRAND CONTEXT (from subscriber)',
    '══════════════════════════════════════════════════════════════',
    '',
    'Brand name:        ' + brand.name,
    'Primary accent:    ' + brand.accent,
    'Secondary accent:  ' + brand.secondary,
    'Background:        ' + brand.background,
    'Text color:        ' + brand.text,
    'Font family:       ' + brand.fontFamily,
    'Quality tier:      ' + quality,
    '',
    '══════════════════════════════════════════════════════════════',
    'ANALYSIS OF THE SUBSCRIBER\\'S IDEA (extracted)',
    '══════════════════════════════════════════════════════════════',
    '',
    'Detected brand name:      ' + brandFromPrompt,
    'Detected category:        ' + category,
    'Detected tone:            ' + tone,
    'Suggested palette:        ' + a.palette.join(', '),
    'Suggested CTA:            ' + a.cta,
    '',
    'Use these signals. Refine and enrich them. Do not contradict them without reason.',
    '',
    '══════════════════════════════════════════════════════════════',
    'SUBSCRIBER\\'S IDEA',
    '══════════════════════════════════════════════════════════════',
    '',
    prompt,
    '',
    '══════════════════════════════════════════════════════════════',
    'OUTPUT CONTRACT — return ONLY this JSON, nothing else',
    '══════════════════════════════════════════════════════════════',
    '',
    '{',
    '  "title": string,',
    '  "audience": string,',
    '  "purpose": string,',
    '  "keyMessage": string,',
    '  "tone": string,',
    '  "style": string,',
    '  "callToAction": string,',
    '  "scenes": [',
    '    {',
    '      "template": "logoReveal" | "kineticHeadline" | "productShowcase" | "animatedStats" | "featureGrid" | "processSteps" | "callToAction" | "quoteCard",',
    '      "duration": number,',
    '      "name": string,',
    '      "headline": string,',
    '      "subtitle": string,',
    '      "bullets": string[],',
    '      "stats": [{ "label": string, "value": string }]',
    '    }',
    '  ]',
    '}',
    '',
    'Scene durations must sum EXACTLY to ' + duration + '. Return ' + sceneCount + ' scenes.',
    'No markdown. No code fences. No commentary. JSON only.',
    '',
    'For the idea "' + prompt.slice(0, 80) + (prompt.length > 80 ? '…' : '') + '", produce the plan now.',
  ].filter(Boolean).join('\\n');
}
`;

/* ═══════════════════════════════════════════════════════════════════
   4. AI providers — pass full analysis, use directive
   ═══════════════════════════════════════════════════════════════════ */
const providerTemplate = (name, endpoint, extraHeaders = '') => `import { buildBrief, generateStoryboard, ASPECT_DIMS } from '../engine/storyboard.js';
import { buildDirectorDirective } from './creative-director.js';
import { makeScene } from '../engine/templates.js';

const ENDPOINT = '${endpoint}';
const MODEL = '${name === 'groq' ? 'llama-3.3-70b-versatile' : name === 'gemini' ? 'gemini-2.0-flash' : 'meta-llama/llama-3.3-70b-instruct:free'}';

async function call(system, user, apiKey, signal) {
${name === 'gemini' ? `
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + encodeURIComponent(apiKey);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: system + '\\n\\nSubscriber idea:\\n' + user }] }],
      generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
    }),
    signal,
  });` : `
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,${extraHeaders}
    },
    body: JSON.stringify({
      model: MODEL, temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal,
  });`}
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error('${name} ' + res.status + ': ' + t.slice(0, 200)); }
  const data = await res.json();
${name === 'gemini' ? `
  const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  if (!text) throw new Error('${name} returned an empty response');
  return JSON.parse(text);` : `
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) throw new Error('${name} returned an empty response');
  return JSON.parse(content);`}
}

export const ${name} = {
  async generate(input) {
    const brief = buildBrief(input);
    if (!input.apiKey) {
      return { brief, spec: generateStoryboard(brief, input.brand), briefSource: 'template', specSource: 'template', provider: '${name}' };
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const directive = buildDirectorDirective(input);
      const raw = await call(directive, input.prompt, input.apiKey, controller.signal);
      clearTimeout(timeout);

      const enriched = {
        ...brief,
        title: typeof raw.title === 'string' ? raw.title : brief.title,
        audience: typeof raw.audience === 'string' ? raw.audience : brief.audience,
        purpose: typeof raw.purpose === 'string' ? raw.purpose : brief.purpose,
        keyMessage: typeof raw.keyMessage === 'string' ? raw.keyMessage : brief.keyMessage,
        tone: typeof raw.tone === 'string' ? raw.tone : brief.tone,
        style: typeof raw.style === 'string' ? raw.style : brief.style,
        callToAction: typeof raw.callToAction === 'string' ? raw.callToAction : brief.callToAction,
        source: 'ai',
      };
      return {
        brief: enriched,
        spec: scenePlanToSpec(raw, enriched, input.brand),
        briefSource: 'ai',
        specSource: 'ai',
        provider: '${name}',
      };
    } catch (e) {
      console.warn('[${name}] director failed, using local engine', e);
      return { brief, spec: generateStoryboard(brief, input.brand), briefSource: 'template', specSource: 'template', error: e.message, provider: '${name}' };
    }
  },
};

export function scenePlanToSpec(plan, brief, brand) {
  const dim = ASPECT_DIMS[brief.aspect] || ASPECT_DIMS['16:9'];
  const valid = new Set(['logoReveal','kineticHeadline','productShowcase','animatedStats','featureGrid','processSteps','callToAction','quoteCard']);
  const rawScenes = (plan.scenes || []).slice(0, 12);
  const scenes = rawScenes.map((s, i, arr) => {
    const template = valid.has(s.template) ? s.template : 'kineticHeadline';
    const duration = Math.max(1, Math.min(20, Number(s.duration) || 3));
    const transition = i === arr.length - 1 ? 'none' : ['fade','wipe','slide','zoom'][i % 4];
    const cam = brief.quality === 'cinematic' ? 0.35 : brief.quality === 'social' ? 0.15 : 0.25;
    return makeScene(template, duration,
      i === 0 ? brand.background : ['#0b0d10','#101319','#0f1216','#131018'][i % 4],
      brand.accent, brand, brief.quality, transition, cam,
      {
        title: s.headline || plan.keyMessage || 'Message',
        subtitle: s.subtitle || '',
        bullets: Array.isArray(s.bullets) ? s.bullets : undefined,
        stats: Array.isArray(s.stats) ? s.stats : undefined,
        cta: plan.callToAction || brief.callToAction,
      });
  });
  const target = brief.duration;
  const actual = scenes.reduce((a, s) => a + s.duration, 0) || 1;
  if (scenes.length && Math.abs(actual - target) > 0.01) {
    const scale = target / actual;
    scenes.forEach(s => { s.duration = Math.round(s.duration * scale * 100) / 100; });
    const drift = target - scenes.reduce((a, s) => a + s.duration, 0);
    scenes[scenes.length - 1].duration = Math.round((scenes[scenes.length - 1].duration + drift) * 100) / 100;
  }
  return { version: 1, width: dim.w, height: dim.h, fps: 30, quality: brief.quality, scenes };
}
`;

F['assets/js/ai/groq.js'] = providerTemplate('groq', 'https://api.groq.com/openai/v1/chat/completions');
F['assets/js/ai/openrouter.js'] = providerTemplate('openrouter', 'https://openrouter.ai/api/v1/chat/completions',
  `\n      'HTTP-Referer': location.origin,\n      'X-Title': 'MotionForge AI',`);
F['assets/js/ai/gemini.js'] = providerTemplate('gemini', '');

F['assets/js/ai/local.js'] = `import { buildBrief, generateStoryboard } from '../engine/storyboard.js';
export const local = {
  async generate(input) {
    const brief = buildBrief(input);
    return { brief, spec: generateStoryboard(brief, input.brand), briefSource: 'template', specSource: 'template', provider: 'local' };
  },
};
`;

/* ═══════════════════════════════════════════════════════════════════
   5. dashboard.js — brief preview before render
   ═══════════════════════════════════════════════════════════════════ */
F['assets/js/pages/dashboard.js'] = `import { renderSidebar } from '../components/sidebar.js';
import { storage } from '../core/storage.js';
import { defaultBrand } from '../engine/storyboard.js';
import { getProvider } from '../ai/provider.js';
import { toast } from '../components/toast.js';
import { applyConfigToPage } from '../core/config.js';
import { analyzeUserPrompt } from '../ai/director-analysis.js';

applyConfigToPage();
renderSidebar();

const $ = id => document.getElementById(id);
const promptEl = $('prompt'), aspectEl = $('aspect'), durationEl = $('duration'), qualityEl = $('quality');
const sceneEl = $('sceneCount'), langEl = $('language'), genBtn = $('generate-btn');
const statusEl = $('status'), errorEl = $('error');

let brand = storage.loadBrand() || { ...defaultBrand };

function updateEngineChip() {
  const chip = document.getElementById('engine-chip');
  const p = getProvider();
  chip.textContent = (p.name === 'local' || !p.configured)
    ? 'Local engine'
    : p.name.charAt(0).toUpperCase() + p.name.slice(1) + ' · ready';
}
updateEngineChip();

$('advanced-toggle').addEventListener('click', () => {
  const adv = $('advanced');
  const hidden = adv.classList.toggle('hidden');
  $('advanced-toggle').textContent = hidden ? 'Show advanced' : 'Hide advanced';
});
const accentEl = $('accent'); accentEl.value = brand.accent; $('accent-hex').textContent = brand.accent;
accentEl.addEventListener('input', e => { $('accent-hex').textContent = e.target.value; brand.accent = e.target.value; });
const secEl = $('secondary'); secEl.value = brand.secondary; $('secondary-hex').textContent = brand.secondary;
secEl.addEventListener('input', e => { $('secondary-hex').textContent = e.target.value; brand.secondary = e.target.value; });
$('brandName').value = brand.name;
$('brandName').addEventListener('input', e => { brand.name = e.target.value; });

function refresh() { genBtn.disabled = promptEl.value.trim().length < 8; }
promptEl.addEventListener('input', refresh);

const params = new URLSearchParams(location.search);
if (params.get('prefill')) promptEl.value = decodeURIComponent(params.get('prefill'));
if (params.get('aspect')) aspectEl.value = params.get('aspect');
if (params.get('duration')) durationEl.value = params.get('duration');
if (params.get('quality')) qualityEl.value = params.get('quality');
refresh();

// ─── Live brief preview ───
let briefTimer = null;
function renderBrief() {
  const raw = promptEl.value.trim();
  const panel = document.getElementById('brief-panel');
  if (!panel) return;
  if (raw.length < 8) { panel.classList.add('hidden'); return; }
  const a = analyzeUserPrompt(raw, { brandName: brand.name, aspect: aspectEl.value });
  const mode = getProvider().name === 'local' ? 'LOCAL DIRECTOR' : ('AI DIRECTOR · ' + getProvider().name.toUpperCase());
  panel.innerHTML = ''
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><span class="badge badge--info">' + mode + '</span><span style="font-size:11px;color:var(--text-muted)">live preview</span></div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;font-size:12px">'
    +   '<div><div class="label" style="font-size:9.5px">Brand</div><div style="margin-top:3px;font-weight:600">' + esc(a.brand) + '</div></div>'
    +   '<div><div class="label" style="font-size:9.5px">Category</div><div style="margin-top:3px;font-weight:500">' + esc(a.category) + '</div></div>'
    +   '<div><div class="label" style="font-size:9.5px">Tone</div><div style="margin-top:3px;font-weight:500">' + esc(a.tone) + '</div></div>'
    +   '<div><div class="label" style="font-size:9.5px">CTA</div><div style="margin-top:3px;font-weight:500">' + esc(a.cta) + '</div></div>'
    + '</div>'
    + '<div style="margin-top:12px"><div class="label" style="font-size:9.5px">Opening line</div><div style="margin-top:3px;font-size:13px;color:var(--text-secondary)">"' + esc(a.tagline) + '"</div></div>'
    + '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' + a.palette.map(c => '<span style="display:inline-block;width:16px;height:16px;border-radius:3px;border:1px solid rgba(255,255,255,.15);background:' + c + '"></span>').join('') + '</div>';
  panel.classList.remove('hidden');
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

promptEl.addEventListener('input', () => { clearTimeout(briefTimer); briefTimer = setTimeout(renderBrief, 250); });
[aspectEl, durationEl, qualityEl, sceneEl].forEach(el => el.addEventListener('change', renderBrief));
renderBrief();

// ─── Suggestions ───
const SUGGESTIONS = [
  { label: 'Coffee shop', prompt: 'A cinematic coffee shop video ad called "716" — warm, artisanal, moody. Show the pour, the beans, the room.' },
  { label: 'Sneaker drop', prompt: 'High-energy sneaker drop for a streetwear brand called Volt with kinetic typography, fast cuts, and a limited-run story.' },
  { label: 'SaaS launch', prompt: 'A 20-second SaaS launch for a real-time analytics platform called Northwind, technical and precise, blue-violet palette.' },
  { label: 'Restaurant', prompt: 'An elegant 12-second restaurant promo for a bistro called Petite Maison — warm, seasonal, editorial.' },
  { label: 'Fintech app', prompt: 'A punchy 15-second ad for a fintech app called Ledger that makes global payments instant. Technical, dark, green accents.' },
];
const chipBox = document.getElementById('suggestions');
if (chipBox) {
  chipBox.innerHTML = SUGGESTIONS.map((s, i) => '<button class="chip" data-i="' + i + '">' + s.label + '</button>').join('');
  chipBox.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    promptEl.value = SUGGESTIONS[Number(btn.dataset.i)].prompt;
    refresh(); renderBrief();
  });
}

// ─── Generate ───
genBtn.addEventListener('click', async () => {
  errorEl.classList.add('hidden');
  genBtn.disabled = true;
  const original = genBtn.textContent;
  genBtn.textContent = 'Generating…';
  try {
    statusEl.textContent = 'Analyzing prompt…';
    await sleep(180);

    const provider = getProvider();
    const input = {
      prompt: promptEl.value,
      aspect: aspectEl.value,
      duration: Number(durationEl.value),
      quality: qualityEl.value,
      sceneCount: Number(sceneEl.value),
      language: langEl.value,
      brand,
      apiKey: provider.key,
    };

    statusEl.textContent = provider.name === 'local'
      ? 'Applying director doctrine…'
      : 'Directing scenes with ' + provider.name + '…';

    const result = await provider.impl.generate(input);

    statusEl.textContent = 'Validating spec…';
    await sleep(140);
    if (!result.spec || !result.spec.scenes || !result.spec.scenes.length) throw new Error('Spec generation produced no scenes.');

    statusEl.textContent = 'Saving project…';
    await sleep(100);

    const id = 'prj_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const project = {
      id,
      name: result.brief.title || 'Untitled project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      brief: result.brief,
      spec: result.spec,
      brand,
      version: 1,
      source: result.briefSource,
      specSource: result.specSource,
      provider: result.provider || provider.name,
    };
    const list = storage.loadProjects();
    list.unshift(project);
    storage.saveProjects(list);
    storage.saveBrand(brand);

    if (result.error) toast('Director failed: ' + result.error + ' — used local engine.', 'error', 5000);
    else if (result.specSource === 'ai') toast('Directed by ' + provider.name, 'success');
    else toast('Directed by local engine', 'success');

    location.href = 'editor.html?id=' + encodeURIComponent(id);
  } catch (err) {
    errorEl.textContent = err.message || 'Generation failed';
    errorEl.classList.remove('hidden');
    genBtn.disabled = false;
  } finally {
    genBtn.textContent = original;
    statusEl.textContent = '';
  }
});

if (params.get('auto') === '1' && promptEl.value.trim().length >= 8) {
  setTimeout(() => genBtn.click(), 200);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
`;

/* ═══════════════════════════════════════════════════════════════════
   WRITE
   ═══════════════════════════════════════════════════════════════════ */
console.log(`\n  \x1b[38;5;215m\x1b[1mMotionForge AI\x1b[0m \x1b[38;5;245m— director patch\x1b[0m\n`);

let count = 0;
for (const [rel, content] of Object.entries(F)) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  ok(rel);
  count++;
}

/* Patch app.html to add the brief panel */
const appHtmlPath = path.join(ROOT, 'app.html');
if (fs.existsSync(appHtmlPath)) {
  let appHtml = fs.readFileSync(appHtmlPath, 'utf8');
  if (!appHtml.includes('id="brief-panel"')) {
    // Insert brief panel right after the prompt textarea
    appHtml = appHtml.replace(
      /(<textarea id="prompt"[^>]*><\/textarea>)/,
      '$1\n        <div id="brief-panel" class="hidden" style="margin-top:14px;padding:14px;border:1px solid rgba(35,42,50,.7);border-radius:10px;background:rgba(15,18,22,.6)"></div>'
    );
    fs.writeFileSync(appHtmlPath, appHtml, 'utf8');
    ok('app.html (added brief panel)');
    count++;
  } else {
    console.log('  \x1b[38;5;245m·\x1b[0m app.html already has brief panel');
  }
}

console.log(`\n  \x1b[38;5;114m✓\x1b[0m Done. ${count} files updated.\n`);

if (PUSH) {
  try {
    execSync('git add .', { cwd: ROOT, stdio: 'inherit' });
    execSync('git commit -m "Apply director doctrine to local engine + live brief preview"', { cwd: ROOT, stdio: 'inherit' });
    execSync('git push', { cwd: ROOT, stdio: 'inherit' });
    console.log('\n  \x1b[38;5;114m✓\x1b[0m Pushed to GitHub. Netlify will redeploy in ~30s.\n');
  } catch (e) {
    console.log('\n  \x1b[38;5;203m!\x1b[0m Git step failed — run manually:\n    git add . && git commit -m "Apply director patch" && git push\n');
  }
} else {
  console.log('  \x1b[38;5;245mNext steps:\x1b[0m');
  console.log('    git add .');
  console.log('    git commit -m "Apply director doctrine to local engine + live brief preview"');
  console.log('    git push\n');
}
