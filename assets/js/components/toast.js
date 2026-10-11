let stack;
function ensureStack() { if (!stack) stack = document.getElementById('toast-stack') || createStack(); return stack; }
function createStack() { const el = document.createElement('div'); el.className = 'toast-stack'; el.id = 'toast-stack'; document.body.appendChild(el); return el; }
export function toast(message, type = 'default', duration = 3200) {
  const s = ensureStack();
  const el = document.createElement('div');
  el.className = 'toast' + (type !== 'default' ? ' toast--' + type : '');
  el.innerHTML = '<span>' + message + '</span><button aria-label="Dismiss" style="color:var(--text-muted);padding:0 4px">✕</button>';
  el.querySelector('button').addEventListener('click', () => el.remove());
  s.appendChild(el);
  if (duration > 0) setTimeout(() => el.remove(), duration);
  return el;
}
