const KEYS = {
  PROJECTS: 'motionforge:projects:v1',
  BRAND: 'motionforge:brand:v1',
  AI: 'motionforge:ai:v1',
  AUTH: 'motionforge:auth:v1',
  PLAN: 'motionforge:plan:v1',
};
const read = (k, d) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn('Storage write failed', e); } };

export const storage = {
  loadProjects: () => read(KEYS.PROJECTS, []),
  saveProjects: (l) => write(KEYS.PROJECTS, l),
  loadBrand: () => read(KEYS.BRAND, null),
  saveBrand: (b) => write(KEYS.BRAND, b),
  loadAI: () => read(KEYS.AI, { provider: 'local', keys: {} }),
  saveAI: (c) => write(KEYS.AI, c),
  loadAuth: () => read(KEYS.AUTH, null),
  saveAuth: (u) => write(KEYS.AUTH, u),
  clearAuth: () => localStorage.removeItem(KEYS.AUTH),
  loadPlan: () => read(KEYS.PLAN, { name: 'starter', activatedAt: null, provider: null }),
  savePlan: (p) => write(KEYS.PLAN, p),
};
