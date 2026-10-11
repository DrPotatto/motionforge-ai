import { renderSidebar } from '../components/sidebar.js';
import { storage } from '../core/storage.js';
import { getProvider, setProvider } from '../ai/provider.js';
import { toast } from '../components/toast.js';
import { applyConfigToPage } from '../core/config.js';
import { getPlan } from '../core/billing.js';

applyConfigToPage();
renderSidebar();
const $ = id => document.getElementById(id);
const cfg = storage.loadAI();
$('provider').value = cfg.provider || (window.MF_CONFIG?.ai?.defaultProvider || 'local');
$('apiKey').value = (cfg.keys && cfg.keys[cfg.provider]) || '';
refreshUI();
// Show current plan
const planEl = document.getElementById('current-plan');
if (planEl) {
  const p = getPlan();
  planEl.textContent = p.name === 'starter' ? 'Starter (free)' : p.name.charAt(0).toUpperCase() + p.name.slice(1);
  planEl.className = 'badge ' + (p.name === 'starter' ? 'badge--info' : 'badge--success');
}
function refreshUI() {
  const p = getProvider();
  const status = $('provider-status'), keyRow = $('keyRow'), help = $('provider-help');
  if (p.name === 'local') {
    status.className = 'badge badge--info'; status.textContent = 'Offline mode';
    keyRow.style.display = 'none';
    help.textContent = 'Deterministic local engine. No API key needed. Works offline.';
  } else if (p.configured) {
    status.className = 'badge badge--success'; status.textContent = 'Key configured';
    keyRow.style.display = 'block'; help.innerHTML = linkFor(p.name);
  } else {
    status.className = 'badge badge--warn'; status.textContent = 'No key';
    keyRow.style.display = 'block'; help.innerHTML = linkFor(p.name);
  }
}
function linkFor(name) {
  const links = {
    groq: 'Free tier: 30 RPM / 14,400 RPD, no card. Get a key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener" style="color:var(--amber-500)">console.groq.com/keys</a>.',
    deepseek: 'Prepaid: top up a balance at <a href="https://platform.deepseek.com" target="_blank" rel="noopener" style="color:var(--amber-500)">platform.deepseek.com</a>. $2 is enough to start. Off-peak hours are half price.',
    gemini: 'Free tier: 15 RPM / 1,500 RPD, no card. Get a key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--amber-500)">aistudio.google.com/apikey</a>.',
    openrouter: 'Free tier: 20 RPM / 200 RPD on free models. Get a key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" style="color:var(--amber-500)">openrouter.ai/keys</a>.',
  };
  return links[name] || '';
}
$('provider').addEventListener('change', e => {
  const name = e.target.value;
  setProvider(name);
  const c2 = storage.loadAI();
  $('apiKey').value = (c2.keys && c2.keys[name]) || '';
  refreshUI();
});
$('save').addEventListener('click', () => {
  setProvider($('provider').value, $('apiKey').value.trim());
  toast('Saved', 'success');
  refreshUI();
});
$('test').addEventListener('click', async () => {
  const p = getProvider();
  if (p.name === 'local') return toast('Local engine always works', 'success');
  if (!p.key) return toast('Add an API key first', 'error');
  toast('Testing…');
  try {
    const brand = storage.loadBrand() || { name: 'Test', accent: '#ff8a3d', secondary: '#8b6dff', text: '#fff', background: '#000', fontFamily: '"Space Grotesk"' };
    const res = await p.impl.generate({
      prompt: 'A 6-second logo reveal for a modern tech brand.',
      aspect: '16:9', duration: 6, quality: 'professional', sceneCount: 3, language: 'en',
      brand, apiKey: p.key,
    });
    if (res.specSource === 'ai') toast('Connection OK — ' + p.name + ' is directing scenes.', 'success');
    else if (res.briefSource === 'ai') toast('AI brief OK, scene plan local.', 'success');
    else toast('Provider failed, fell back to local: ' + (res.error || 'unknown'), 'error', 5000);
  } catch (e) { toast('Test failed: ' + e.message, 'error', 5000); }
});
$('export-data').addEventListener('click', () => {
  const data = { projects: storage.loadProjects(), brand: storage.loadBrand(), ai: storage.loadAI(), auth: storage.loadAuth(), plan: storage.loadPlan(), exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'motionforge-backup-' + Date.now() + '.json'; a.click();
  URL.revokeObjectURL(url);
  toast('Exported', 'success');
});
$('clear-data').addEventListener('click', () => {
  if (!confirm('Delete all projects, brand kit, and settings?')) return;
  localStorage.clear();
  toast('Cleared', 'success');
  setTimeout(() => location.reload(), 500);
});
