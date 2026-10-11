import { storage } from '../core/storage.js';
import { renderFrame, layout, totalDuration } from '../engine/renderer.js';
import { makeScene } from '../engine/templates.js';
import { defaultBrand } from '../engine/storyboard.js';
import { exportVideo } from '../engine/exporter.js';
import { toast } from '../components/toast.js';
import { applyConfigToPage } from '../core/config.js';

applyConfigToPage();
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const id = params.get('id');
let project = id ? storage.loadProjects().find(p => p.id === id) : null;
if (!project) { location.href = 'app.html'; }
let spec = JSON.parse(JSON.stringify(project.spec));
let brand = project.brand || storage.loadBrand() || { ...defaultBrand };
let selectedSceneId = spec.scenes[0] ? spec.scenes[0].id : null;
let selectedElementId = null;
let history = { past: [], future: [] };
let dirty = false, time = 0, playing = false, lastFrameTime = 0, showGuides = false;

$('project-name').value = project.name;
$('project-name').addEventListener('input', e => { project.name = e.target.value; markDirty(); });

// Show spec source badge
const srcBadge = $('spec-source');
if (project.specSource === 'ai') srcBadge.textContent = 'AI-directed · ' + (project.provider || '');
else srcBadge.textContent = 'Local engine';

// Preview canvas
const canvas = $('preview-canvas');
const ctx = canvas.getContext('2d');
const previewArea = $('preview-area');
function sizeCanvas() {
  const rect = previewArea.getBoundingClientRect();
  const pad = 24, availW = rect.width - pad, availH = rect.height - pad;
  const aspect = spec.width / spec.height;
  let w = availW, h = availH;
  if (w / h > aspect) w = h * aspect; else h = w / aspect;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale((w * dpr) / spec.width, (h * dpr) / spec.height);
}
new ResizeObserver(() => { sizeCanvas(); draw(); }).observe(previewArea);
sizeCanvas();

