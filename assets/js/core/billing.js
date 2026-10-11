import { storage } from './storage.js';
import { getConfig } from './config.js';

/**
 * Subscription state. Reads from storage by default.
 * checkSession() is called on the success page after returning from checkout.
 */
export function getPlan() {
  const cfg = getConfig().payments?.plans || {};
  const p = storage.loadPlan();
  return cfg[p.name] ? { id: p.name, ...cfg[p.name], activatedAt: p.activatedAt } : { id: 'starter', ...(cfg.starter || {}), activatedAt: p.activatedAt };
}

export function isPlanActive() {
  const p = storage.loadPlan();
  return p && p.name && p.name !== 'starter' && p.activatedAt;
}

export function markPlanActive(planId, provider) {
  storage.savePlan({ name: planId, activatedAt: Date.now(), provider });
}

export function clearPlan() {
  storage.savePlan({ name: 'starter', activatedAt: null, provider: null });
}
