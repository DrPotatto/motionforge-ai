import { renderSidebar } from '../components/sidebar.js';
import { storage } from '../core/storage.js';
import { toast } from '../components/toast.js';
import { totalDuration } from '../engine/renderer.js';
import { applyConfigToPage } from '../core/config.js';
applyConfigToPage();
renderSidebar();
const grid = document.getElementById('projects-grid');
const empty = document.getElementById('empty');
const search = document.getElementById('search');
let all = storage.loadProjects();

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function render() {
  const q = (search.value || '').toLowerCase();
  const filtered = all.filter(p => (p.name || '').toLowerCase().includes(q));
  grid.innerHTML = '';
  if (!filtered.length) { empty.classList.toggle('hidden', !!q); return; }
  empty.classList.add('hidden');
  filtered.sort((a, b) => b.updatedAt - a.updatedAt).forEach(p => {
    const dur = p.spec ? totalDuration(p.spec) : 0;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = ''
      + '<div style="aspect-ratio:16/9;border-radius:8px;background:linear-gradient(135deg,var(--ink-800),var(--ink-900));border:1px solid rgba(35,42,50,.6);position:relative;overflow:hidden">'
      +   '<div style="position:absolute;inset:0;background:radial-gradient(180px 90px at 50% 110%,rgba(255,138,61,.30),transparent)"></div>'
      +   '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 12px">'
      +     '<span style="font-family:var(--font-display);font-size:22px;font-weight:600;color:rgba(255,255,255,.85);text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%">' + esc((p.brief && p.brief.title) || p.name) + '</span>'
      +   '</div>'
      + '</div>'
      + '<div style="margin-top:12px">'
      +   '<div style="font-size:13.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(p.name) + '</div>'
      +   '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + (p.spec && p.spec.scenes ? p.spec.scenes.length : 0) + ' scenes · ' + dur.toFixed(1) + 's · ' + ((p.brief && p.brief.aspect) || '16:9') + '</div>'
      + '</div>'
      + '<div style="margin-top:12px;display:flex;gap:6px;align-items:center">'
      +   '<a class="btn btn-primary btn-sm" href="editor.html?id=' + p.id + '">Open</a>'
      +   '<button class="btn btn-subtle btn-sm" data-action="dup" data-id="' + p.id + '">Duplicate</button>'
      +   '<button class="btn btn-subtle btn-sm" data-action="del" data-id="' + p.id + '" style="color:#fca5a5;margin-left:auto">Delete</button>'
      + '</div>';
    grid.appendChild(card);
  });
}

grid.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]'); if (!btn) return;
  const id = btn.dataset.id;
  const p = all.find(x => x.id === id); if (!p) return;
  if (btn.dataset.action === 'dup') {
    const copy = JSON.parse(JSON.stringify(p));
    copy.id = 'prj_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    copy.name = p.name + ' (copy)';
    copy.createdAt = Date.now(); copy.updatedAt = Date.now();
    all.unshift(copy); storage.saveProjects(all); render();
    toast('Duplicated', 'success');
  } else if (btn.dataset.action === 'del') {
    if (!confirm('Delete "' + p.name + '"?')) return;
    all = all.filter(x => x.id !== id);
    storage.saveProjects(all); render();
    toast('Deleted', 'success');
  }
});
search.addEventListener('input', render);
render();
