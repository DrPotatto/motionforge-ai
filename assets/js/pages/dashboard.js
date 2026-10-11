import { renderSidebar } from '../components/sidebar.js';
import { storage } from '../core/storage.js';
import { defaultBrand } from '../engine/storyboard.js';
import { getProvider } from '../ai/provider.js';
import { toast } from '../components/toast.js';
import { applyConfigToPage } from '../core/config.js';

applyConfigToPage();
renderSidebar();

const $ = id => document.getElementById(id);
const promptEl = $('prompt'), aspectEl = $('aspect'), durationEl = $('duration'), qualityEl = $('quality');
const sceneEl = $('sceneCount'), langEl = $('language'), genBtn = $('generate-btn');
const statusEl = $('status'), errorEl = $('error');

let brand = storage.loadBrand() || { ...defaultBrand };

// Reflect provider
function updateEngineChip() {
  const chip = document.getElementById('engine-chip');
  const p = getProvider();
  if (p.name === 'local' || !p.configured) chip.textContent = 'Local engine';
  else chip.textContent = p.name.charAt(0).toUpperCase() + p.name.slice(1) + ' · ready';
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
refresh();

// Prefill from URL
const params = new URLSearchParams(location.search);
if (params.get('prefill')) promptEl.value = decodeURIComponent(params.get('prefill'));
if (params.get('aspect')) aspectEl.value = params.get('aspect');
if (params.get('duration')) durationEl.value = params.get('duration');
if (params.get('quality')) qualityEl.value = params.get('quality');
refresh();

// Suggestions
const SUGGESTIONS = [
  { label: 'Product ad', prompt: 'Create a 15-second cinematic launch video for a premium coffee brand with kinetic typography, glowing amber particles, animated statistics, and a dramatic final logo reveal.' },
  { label: 'SaaS explainer', prompt: 'Explain how our real-time analytics platform works in 20 seconds for engineering managers, using clean typography, animated process steps, and a soft blue-violet palette.' },
  { label: 'Logo animation', prompt: 'A 6-second elegant logo reveal for a fintech brand called Northwind with a minimal violet accent and a metallic wordmark entrance.' },
  { label: 'Social promo', prompt: 'A punchy 9:16 social promo for a new sneaker drop targeting Gen Z, with fast cuts, high-contrast kinetic type, and glowing orange particles.' },
  { label: 'Data explainer', prompt: 'A 12-second animated statistics explainer showing 3 key growth metrics for a B2B SaaS audience with a professional editorial style.' },
];
const chipBox = document.getElementById('suggestions');
chipBox.innerHTML = SUGGESTIONS.map((s, i) => '<button class="chip" data-i="' + i + '">' + s.label + '</button>').join('');
chipBox.addEventListener('click', e => {
  const btn = e.target.closest('button'); if (!btn) return;
  promptEl.value = SUGGESTIONS[Number(btn.dataset.i)].prompt;
  refresh();
});

// Generate
genBtn.addEventListener('click', async () => {
  errorEl.classList.add('hidden');
  genBtn.disabled = true;
  const original = genBtn.textContent;
  genBtn.textContent = 'Generating…';
  try {
    statusEl.textContent = 'Analyzing prompt…';
    await sleep(160);

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

    statusEl.textContent = provider.name === 'local' ? 'Building storyboard…' : 'Directing scenes with ' + provider.name + '…';
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
    else if (result.briefSource === 'ai') toast('AI brief + local storyboard', 'success');
    else toast('Generated with local engine', 'success');

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

// If auto=1 was set from landing page, trigger generate
if (params.get('auto') === '1' && promptEl.value.trim().length >= 8) {
  setTimeout(() => genBtn.click(), 200);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
