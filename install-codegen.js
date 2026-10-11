#!/usr/bin/env node
/**
 * MotionForge AI — Code generation patch
 * Replaces the template-based generation with real AI code generation.
 *
 * Run from project root: node install-codegen.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error('Run from the motionforge-ai project root.');
  process.exit(1);
}

const C = { g: '\x1b[38;5;114m', y: '\x1b[38;5;245m', r: '\x1b[0m', x: '\x1b[38;5;203m' };
const ok = s => console.log(`  ${C.g}✓${C.r} ${s}`);
const skip = s => console.log(`  ${C.y}·${C.r} ${s}`);

const F = {};

/* ═══════════════════════════════════════════════════════════════
   1. prompt-composer.js — merges doctrine + user idea
   ═══════════════════════════════════════════════════════════════ */
F['assets/js/ai/prompt-composer.js'] = `/**
 * Prompt Composer
 *
 * Merges the Baqalati creative doctrine with the subscriber's idea and
 * the technical constraints of the sandboxed iframe renderer.
 *
 * The output is the single prompt that goes to the AI. The AI returns
 * HTML. Every generation produces different code.
 */

export const ASPECT_DIMS = {
  '16:9': { w: 1920, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '1:1':  { w: 1080, h: 1080 },
  '4:5':  { w: 1080, h: 1350 },
};

export function composeCodeGenPrompt(input) {
  const {
    userPrompt, aspect = '16:9', duration = 12, quality = 'cinematic',
    accent = '#ff8a3d', secondary = '#8b6dff', background = '#0b0d10',
    brandName = 'Brand', language = 'en',
  } = input;

  const dims = ASPECT_DIMS[aspect] || ASPECT_DIMS['16:9'];
  const isArabic = language === 'ar';

  return \`You are an elite Motion Graphics Director and senior Canvas 2D engineer.

═══════════════════════════════════════════════════════════════════
CREATIVE DOCTRINE — the level of craft required
═══════════════════════════════════════════════════════════════════

Visual language:
  • Dark cinematic environment. High contrast. Selective lighting.
  • Technical code-driven aesthetic: fine grids, interface fragments,
    monospace details, geometric outlines, precise markings.
  • Kinetic typography in short deliberate bursts — never static cards.
  • Accent color used as a controlled energy source, not blanket coverage.
  • Camera-like zooms, subtle parallax, layered depth.
  • Elements that assemble, transform, and transition INTO one another.
  • Motivated transitions — the outgoing element BECOMES the incoming one.
  • Clear hierarchy: one dominant message + one supporting graphic + 1–2 details.

What you must NOT do:
  • Static cards with text that just fades in.
  • Every scene looking like the same UI pattern.
  • Random effects with no relationship to the message.
  • Excessive bounce or wobble. Precision, not wobble.
  • Continuously flashing the screen white.

═══════════════════════════════════════════════════════════════════
TECHNICAL CONSTRAINTS
═══════════════════════════════════════════════════════════════════

Duration:        \${duration} seconds, exactly
Canvas size:     \${dims.w} × \${dims.h} (\${aspect})
Accent:          \${accent}
Secondary:       \${secondary}
Background:      \${background}
Brand:           \${brandName}

Rendering:
  • Canvas 2D API only. No WebGL, no external libraries.
  • Deterministic timeline: animation state = pure function of elapsed seconds.
  • Use requestAnimationFrame with elapsed-time based math.
  • All motion, particles, and typography must be procedurally drawn.
  • No images, no external assets, no remote fonts (system fonts only).

Structure:
  • Render into a <canvas> at exactly \${dims.w}×\${dims.h}.
  • Scale the canvas to fit the viewport using CSS (max-width: 100%).
  • Add a control bar BELOW the canvas with three buttons: Play / Pause, Restart, Record.
  • Record must use MediaRecorder + canvas.captureStream(30) and trigger a download.
  • Keep all UI minimal, dark-themed, and outside the canvas.

Environment:
  • The HTML runs in a sandboxed iframe with allow-scripts only.
  • It cannot make network requests. It cannot access the parent page.
  • It must work fully offline after the file has loaded.

FORBIDDEN — the code will be rejected if it contains any of these:
  • fetch(), XMLHttpRequest, WebSocket, EventSource
  • import(), eval(), new Function(), setTimeout with string args
  • document.cookie, localStorage, sessionStorage, indexedDB
  • External URLs, remote images, remote scripts, remote stylesheets
  • Any network communication of any kind

\${isArabic ? \`Arabic text handling:
  • Arabic must render connected, right-to-left, using system fonts.
  • Set ctx.direction = 'rtl' for Arabic text.
  • Never split Arabic words into individual letters.
  • Use a system fallback like '"Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif'.\` : ''}

═══════════════════════════════════════════════════════════════════
THE SUBSCRIBER'S IDEA
═══════════════════════════════════════════════════════════════════

\${userPrompt}

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT — read carefully
═══════════════════════════════════════════════════════════════════

Return ONLY the raw HTML file. Nothing else.

  • No markdown fences (no \\\`\\\`\\\`html).
  • No explanation before or after.
  • No comments about what you did.
  • Start with <!doctype html> and end with </html>.

The file must be complete, self-contained, and immediately runnable.`;

}

