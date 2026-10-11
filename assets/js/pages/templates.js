import { renderSidebar } from '../components/sidebar.js';
import { TEMPLATE_META, makeScene } from '../engine/templates.js';
import { storage } from '../core/storage.js';
import { defaultBrand, ASPECT_DIMS } from '../engine/storyboard.js';
import { toast } from '../components/toast.js';
import { applyConfigToPage } from '../core/config.js';
applyConfigToPage();
renderSidebar();
const grid = document.getElementById('templates-grid');
const brand = storage.loadBrand() || defaultBrand;
grid.innerHTML = TEMPLATE_META.map(t =>
  '<button class="card" data-tpl="' + t.id + '" style="text-align:left">'
  + '<div style="aspect-ratio:16/9;border-radius:6px;background:linear-gradient(135deg,var(--ink-800),var(--ink-900));border:1px solid rgba(35,42,50,.6);position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:radial-gradient(160px 80px at 50% 100%,rgba(255,138,61,.28),transparent)"></div></div>'
  + '<div style="font-size:13.5px;font-weight:500;margin-top:10px">' + t.label + '</div>'
  + '<div style="font-size:11px;color:var(--text-muted)">' + t.description + '</div>'
  + '</button>'
).join('');

grid.addEventListener('click', e => {
  const btn = e.target.closest('[data-tpl]'); if (!btn) return;
  const tplId = btn.dataset.tpl;
  const scene = makeScene(tplId, 5, brand.background, brand.accent, brand, 'cinematic', 'fade', 0.35, {
    title: sampleTitle(tplId), subtitle: sampleSubtitle(tplId),
    cta: 'Get started', bullets: ['Precision', 'Speed', 'Clarity', 'Control'],
    stats: [{ label: 'Faster', value: '12×' }, { label: 'Retention', value: '+64%' }, { label: 'Edits', value: '∞' }],
  });
  const dims = ASPECT_DIMS['16:9'];
  const spec = { version: 1, width: dims.w, height: dims.h, fps: 30, quality: 'cinematic', scenes: [scene] };
  const id = 'prj_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const project = {
    id, name: sampleTitle(tplId), createdAt: Date.now(), updatedAt: Date.now(),
    brand, version: 1, source: 'template', specSource: 'template', provider: 'local',
    brief: { concept: 'Template: ' + tplId, audience: 'General', purpose: 'Template', keyMessage: sampleTitle(tplId),
      tone: 'Professional', palette: [brand.accent, brand.secondary], style: 'cinematic', sceneCount: 1,
      duration: 5, aspect: '16:9', quality: 'cinematic', language: 'en', callToAction: 'Get started',
      title: sampleTitle(tplId), source: 'template' },
    spec,
  };
  const list = storage.loadProjects(); list.unshift(project); storage.saveProjects(list);
  toast('Template opened', 'success');
  location.href = 'editor.html?id=' + encodeURIComponent(id);
});

function sampleTitle(id) {
  return ({
    logoReveal: 'Northwind', kineticHeadline: 'Motion, without friction', productShowcase: 'The new standard',
    animatedStats: 'Measured impact', featureGrid: 'Built for the details', processSteps: 'From idea to export',
    callToAction: 'Start creating', quoteCard: 'Every second should mean something',
  })[id] || 'Template scene';
}
function sampleSubtitle(id) {
  return ({
    logoReveal: 'A new standard', kineticHeadline: 'A studio in your browser',
    productShowcase: 'Precision in every frame', callToAction: 'MotionForge AI', quoteCard: 'MotionForge AI',
  })[id] || '';
}