function draw() {
  renderFrame(ctx, spec, time);
  if (showGuides) {
    ctx.save();
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = 'rgba(255,138,61,0.25)';
    ctx.strokeRect(rect.width * 0.05, rect.height * 0.05, rect.width * 0.9, rect.height * 0.9);
    ctx.strokeStyle = 'rgba(255,138,61,0.1)';
    ctx.strokeRect(rect.width * 0.1, rect.height * 0.1, rect.width * 0.8, rect.height * 0.8);
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale((canvas.width) / spec.width, (canvas.height) / spec.height);
  }
  updatePlayhead(); updateTimeDisplay();
}
function frame(now) {
  if (playing) {
    const dt = (now - lastFrameTime) / 1000; lastFrameTime = now;
    time += dt;
    if (time >= totalDuration(spec)) time = 0;
    draw();
  } else { lastFrameTime = now; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(t => { lastFrameTime = t; frame(t); });

$('btn-play').addEventListener('click', () => { playing = !playing; $('btn-play').textContent = playing ? '❚❚' : '▶'; });
$('btn-restart').addEventListener('click', () => { time = 0; draw(); });
$('btn-guides').addEventListener('click', () => { showGuides = !showGuides; draw(); });

function renderSceneList() {
  const list = $('scene-list'); list.innerHTML = '';
  spec.scenes.forEach((s, i) => {
    const el = document.createElement('button');
    el.className = 'scene-item' + (s.id === selectedSceneId ? ' is-selected' : '');
    el.innerHTML = '<div class="scene-item__top"><span class="scene-item__num">' + String(i + 1).padStart(2, '0') + '</span><span class="scene-item__name">' + esc(s.name) + '</span><span class="scene-item__dur">' + s.duration.toFixed(1) + 's</span></div><div class="scene-item__tpl">' + s.template + '</div>';
    el.addEventListener('click', () => {
      selectedSceneId = s.id; selectedElementId = null;
      const arr = layout(spec); const target = arr.find(x => x.scene.id === s.id);
      if (target) time = target.start;
      renderSceneList(); renderLayerList(); renderInspector(); renderTimeline(); draw();
    });
    list.appendChild(el);
  });
}
function renderLayerList() {
  const list = $('layer-list');
  const s = spec.scenes.find(x => x.id === selectedSceneId);
  if (!s) { list.innerHTML = ''; return; }
  list.innerHTML = '';
  s.elements.forEach(el => {
    const btn = document.createElement('button');
    btn.className = 'scene-item' + (el.id === selectedElementId ? ' is-selected' : '');
    btn.innerHTML = '<div class="scene-item__top"><span class="scene-item__num">' + el.kind.slice(0, 3) + '</span><span class="scene-item__name">' + esc(el.content || el.shape || el.kind) + '</span></div>';
    btn.addEventListener('click', () => { selectedElementId = el.id; renderLayerList(); renderInspector(); draw(); });
    list.appendChild(btn);
  });
}

function renderTimeline() {
  const track = $('timeline-track');
  track.innerHTML = '<div class="timeline__playhead" id="playhead" style="left:0%"></div>';
  const arr = layout(spec);
  const total = totalDuration(spec) || 1;
  arr.forEach(l => {
    const left = (l.start / total) * 100, w = ((l.end - l.start) / total) * 100;
    const block = document.createElement('div');
    block.className = 'timeline__block' + (l.scene.id === selectedSceneId ? ' is-selected' : '');
    block.style.left = left + '%'; block.style.width = w + '%';
    block.textContent = l.scene.name;
    block.addEventListener('mousedown', e => {
      e.stopPropagation();
      selectedSceneId = l.scene.id; time = l.start;
      renderSceneList(); renderLayerList(); renderInspector(); renderTimeline(); draw();
    });
    track.appendChild(block);
  });
  track.onmousedown = e => {
    if (e.target !== track) return;
    const rect = track.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    time = p * total; draw();
  };
  const s = spec.scenes.find(x => x.id === selectedSceneId);
  const controls = $('timeline-controls');
  if (!s) { controls.innerHTML = ''; return; }
  controls.innerHTML = '<span style="color:var(--text-muted)">Selected: ' + esc(s.name) + '</span>'
    + '<label style="margin-left:auto;display:flex;gap:6px;align-items:center">Duration <input type="number" id="dur-input" min="1" max="30" step="0.25" value="' + s.duration + '"> s</label>'
    + '<button id="sc-left" class="btn btn-subtle btn-sm">←</button>'
    + '<button id="sc-right" class="btn btn-subtle btn-sm">→</button>'
    + '<button id="sc-dup" class="btn btn-subtle btn-sm">Duplicate</button>'
    + '<button id="sc-del" class="btn btn-subtle btn-sm" style="color:#fca5a5">Delete</button>';
  $('dur-input').addEventListener('change', e => {
    pushHistory('Change duration');
    s.duration = Math.max(1, Math.min(30, parseFloat(e.target.value) || s.duration));
    renderSceneList(); renderTimeline(); draw(); markDirty();
  });
  $('sc-left').addEventListener('click', () => moveScene(-1));
  $('sc-right').addEventListener('click', () => moveScene(1));
  $('sc-dup').addEventListener('click', () => {
    pushHistory('Duplicate');
    const copy = JSON.parse(JSON.stringify(s));
    copy.id = 'sc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    copy.name = s.name + ' copy';
    copy.elements = copy.elements.map(el => ({ ...el, id: 'el_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }));
    const i = spec.scenes.findIndex(x => x.id === s.id);
    spec.scenes.splice(i + 1, 0, copy);
    selectedSceneId = copy.id;
    renderSceneList(); renderTimeline(); draw(); markDirty();
  });
  $('sc-del').addEventListener('click', () => {
    if (spec.scenes.length <= 1) return toast('Cannot delete the last scene', 'error');
    pushHistory('Delete scene');
    spec.scenes = spec.scenes.filter(x => x.id !== s.id);
    selectedSceneId = spec.scenes[0].id; selectedElementId = null;
    renderSceneList(); renderTimeline(); renderLayerList(); renderInspector(); draw(); markDirty();
  });
}
function moveScene(dir) {
  const i = spec.scenes.findIndex(x => x.id === selectedSceneId), j = i + dir;
  if (i < 0 || j < 0 || j >= spec.scenes.length) return;
  pushHistory('Reorder');
  [spec.scenes[i], spec.scenes[j]] = [spec.scenes[j], spec.scenes[i]];
  renderSceneList(); renderTimeline(); draw(); markDirty();
}
function updatePlayhead() {
  const total = totalDuration(spec) || 1;
  const ph = $('playhead'); if (ph) ph.style.left = ((time / total) * 100) + '%';
}
function updateTimeDisplay() {
  $('time-display').textContent = fmt(time) + ' / ' + fmt(totalDuration(spec));
  $('scene-info').textContent = spec.scenes.length + ' scenes · ' + spec.width + '×' + spec.height + ' · 30 fps';
}
const fmt = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') + '.' + String(Math.floor((t % 1) * 100)).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderInspector() {
  const s = spec.scenes.find(x => x.id === selectedSceneId);
  const insp = $('inspector');
  if (!s) { insp.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:12px">Select a scene.</div>'; return; }
  const el = s.elements.find(e => e.id === selectedElementId);
  insp.innerHTML = '';
  insp.appendChild(section('Scene', [
    textField('Name', s.name, v => { pushHistory('Rename'); s.name = v; renderSceneList(); renderTimeline(); markDirty(); }),
    colorField('Background', s.background, v => { pushHistory('Bg'); s.background = v; draw(); markDirty(); }),
    colorField('Accent', s.accent, v => { pushHistory('Accent'); s.accent = v; draw(); markDirty(); }),
    selectField('Transition', s.transition, ['none','fade','slide','wipe','zoom'], v => { pushHistory('Trans'); s.transition = v; draw(); markDirty(); }),
    rangeField('Camera', s.cameraIntensity, 0, 1, 0.01, v => { pushHistory('Cam'); s.cameraIntensity = v; draw(); markDirty(); }),
  ]));
  if (el && el.kind === 'text') {
    insp.appendChild(section('Text', [
      textareaField('Content', el.content, v => { el.content = v; draw(); markDirty(); }),
      selectField('Font', el.fontFamily, ['"Space Grotesk"','Inter','"JetBrains Mono"','"Noto Sans Arabic"'], v => { el.fontFamily = v; draw(); markDirty(); }),
      selectField('Weight', String(el.fontWeight), ['300','400','500','600','700','800'], v => { el.fontWeight = Number(v); draw(); markDirty(); }),
      numField('Size', el.fontSize, 12, 300, 2, v => { el.fontSize = v; draw(); markDirty(); }),
      numField('Line', el.lineHeight, 0.8, 2.4, 0.05, v => { el.lineHeight = v; draw(); markDirty(); }),
      numField('Tracking', el.letterSpacing, -4, 20, 0.5, v => { el.letterSpacing = v; draw(); markDirty(); }),
      colorField('Color', el.color, v => { el.color = v; draw(); markDirty(); }),
      selectField('Align', el.align, ['left','center','right'], v => { el.align = v; draw(); markDirty(); }),
      selectField('Direction', el.direction, ['ltr','rtl'], v => { el.direction = v; draw(); markDirty(); }),
      numField('X', el.x, 0, 1, 0.01, v => { el.x = v; draw(); markDirty(); }),
      numField('Y', el.y, 0, 1, 0.01, v => { el.y = v; draw(); markDirty(); }),
      numField('Rotation', el.rotation, -180, 180, 1, v => { el.rotation = v; draw(); markDirty(); }),
      numField('Scale', el.scale, 0.1, 3, 0.05, v => { el.scale = v; draw(); markDirty(); }),
      selectField('In', el.entrance.type, ['none','fade','slideUp','slideDown','slideLeft','slideRight','scale','blur','maskUp'], v => { el.entrance.type = v; draw(); markDirty(); }),
      selectField('Out', el.exit.type, ['none','fade','slideUp','slideDown','slideLeft','slideRight','scale','blur','maskUp'], v => { el.exit.type = v; draw(); markDirty(); }),
    ]));
  }
  if (el && el.kind === 'particles') {
    insp.appendChild(section('Particles', [
      colorField('Color', el.color, v => { el.color = v; draw(); markDirty(); }),
      rangeField('Intensity', el.intensity, 0, 1.5, 0.05, v => { el.intensity = v; draw(); markDirty(); }),
    ]));
  }
  if (el && el.kind === 'shape') {
    insp.appendChild(section('Shape', [
      colorField('Color', el.color, v => { el.color = v; draw(); markDirty(); }),
      numField('Radius', el.radius, 0, 40, 1, v => { el.radius = v; draw(); markDirty(); }),
      numField('Stroke', el.strokeWidth, 0, 20, 0.5, v => { el.strokeWidth = v; draw(); markDirty(); }),
    ]));
  }
}
function section(title, controls) {
  const div = document.createElement('div'); div.className = 'inspector-section';
  const h = document.createElement('div'); h.className = 'label'; h.textContent = title; div.appendChild(h);
  controls.forEach(c => div.appendChild(c));
  return div;
}
function textField(label, value, onChange) {
  const w = document.createElement('label'); w.style.display = 'block'; w.style.marginTop = '8px';
  w.innerHTML = '<span class="inspector-label">' + label + '</span>';
  const i = document.createElement('input'); i.className = 'field field-sm'; i.value = value || '';
  i.addEventListener('change', e => onChange(e.target.value));
  w.appendChild(i); return w;
}
function textareaField(label, value, onChange) {
  const w = document.createElement('label'); w.style.display = 'block'; w.style.marginTop = '8px';
  w.innerHTML = '<span class="inspector-label">' + label + '</span>';
  const i = document.createElement('textarea'); i.className = 'field field-sm'; i.rows = 3; i.value = value || '';
  i.addEventListener('input', e => onChange(e.target.value));
  w.appendChild(i); return w;
}
function colorField(label, value, onChange) {
  const w = document.createElement('label'); w.style.display = 'block'; w.style.marginTop = '8px';
  w.innerHTML = '<span class="inspector-label">' + label + '</span>';
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;align-items:center';
  const p = document.createElement('input'); p.type = 'color'; p.value = value;
  const t = document.createElement('input'); t.className = 'field field-sm'; t.style.flex = '1'; t.value = value;
  p.addEventListener('input', e => { t.value = e.target.value; onChange(e.target.value); });
  t.addEventListener('change', e => { p.value = e.target.value; onChange(e.target.value); });
  row.appendChild(p); row.appendChild(t); w.appendChild(row); return w;
}
function selectField(label, value, options, onChange) {
  const w = document.createElement('label'); w.style.display = 'block'; w.style.marginTop = '8px';
  w.innerHTML = '<span class="inspector-label">' + label + '</span>';
  const s = document.createElement('select'); s.className = 'field field-sm';
  options.forEach(o => { const opt = document.createElement('option'); opt.value = o; opt.textContent = o; opt.style.background = '#0f1216'; s.appendChild(opt); });
  s.value = value;
  s.addEventListener('change', e => onChange(e.target.value));
  w.appendChild(s); return w;
}
function numField(label, value, min, max, step, onChange) {
  const w = document.createElement('label'); w.style.display = 'block'; w.style.marginTop = '8px';
  w.innerHTML = '<span class="inspector-label">' + label + '</span>';
  const i = document.createElement('input'); i.type = 'number'; i.className = 'field field-sm';
  i.min = min; i.max = max; i.step = step;
  i.value = Number.isFinite(value) ? +value.toFixed(2) : 0;
  i.addEventListener('change', e => onChange(parseFloat(e.target.value)));
  w.appendChild(i); return w;
}
function rangeField(label, value, min, max, step, onChange) {
  const w = document.createElement('label'); w.style.display = 'block'; w.style.marginTop = '8px';
  w.innerHTML = '<span class="inspector-label">' + label + '</span>';
  const i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = value;
  i.addEventListener('input', e => onChange(parseFloat(e.target.value)));
  w.appendChild(i); return w;
}

$('btn-add-scene').addEventListener('click', () => {
  pushHistory('Add scene');
  const scene = makeScene('kineticHeadline', 3, '#0b0d10', brand.accent, brand, spec.quality, 'fade', 0.2, { title: 'New scene', subtitle: 'Describe the moment' });
  spec.scenes.push(scene); selectedSceneId = scene.id;
  renderSceneList(); renderTimeline(); renderInspector(); draw(); markDirty();
});
$('btn-add-text').addEventListener('click', () => {
  const s = spec.scenes.find(x => x.id === selectedSceneId); if (!s) return;
  pushHistory('Add text');
  const el = {
    id: 'el_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    kind: 'text', content: 'New text', x: 0.5, y: 0.5, fontSize: 96,
    fontFamily: '"Space Grotesk", "Inter", "Noto Sans Arabic", sans-serif',
    fontWeight: 700, color: '#ffffff', align: 'center', direction: 'ltr',
    letterSpacing: 0, lineHeight: 1.1, opacity: 1, rotation: 0, scale: 1, glow: true,
    start: 0, end: s.duration,
    entrance: { type: 'slideUp', duration: 0.7, easing: 'easeOutCubic', delay: 0 },
    exit: { type: 'fade', duration: 0.4, easing: 'easeInQuad', delay: 0 },
  };
  s.elements.push(el); selectedElementId = el.id;
  renderLayerList(); renderInspector(); draw(); markDirty();
});

function pushHistory(label) {
  history.past.push({ spec: JSON.parse(JSON.stringify(spec)), label });
  if (history.past.length > 50) history.past.shift();
  history.future = []; updateUndoRedo();
}
function undo() {
  if (!history.past.length) return;
  const prev = history.past.pop();
  history.future.unshift({ spec: JSON.parse(JSON.stringify(spec)), label: prev.label });
  spec = prev.spec;
  if (!spec.scenes.find(x => x.id === selectedSceneId)) selectedSceneId = spec.scenes[0] && spec.scenes[0].id;
  renderSceneList(); renderTimeline(); renderLayerList(); renderInspector(); draw(); markDirty(); updateUndoRedo();
}
function redo() {
  if (!history.future.length) return;
  const next = history.future.shift();
  history.past.push({ spec: JSON.parse(JSON.stringify(spec)), label: next.label });
  spec = next.spec;
  if (!spec.scenes.find(x => x.id === selectedSceneId)) selectedSceneId = spec.scenes[0] && spec.scenes[0].id;
  renderSceneList(); renderTimeline(); renderLayerList(); renderInspector(); draw(); markDirty(); updateUndoRedo();
}
function updateUndoRedo() { $('btn-undo').disabled = !history.past.length; $('btn-redo').disabled = !history.future.length; }
$('btn-undo').addEventListener('click', undo);
$('btn-redo').addEventListener('click', redo);

document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  const inField = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); return; }
  if (inField) return;
  if (e.key === ' ') { e.preventDefault(); playing = !playing; $('btn-play').textContent = playing ? '❚❚' : '▶'; }
  if (e.key === 'ArrowLeft') { time = Math.max(0, time - 0.1); draw(); }
  if (e.key === 'ArrowRight') { time = Math.min(totalDuration(spec), time + 0.1); draw(); }
});

let saveTimer = null;
function markDirty() {
  dirty = true; $('save-indicator').textContent = 'Saving…';
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 700);
}
function doSave() {
  project.spec = spec; project.updatedAt = Date.now();
  const list = storage.loadProjects();
  const i = list.findIndex(p => p.id === project.id);
  if (i >= 0) list[i] = project; else list.unshift(project);
  storage.saveProjects(list);
  dirty = false; $('save-indicator').textContent = 'Saved';
}

