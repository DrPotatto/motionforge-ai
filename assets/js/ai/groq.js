import { buildBrief, generateStoryboard, ASPECT_DIMS } from '../engine/storyboard.js';
import { buildDirectorDirective } from './creative-director.js';
import { makeScene } from '../engine/templates.js';

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS_ENDPOINT = 'https://api.groq.com/openai/v1/models';

// Preferred order — we pick the first one Groq actually offers.
const PREFERRED_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'qwen/qwen3-32b',
  'llama-3.3-70b-versatile',   // kept as last-resort fallback
  'llama-3.1-8b-instant',
];

let cachedModel = null;

async function pickModel(apiKey, signal) {
  if (cachedModel) return cachedModel;
  try {
    const res = await fetch(MODELS_ENDPOINT, {
      headers: { 'Authorization': 'Bearer ' + apiKey },
      signal,
    });
    if (res.ok) {
      const data = await res.json();
      const available = new Set((data.data || []).map(m => m.id));
      for (const m of PREFERRED_MODELS) {
        if (available.has(m)) { cachedModel = m; return m; }
      }
      // If none of our favourites are there, take the first text model returned
      const first = (data.data || []).find(m => m.id && !m.id.includes('whisper'));
      if (first) { cachedModel = first.id; return first.id; }
    }
  } catch (e) {
    console.warn('[groq] model discovery failed, using default');
  }
  cachedModel = 'openai/gpt-oss-120b'; // sensible fallback
  return cachedModel;
}

async function call(system, user, apiKey, signal) {
  const model = await pickModel(apiKey, signal);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    // If the model went bad, clear the cache so next call re-discovers
    if (res.status === 404) cachedModel = null;
    throw new Error('Groq ' + res.status + ': ' + t.slice(0, 300));
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned an empty response');
  return JSON.parse(content);
}

export const groq = {
  async generate(input) {
    const brief = buildBrief(input);
    if (!input.apiKey) {
      return { brief, spec: generateStoryboard(brief, input.brand), briefSource: 'template', specSource: 'template', provider: 'groq' };
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
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
        provider: 'groq',
        model: cachedModel,
      };
    } catch (e) {
      console.warn('[groq] director failed, using local engine', e);
      return {
        brief,
        spec: generateStoryboard(brief, input.brand),
        briefSource: 'template',
        specSource: 'template',
        error: e.message,
        provider: 'groq',
      };
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
