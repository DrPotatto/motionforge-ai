import { storage } from './storage.js';

/**
 * Auth adapter. Default mode is "local" (for demo only, NOT secure).
 * Set config.auth.mode = 'supabase' to enable real Supabase Auth.
 * The rest of the app reads user state through this interface only.
 */
export const auth = {
  current() {
    return storage.loadAuth();
  },
  async signUp(email, password) {
    if (!email || !password) throw new Error('Email and password are required');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');
    const cfg = window.MF_CONFIG?.auth;
    if (cfg?.mode === 'supabase' && cfg.supabaseUrl && cfg.supabaseAnonKey) {
      const res = await fetch(cfg.supabaseUrl + '/auth/v1/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': cfg.supabaseAnonKey },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Sign-up failed');
      const data = await res.json();
      const user = { id: data.user?.id || cryptoId(), email, createdAt: Date.now(), plan: 'free' };
      storage.saveAuth(user);
      return user;
    }
    const user = { id: cryptoId(), email, createdAt: Date.now(), plan: 'free' };
    storage.saveAuth(user);
    return user;
  },
  async signIn(email, password) {
    if (!email || !password) throw new Error('Email and password are required');
    const cfg = window.MF_CONFIG?.auth;
    if (cfg?.mode === 'supabase' && cfg.supabaseUrl && cfg.supabaseAnonKey) {
      const res = await fetch(cfg.supabaseUrl + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': cfg.supabaseAnonKey },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Invalid email or password');
      const data = await res.json();
      const user = { id: data.user?.id || cryptoId(), email, createdAt: Date.now(), plan: 'free' };
      storage.saveAuth(user);
      return user;
    }
    const user = { id: cryptoId(), email, createdAt: Date.now(), plan: 'free' };
    storage.saveAuth(user);
    return user;
  },
  signOut() { storage.clearAuth(); },
  isSignedIn() { return !!storage.loadAuth(); },
  requireAuth(redirect = 'login.html') {
    if (!this.isSignedIn()) {
      window.location.replace(redirect + '?next=' + encodeURIComponent(location.pathname));
      return false;
    }
    return true;
  },
};
function cryptoId() {
  return 'u_' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10));
}
