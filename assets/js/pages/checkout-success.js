import { getConfig, applyConfigToPage } from '../core/config.js';
import { markPlanActive, getPlan } from '../core/billing.js';

applyConfigToPage();
const params = new URLSearchParams(location.search);
const planId = params.get('plan') || params.get('checkout[plan]') || 'studio';
const provider = getConfig().payments?.provider || 'unknown';

// Note: in a real deployment, verify the subscription server-side via a webhook.
// This frontend-only activation is fine for MVP. See DEPLOY.md → Webhooks.
markPlanActive(planId, provider);

const badge = document.getElementById('plan-badge');
if (badge) badge.textContent = 'Plan active: ' + (getPlan().name || planId);