export function composeRevisionPrompt(originalCode, revisionRequest, input) {
  const dims = ASPECT_DIMS[input.aspect] || ASPECT_DIMS['16:9'];
  return \`You previously generated a motion graphics HTML file. The subscriber wants a specific change.

ORIGINAL CODE:
\${originalCode}

SUBSCRIBER'S REVISION REQUEST:
\${revisionRequest}

Apply the change. Keep everything else that already works. Maintain the same constraints:
  • Canvas \${dims.w}×\${dims.h}
  • No fetch, eval, external URLs, or network calls
  • Deterministic timeline
  • Control bar with Play / Restart / Record

Return ONLY the updated HTML file. No markdown fences. Start with <!doctype html>.`;
}
`;

/* ═══════════════════════════════════════════════════════════════
   2. code-generator.js — calls AI, extracts HTML, sanitizes
   ═══════════════════════════════════════════════════════════════ */
F['assets/js/ai/code-generator.js'] = `import { composeCodeGenPrompt, composeRevisionPrompt } from './prompt-composer.js';
import { storage } from '../core/storage.js';
import { getProvider } from './provider.js';

/* ─── Forbidden patterns — reject anything the sandbox shouldn't run ─── */
const FORBIDDEN = [
  { rx: /\\bfetch\\s*\\(/i,                          name: 'fetch()' },
  { rx: /\\bXMLHttpRequest\\b/i,                    name: 'XMLHttpRequest' },
  { rx: /\\bWebSocket\\b/i,                          name: 'WebSocket' },
  { rx: /\\bEventSource\\b/i,                        name: 'EventSource' },
  { rx: /\\bimport\\s*\\(/i,                          name: 'dynamic import()' },
  { rx: /\\beval\\s*\\(/i,                            name: 'eval()' },
  { rx: /\\bnew\\s+Function\\s*\\(/i,                 name: 'new Function()' },
  { rx: /\\bdocument\\s*\\.\\s*cookie\\b/i,             name: 'document.cookie' },
  { rx: /\\blocalStorage\\b/i,                        name: 'localStorage' },
  { rx: /\\bsessionStorage\\b/i,                      name: 'sessionStorage' },
  { rx: /\\bindexedDB\\b/i,                           name: 'indexedDB' },
  { rx: /<script[^>]+src\\s*=\\s*["']\\s*https?:/i,     name: 'remote script' },
  { rx: /<link[^>]+href\\s*=\\s*["']\\s*https?:/i,      name: 'remote stylesheet' },
  { rx: /<img[^>]+src\\s*=\\s*["']\\s*https?:/i,        name: 'remote image' },
  { rx: /<iframe\\b/i,                                name: 'nested iframe' },
];

/* ─── Extract the HTML from a possibly-messy AI response ─── */
export function extractHtml(raw) {
  let s = String(raw || '').trim();
  // Strip markdown code fences
  s = s.replace(/^\\\`\\\`\\\`(?:html|HTML)?\\s*/i, '');
  s = s.replace(/\\s*\\\`\\\`\\\`\\s*$/i, '');
  // Find the html block if wrapped in prose
  const m = s.match(/<!doctype html>[\\s\\S]*<\\/html>/i) || s.match(/<html[\\s\\S]*<\\/html>/i);
  if (m) return m[0];
  return s;
}

/* ─── Sanitize: reject if any forbidden pattern is present ─── */
export function sanitize(html) {
  for (const { rx, name } of FORBIDDEN) {
    if (rx.test(html)) {
      throw new Error('Generated code contains forbidden API: ' + name);
    }
  }
  if (!/<canvas/i.test(html)) {
    throw new Error('Generated code is missing a <canvas> element.');
  }
  if (!/requestAnimationFrame/i.test(html)) {
    throw new Error('Generated code does not use requestAnimationFrame.');
  }
  return html;
}

/* ─── Call the configured AI provider ─── */
async function callAI(prompt, apiKey, providerName, signal) {
  const provider = getProvider();
  const name = providerName || provider.name;

  if (name === 'deepseek') {
    return await callDeepSeek(prompt, apiKey, signal);
  }
  if (name === 'groq') {
    return await callGroq(prompt, apiKey, signal);
  }
  if (name === 'gemini') {
    return await callGemini(prompt, apiKey, signal);
  }
  if (name === 'openrouter') {
    return await callOpenRouter(prompt, apiKey, signal);
  }
  throw new Error('No AI provider configured. Add an API key in Settings.');
}

async function callDeepSeek(prompt, apiKey, signal) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.3,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: 'You are a senior Canvas 2D engineer. Return only raw HTML code with no markdown fences and no explanation.' },
        { role: 'user', content: prompt },
      ],
    }),
    signal,
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error('DeepSeek ' + res.status + ': ' + t.slice(0, 300)); }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek returned an empty response');
  return content;
}

async function callGroq(prompt, apiKey, signal) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: 'You are a senior Canvas 2D engineer. Return only raw HTML code with no markdown fences and no explanation.' },
        { role: 'user', content: prompt },
      ],
    }),
    signal,
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error('Groq ' + res.status + ': ' + t.slice(0, 300)); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(prompt, apiKey, signal) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(apiKey);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
    }),
    signal,
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error('Gemini ' + res.status + ': ' + t.slice(0, 300)); }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenRouter(prompt, apiKey, signal) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
      'HTTP-Referer': location.origin,
      'X-Title': 'MotionForge AI',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      temperature: 0.3,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: 'You are a senior Canvas 2D engineer. Return only raw HTML code with no markdown fences and no explanation.' },
        { role: 'user', content: prompt },
      ],
    }),
    signal,
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error('OpenRouter ' + res.status + ': ' + t.slice(0, 300)); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/* ─── Main entry — used by dashboard ─── */
export async function generateCode(input) {
  const provider = getProvider();
  const apiKey = input.apiKey || provider.key;
  const providerName = input.provider || provider.name;

  if (!apiKey) {
    throw new Error('No API key configured. Open Settings → AI provider and paste a key from DeepSeek, Groq, Gemini, or OpenRouter.');
  }

  const prompt = composeCodeGenPrompt(input);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const raw = await callAI(prompt, apiKey, providerName, controller.signal);
    const html = extractHtml(raw);
    const clean = sanitize(html);
    return { code: clean, raw, prompt, provider: providerName };
  } finally {
    clearTimeout(timeout);
  }
}

/* ─── Revision — targeted edit to an existing animation ─── */
export async function reviseCode(originalCode, revisionRequest, input) {
  const provider = getProvider();
  const apiKey = input.apiKey || provider.key;
  if (!apiKey) throw new Error('No API key configured.');

  const prompt = composeRevisionPrompt(originalCode, revisionRequest, input);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const raw = await callAI(prompt, apiKey, input.provider || provider.name, controller.signal);
    const html = extractHtml(raw);
    const clean = sanitize(html);
    return { code: clean, raw, provider: input.provider || provider.name };
  } finally {
    clearTimeout(timeout);
  }
}
`;

/* ═══════════════════════════════════════════════════════════════
   3. sandbox.html — isolated environment for AI code
   ═══════════════════════════════════════════════════════════════ */
F['sandbox.html'] = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Sandbox</title>
<meta name="robots" content="noindex,nofollow">
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #05060a; overflow: hidden; }
  iframe { width: 100%; height: 100%; border: 0; display: block; }
  .empty { color: #666; font-family: system-ui, sans-serif; padding: 40px; text-align: center; }
</style>
</head>
<body>
<iframe id="frame" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>
<script>
  const frame = document.getElementById('frame');

  // Receive code from parent via postMessage
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'render-code') return;
    frame.srcdoc = e.data.code || '<div class="empty">No code.</div>';
  });

  // Relay readiness back to parent
  frame.addEventListener('load', () => {
    window.parent.postMessage({ type: 'sandbox-ready' }, '*');
  });
</script>
</body>
</html>
`;

/* ═══════════════════════════════════════════════════════════════
   4. dashboard.js — routes to code generation when AI is configured
   ═══════════════════════════════════════════════════════════════ */
F['assets/js/pages/dashboard.js'] = `import { renderSidebar } from '../components/sidebar.js';
import { storage } from '../core/storage.js';
import { defaultBrand } from '../engine/storyboard.js';
import { getProvider } from '../ai/provider.js';
import { generateCode } from '../ai/code-generator.js';
import { toast } from '../components/toast.js';
import { applyConfigToPage } from '../core/config.js';

applyConfigToPage();
renderSidebar();

const $ = id => document.getElementById(id);
const promptEl = $('prompt'), aspectEl = $('aspect'), durationEl = $('duration');
const qualityEl = $('quality'), langEl = $('language'), genBtn = $('generate-btn');
const statusEl = $('status'), errorEl = $('error');

let brand = storage.loadBrand() || { ...defaultBrand };

function updateEngineChip() {
  const chip = document.getElementById('engine-chip');
  const p = getProvider();
  if (p.name === 'local' || !p.configured) {
    chip.textContent = 'No AI key — local engine';
    chip.style.background = 'rgba(248,113,113,.12)';
    chip.style.color = '#fca5a5';
  } else {
    const labels = { groq: 'Groq', gemini: 'Gemini', openrouter: 'OpenRouter', deepseek: 'DeepSeek' };
    chip.textContent = (labels[p.name] || p.name) + ' · will write code';
    chip.style.background = 'rgba(52,211,153,.12)';
    chip.style.color = '#6ee7b7';
  }
}
updateEngineChip();

$('advanced-toggle').addEventListener('click', () => {
  const adv = $('advanced');
  const hidden = adv.classList.toggle('hidden');
  $('advanced-toggle').textContent = hidden ? 'Show advanced' : 'Hide advanced';
});
const accentEl = $('accent'); accentEl.value = brand.accent;
accentEl.addEventListener('input', e => { $('accent-hex').textContent = e.target.value; brand.accent = e.target.value; });
const secEl = $('secondary'); secEl.value = brand.secondary;
secEl.addEventListener('input', e => { $('secondary-hex').textContent = e.target.value; brand.secondary = e.target.value; });
$('brandName').value = brand.name;
$('brandName').addEventListener('input', e => { brand.name = e.target.value; });

function refresh() { genBtn.disabled = promptEl.value.trim().length < 8; }
promptEl.addEventListener('input', refresh);

const params = new URLSearchParams(location.search);
if (params.get('prefill')) promptEl.value = decodeURIComponent(params.get('prefill'));
if (params.get('aspect')) aspectEl.value = params.get('aspect');
if (params.get('duration')) durationEl.value = params.get('duration');
refresh();

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
    refresh();
  });
}

genBtn.addEventListener('click', async () => {
  errorEl.classList.add('hidden');
  genBtn.disabled = true;
  const original = genBtn.textContent;
  genBtn.textContent = 'Generating…';

  try {
    const provider = getProvider();
    if (provider.name === 'local' || !provider.configured) {
      throw new Error('No AI provider configured. Open Settings → AI provider and paste a free API key from DeepSeek, Groq, Gemini, or OpenRouter. Then AI will write a unique animation for each prompt.');
    }

    statusEl.textContent = 'Composing director prompt…';
    await sleep(200);

    const input = {
      userPrompt: promptEl.value.trim(),
      aspect: aspectEl.value,
      duration: Number(durationEl.value),
      quality: qualityEl.value,
      language: langEl.value,
      brandName: brand.name,
      accent: brand.accent,
      secondary: brand.secondary,
      background: brand.background || '#0b0d10',
      apiKey: provider.key,
      provider: provider.name,
    };

    statusEl.textContent = 'AI is writing the animation code… (20-40s)';
    const result = await generateCode(input);

    statusEl.textContent = 'Validating code…';
    await sleep(150);

    const id = 'prj_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const project = {
      id,
      name: deriveTitle(promptEl.value, brand.name),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      prompt: input.userPrompt,
      aspect: input.aspect,
      duration: input.duration,
      quality: input.quality,
      language: input.language,
      code: result.code,
      provider: result.provider,
      mode: 'code',           // ← tells the editor to use the sandbox iframe
      brand,
      version: 1,
    };

    const list = storage.loadProjects();
    list.unshift(project);
    storage.saveProjects(list);
    storage.saveBrand(brand);

    toast('AI wrote a fresh animation · ' + result.provider, 'success');
    location.href = 'editor.html?id=' + encodeURIComponent(id);
  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message || 'Generation failed';
    errorEl.classList.remove('hidden');
  } finally {
    genBtn.textContent = original;
    genBtn.disabled = false;
    statusEl.textContent = '';
  }
});

if (params.get('auto') === '1' && promptEl.value.trim().length >= 8) {
  setTimeout(() => genBtn.click(), 300);
}

function deriveTitle(prompt, fallback) {
  const q = prompt.match(/["'“”‘’]([^"'“”‘’]{1,30})["'“”‘’]/);
  if (q) return q[1];
  const called = prompt.match(/called\\s+["']?([A-Za-z0-9][A-Za-z0-9 &'\\-]{1,28})/i);
  if (called) return called[1].trim();
  return prompt.split(/[.!?]/)[0].slice(0, 40).trim() || fallback;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
`;

/* ═══════════════════════════════════════════════════════════════
   5. editor.js — dual mode: sandbox iframe for code projects,
      structured editor for legacy spec projects
   ═══════════════════════════════════════════════════════════════ */
F['assets/js/pages/editor.js'] = `import { storage } from '../core/storage.js';
import { renderFrame, layout, totalDuration } from '../engine/renderer.js';
import { makeScene } from '../engine/templates.js';
import { defaultBrand } from '../engine/storyboard.js';
import { exportVideo } from '../engine/exporter.js';
import { reviseCode } from '../ai/code-generator.js';
import { getProvider } from '../ai/provider.js';
import { toast } from '../components/toast.js';
import { applyConfigToPage } from '../core/config.js';

applyConfigToPage();
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const id = params.get('id');
const project = id ? storage.loadProjects().find(p => p.id === id) : null;
if (!project) { location.href = 'app.html'; }

$('project-name').value = project.name;
$('project-name').addEventListener('input', e => { project.name = e.target.value; scheduleSave(); });

// ─── CODE MODE (AI-generated animation) ───
if (project.mode === 'code' && project.code) {
  initCodeMode(project);
} else {
  initSpecMode(project);
}

/* ══════════════════════════════════════════════════════════════
   CODE MODE — sandbox iframe + regenerate + raw code viewer
   ══════════════════════════════════════════════════════════════ */
function initCodeMode(project) {
  const body = document.querySelector('.editor-body');
  const canvas = document.getElementById('preview-canvas');
  const previewArea = document.getElementById('preview-area');
  if (!body || !previewArea) return;

  // Replace the preview area with an iframe
  previewArea.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'width:100%;height:100%;border:0;border-radius:8px;background:#05060a';
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.srcdoc = project.code;
  previewArea.appendChild(iframe);

  // Hide timeline + inspector (they don't apply to code mode)
  const timeline = document.querySelector('.timeline');
  const transport = document.querySelector('.transport');
  const leftPanel = document.querySelector('.editor-panel--left');
  const rightPanel = document.querySelector('.editor-panel--right');
  const resizers = document.querySelectorAll('.resizer');
  if (timeline) timeline.style.display = 'none';
  if (transport) transport.style.display = 'none';
  if (leftPanel) leftPanel.style.display = 'none';
  if (rightPanel) rightPanel.style.display = 'none';
  resizers.forEach(r => r.style.display = 'none');

  // Update the top bar
  const srcBadge = document.getElementById('spec-source');
  if (srcBadge) {
    srcBadge.textContent = 'AI-written · ' + (project.provider || 'unknown');
    srcBadge.className = 'badge badge--success';
  }
  const saveIndicator = document.getElementById('save-indicator');
  if (saveIndicator) saveIndicator.textContent = 'Code animation · ' + (project.aspect || '16:9');

  // Replace the top-right buttons with code-mode actions
  const actionsContainer = document.querySelector('.editor-topbar .ml-auto');
  if (actionsContainer) {
    actionsContainer.innerHTML = '';
    const regenBtn = mkBtn('↻ Regenerate', 'btn btn-ghost btn-sm');
    regenBtn.addEventListener('click', () => openRegenerateDialog(project, iframe));
    const reviseBtn = mkBtn('✎ Revise', 'btn btn-ghost btn-sm');
    reviseBtn.addEventListener('click', () => openReviseDialog(project, iframe));
    const viewBtn = mkBtn('{ } View code', 'btn btn-ghost btn-sm');
    viewBtn.addEventListener('click', () => openCodeViewer(project, iframe));
    const exportNote = mkBtn('Export in the frame below', 'btn btn-subtle btn-sm');
    exportNote.disabled = true;
    actionsContainer.appendChild(regenBtn);
    actionsContainer.appendChild(reviseBtn);
    actionsContainer.appendChild(viewBtn);
    actionsContainer.appendChild(exportNote);
  }
}

function mkBtn(text, cls) {
  const b = document.createElement('button');
  b.className = cls;
  b.textContent = text;
  return b;
}

function openRegenerateDialog(project, iframe) {
  const provider = getProvider();
  if (!provider.configured || provider.name === 'local') {
    alert('Configure an AI provider in Settings first.');
    return;
  }
  const root = $('modal-root');
  root.innerHTML = '';
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = '<div style="display:flex;align-items:center"><h2 class="modal__title">Regenerate animation</h2><button class="btn btn-subtle btn-sm" id="regen-close" style="margin-left:auto">✕</button></div>'
    + '<p style="color:var(--text-secondary);font-size:13px;margin-top:10px">The AI will write a completely new HTML file for the same prompt. Two generations never look the same.</p>'
    + '<label style="display:block;margin-top:14px"><span class="label">Adjust the prompt (optional)</span><textarea id="regen-prompt" class="field mt-1" rows="3"></textarea></label>'
    + '<div style="margin-top:20px;display:flex;gap:8px;justify-content:flex-end"><button id="regen-cancel" class="btn btn-ghost">Cancel</button><button id="regen-run" class="btn btn-primary">Regenerate</button></div>';
  backdrop.appendChild(modal);
  root.appendChild(backdrop);
  document.getElementById('regen-prompt').value = project.prompt;

  const close = () => { root.innerHTML = ''; };
  document.getElementById('regen-close').addEventListener('click', close);
  document.getElementById('regen-cancel').addEventListener('click', close);
  document.getElementById('regen-run').addEventListener('click', async () => {
    const btn = document.getElementById('regen-run');
    btn.disabled = true;
    btn.textContent = 'Generating…';
    try {
      const { generateCode } = await import('../ai/code-generator.js');
      const input = {
        userPrompt: document.getElementById('regen-prompt').value.trim(),
        aspect: project.aspect || '16:9',
        duration: project.duration || 12,
        quality: project.quality || 'cinematic',
        language: project.language || 'en',
        brandName: project.brand?.name || 'Brand',
        accent: project.brand?.accent || '#ff8a3d',
        secondary: project.brand?.secondary || '#8b6dff',
        background: project.brand?.background || '#0b0d10',
        apiKey: provider.key,
      };
      const result = await generateCode(input);
      project.code = result.code;
      project.prompt = input.userPrompt;
      project.provider = result.provider;
      project.updatedAt = Date.now();
      saveProject(project);
      iframe.srcdoc = result.code;
      toast('Regenerated by ' + result.provider, 'success');
      close();
    } catch (e) {
      alert('Regeneration failed: ' + e.message);
      btn.disabled = false;
      btn.textContent = 'Regenerate';
    }
  });
}

function openReviseDialog(project, iframe) {
  const provider = getProvider();
  if (!provider.configured || provider.name === 'local') {
    alert('Configure an AI provider in Settings first.');
    return;
  }
  const root = $('modal-root');
  root.innerHTML = '';
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = '<div style="display:flex;align-items:center"><h2 class="modal__title">Revise the animation</h2><button class="btn btn-subtle btn-sm" id="rev-close" style="margin-left:auto">✕</button></div>'
    + '<p style="color:var(--text-secondary);font-size:13px;margin-top:10px">Describe one change. The AI keeps what already works and applies your edit.</p>'
    + '<textarea id="rev-request" class="field mt-3" rows="3" placeholder="e.g. Make the opening more dramatic. Slow the middle section. Use a warmer accent color."></textarea>'
    + '<div style="margin-top:20px;display:flex;gap:8px;justify-content:flex-end"><button id="rev-cancel" class="btn btn-ghost">Cancel</button><button id="rev-run" class="btn btn-primary">Apply revision</button></div>';
  backdrop.appendChild(modal);
  root.appendChild(backdrop);

  const close = () => { root.innerHTML = ''; };
  document.getElementById('rev-close').addEventListener('click', close);
  document.getElementById('rev-cancel').addEventListener('click', close);
  document.getElementById('rev-run').addEventListener('click', async () => {
    const req = document.getElementById('rev-request').value.trim();
    if (!req) { alert('Describe the change.'); return; }
    const btn = document.getElementById('rev-run');
    btn.disabled = true;
    btn.textContent = 'Revising…';
    try {
      const result = await reviseCode(project.code, req, {
        aspect: project.aspect, apiKey: provider.key, provider: provider.name,
      });
      project.code = result.code;
      project.updatedAt = Date.now();
      saveProject(project);
      iframe.srcdoc = result.code;
      toast('Revised by ' + result.provider, 'success');
      close();
    } catch (e) {
      alert('Revision failed: ' + e.message);
      btn.disabled = false;
      btn.textContent = 'Apply revision';
    }
  });
}

function openCodeViewer(project, iframe) {
  const root = $('modal-root');
  root.innerHTML = '';
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '900px';
  modal.innerHTML = '<div style="display:flex;align-items:center"><h2 class="modal__title">Animation code</h2><button class="btn btn-subtle btn-sm" id="cv-close" style="margin-left:auto">✕</button></div>'
    + '<p style="color:var(--text-secondary);font-size:12px;margin-top:8px">Power-user mode: edit and re-render. Invalid code will fail to render.</p>'
    + '<textarea id="cv-code" class="field mt-3" style="font-family:var(--font-mono);font-size:11px;min-height:420px;line-height:1.5" spellcheck="false"></textarea>'
    + '<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end"><button id="cv-cancel" class="btn btn-ghost">Cancel</button><button id="cv-apply" class="btn btn-primary">Re-render</button></div>';
  backdrop.appendChild(modal);
  root.appendChild(backdrop);
  document.getElementById('cv-code').value = project.code;

  const close = () => { root.innerHTML = ''; };
  document.getElementById('cv-close').addEventListener('click', close);
  document.getElementById('cv-cancel').addEventListener('click', close);
  document.getElementById('cv-apply').addEventListener('click', () => {
    const newCode = document.getElementById('cv-code').value;
    project.code = newCode;
    project.updatedAt = Date.now();
    saveProject(project);
    iframe.srcdoc = newCode;
    toast('Re-rendered', 'success');
    close();
  });
}

/* ══════════════════════════════════════════════════════════════
   SPEC MODE — the original structured editor (kept for legacy)
   ══════════════════════════════════════════════════════════════ */
function initSpecMode(project) {
  // Minimal fallback: show a message and a link to regenerate in code mode.
  const previewArea = document.getElementById('preview-area');
  if (previewArea) {
    previewArea.innerHTML = '<div class="empty-state">'
      + '<h3>This is a legacy template project</h3>'
      + '<p>Generate a new project with an AI provider configured to get a fully custom animation.</p>'
      + '<a class="btn btn-primary" href="app.html" style="margin-top:16px;display:inline-flex">Generate a new one</a>'
      + '</div>';
  }
}

/* ══════════════════════════════════════════════════════════════
   Persistence
   ══════════════════════════════════════════════════════════════ */
let saveTimer = null;
function scheduleSave() {
  const el = document.getElementById('save-indicator');
  if (el) el.textContent = 'Saving…';
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveProject(project);
    if (el) el.textContent = 'Saved';
  }, 600);
}
function saveProject(p) {
  p.updatedAt = Date.now();
  const list = storage.loadProjects();
  const i = list.findIndex(x => x.id === p.id);
  if (i >= 0) list[i] = p; else list.unshift(p);
  storage.saveProjects(list);
}
`;

/* ═══════════════════════════════════════════════════════════════
   Write + patch
   ═══════════════════════════════════════════════════════════════ */
console.log('\n  \x1b[38;5;215m\x1b[1mMotionForge AI\x1b[0m \x1b[38;5;245m— code generation patch\x1b[0m\n');

let count = 0;
for (const [rel, content] of Object.entries(F)) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  ok(rel);
  count++;
}

console.log(`\n  ${C.g}✓${C.r} ${count} files written\n`);
console.log('  Next:');
console.log('    git add .');
console.log('    git commit -m "Add AI code generation with sandboxed rendering"');
console.log('    git push\n');
console.log('  Then open Settings → AI provider and paste a DeepSeek or Groq key.\n');
