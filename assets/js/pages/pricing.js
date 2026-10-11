import { getConfig, applyConfigToPage } from '../core/config.js';
import { getPlan, isPlanActive, markPlanActive } from '../core/billing.js';
import { storage } from '../core/storage.js';

applyConfigToPage();

const cfg = getConfig();
const plans = cfg.payments?.plans || {};
const container = document.getElementById('plans');
const note = document.getElementById('payments-note');

const order = ['starter', 'studio', 'agency'];
const featured = 'studio';

container.innerHTML = order.map(id => {
  const p = plans[id]; if (!p) return '';
  const isFeatured = id === featured;
  const hasCheckout = !!p.checkoutUrl;
  const ctaLabel = id === 'starter' ? 'Start free' : (hasCheckout ? 'Upgrade →' : 'Coming soon');
  return ''
    + '<div class="plan' + (isFeatured ? ' is-featured' : '') + '">'
    + (isFeatured ? '<div class="plan__ribbon">Most popular</div>' : '')
    + '<div class="plan__name">' + escapeHtml(p.name) + '</div>'
    + '<div class="plan__price">' + escapeHtml(p.price) + ' <small>' + escapeHtml(p.cadence || '') + '</small></div>'
    + '<ul class="plan__features">' + (p.features || []).map(f => '<li>' + escapeHtml(f) + '</li>').join('') + '</ul>'
    + '<button class="btn ' + (id === 'starter' ? 'btn-ghost' : 'btn-primary') + ' plan__cta" data-plan="' + id + '"' + (!hasCheckout && id !== 'starter' ? ' disabled' : '') + '>' + ctaLabel + '</button>'
    + '</div>';
}).join('');

container.addEventListener('click', e => {
  const btn = e.target.closest('[data-plan]'); if (!btn) return;
  const planId = btn.dataset.plan;
  const plan = plans[planId];
  if (planId === 'starter') { location.href = 'app.html'; return; }
  if (!plan || !plan.checkoutUrl) {
    alert('Checkout is not configured yet. See DEPLOY.md → Payments.');
    return;
  }
  // Redirect to hosted checkout
  const url = plan.checkoutUrl
    .replace('{success}', encodeURIComponent(location.origin + '/' + (cfg.payments?.successUrl || 'checkout-success.html') + '?plan=' + planId))
    .replace('{cancel}', encodeURIComponent(location.origin + '/' + (cfg.payments?.cancelUrl || 'checkout-cancel.html')));
  location.href = url;
});

// Payments note
if (!note) return;
const anyCheckout = Object.values(plans).some(p => p.checkoutUrl);
if (!anyCheckout) {
  note.innerHTML = '⚠ Checkout URLs are not configured yet. Edit <code style="color:var(--amber-500)">config.js</code> and paste your LemonSqueezy / Gumroad / Stripe checkout URLs. See <code style="color:var(--amber-500)">DEPLOY.md</code>.';
} else if (isPlanActive()) {
  const p = getPlan();
  note.innerHTML = 'Active plan: <strong>' + escapeHtml(p.name) + '</strong>';
} else {
  note.textContent = 'Payments are processed by our payment provider. Cancel anytime from their billing portal.';
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