function setupResizer(handleId, side) {
  const handle = $(handleId);
  const leftPanel = document.querySelector('.editor-panel--left');
  const rightPanel = document.querySelector('.editor-panel--right');
  let dragging = false, startX = 0, startW = 0;
  handle.addEventListener('mousedown', e => {
    dragging = true; startX = e.clientX;
    startW = side === 'left' ? leftPanel.offsetWidth : rightPanel.offsetWidth;
    document.body.style.cursor = 'col-resize';
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (side === 'left') leftPanel.style.width = Math.max(180, Math.min(380, startW + dx)) + 'px';
    else rightPanel.style.width = Math.max(240, Math.min(420, startW - dx)) + 'px';
    sizeCanvas(); draw();
  });
  window.addEventListener('mouseup', () => { dragging = false; document.body.style.cursor = ''; });
}
setupResizer('resizer-left', 'left');
setupResizer('resizer-right', 'right');

$('btn-export').addEventListener('click', () => openExportModal());

function openExportModal() {
  const root = $('modal-root'); root.innerHTML = '';
  const backdrop = document.createElement('div'); backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div'); modal.className = 'modal';
  modal.innerHTML = ''
    + '<div style="display:flex;align-items:center"><h2 class="modal__title">Export video</h2><button id="close-modal" class="btn btn-subtle btn-sm" style="margin-left:auto">✕</button></div>'
    + '<p style="color:var(--text-secondary);font-size:13px;margin-top:10px">Renders in real time from the current spec and records the canvas. Output format depends on your browser (WebM on Chrome/Edge/Firefox; MP4 attempted when supported).</p>'
    + '<div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">'
    +   '<button class="scale-btn btn btn-ghost btn-sm" data-scale="0.5">Half</button>'
    +   '<button class="scale-btn btn btn-primary btn-sm" data-scale="1">Full</button>'
    +   '<button class="scale-btn btn btn-ghost btn-sm" data-scale="1.5">1.5×</button>'
    + '</div>'
    + '<div id="export-info" style="margin-top:12px;font-size:11px;color:var(--text-muted)">Output: ' + spec.width + ' × ' + spec.height + ' · 30 fps</div>'
    + '<div id="export-progress" class="hidden" style="margin-top:16px"><div class="progress"><div class="progress__bar" style="width:0%"></div></div><div style="margin-top:6px;font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">0%</div></div>'
    + '<div id="export-error" class="hidden error-box" style="margin-top:12px"></div>'
    + '<div id="export-result" class="hidden" style="margin-top:16px"><div id="export-msg" style="font-size:13px;color:#6ee7b7"></div><video id="export-video" controls style="margin-top:10px;width:100%;border-radius:6px;border:1px solid var(--ink-800)"></video></div>'
    + '<div style="margin-top:20px;display:flex;gap:8px;justify-content:flex-end">'
    +   '<button id="export-cancel" class="btn btn-ghost">Cancel</button>'
    +   '<button id="export-start" class="btn btn-primary">Start export</button>'
    + '</div>';
  backdrop.appendChild(modal); root.appendChild(backdrop);
  let scale = 1;
  modal.querySelectorAll('.scale-btn').forEach(b => {
    b.addEventListener('click', () => {
      scale = parseFloat(b.dataset.scale);
      modal.querySelectorAll('.scale-btn').forEach(x => { x.classList.toggle('btn-primary', x === b); x.classList.toggle('btn-ghost', x !== b); });
      $('export-info').textContent = 'Output: ' + Math.round(spec.width * scale) + ' × ' + Math.round(spec.height * scale) + ' · 30 fps';
    });
  });
  const close = () => { root.innerHTML = ''; };
  $('close-modal').addEventListener('click', close);
  $('export-cancel').addEventListener('click', close);
  let abortController = null;
  $('export-start').addEventListener('click', async () => {
    $('export-error').classList.add('hidden');
    $('export-result').classList.add('hidden');
    $('export-progress').classList.remove('hidden');
    $('export-start').disabled = true;
    abortController = new AbortController();
    const started = Date.now();
    try {
      const res = await exportVideo({
        spec, fps: 30, scale,
        onProgress: p => {
          modal.querySelector('.progress__bar').style.width = (p * 100) + '%';
          modal.querySelector('#export-progress > div:last-child').textContent = Math.round(p * 100) + '% · ' + ((Date.now() - started) / 1000).toFixed(1) + 's';
        },
        signal: abortController.signal,
      });
      const url = URL.createObjectURL(res.blob);
      $('export-result').classList.remove('hidden');
      $('export-msg').textContent = 'Export complete · ' + (res.blob.size / 1000000).toFixed(2) + ' MB · .' + res.extension;
      $('export-video').src = url;
      const a = document.createElement('a');
      a.href = url;
      a.download = (project.name || 'animation').replace(/\s+/g, '-').toLowerCase() + '-' + Date.now() + '.' + res.extension;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) {
      $('export-error').classList.remove('hidden');
      $('export-error').textContent = e.message || 'Export failed';
    } finally {
      $('export-start').disabled = false;
      $('export-progress').classList.add('hidden');
    }
  });
}

renderSceneList(); renderTimeline(); renderLayerList(); renderInspector(); updateUndoRedo(); draw();
