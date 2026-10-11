const listeners = new Map();
let state = { user: null, brand: null, projects: [], currentProject: null, currentSpec: null, selectedSceneId: null, selectedElementId: null, history: { past: [], future: [] }, dirty: false, lastSavedAt: null };
export const getState = () => state;
export const setState = (patch) => { state = { ...state, ...patch }; emit('*', state); Object.keys(patch).forEach(k => emit(k, state[k])); };
export const subscribe = (key, fn) => { if (!listeners.has(key)) listeners.set(key, new Set()); listeners.get(key).add(fn); return () => listeners.get(key).delete(fn); };
function emit(key, value) { const s = listeners.get(key); if (s) s.forEach(fn => { try { fn(value); } catch (e) { console.error(e); } }); }
export function pushHistory(label) { const s = getState(); if (!s.currentSpec) return; const past = [...s.history.past.slice(-49), { spec: s.currentSpec, label }]; setState({ history: { past, future: [] }, dirty: true }); }
export function undo() { const s = getState(); const past = s.history.past; if (!past.length) return false; const prev = past[past.length - 1]; const future = [{ spec: s.currentSpec, label: prev.label }, ...s.history.future].slice(0, 50); setState({ currentSpec: prev.spec, history: { past: past.slice(0, -1), future }, dirty: true }); return true; }
export function redo() { const s = getState(); const future = s.history.future; if (!future.length) return false; const next = future[0]; const past = [...s.history.past, { spec: s.currentSpec, label: next.label }]; setState({ currentSpec: next.spec, history: { past, future: future.slice(1) }, dirty: true }); return true; }
