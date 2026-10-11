import { groq } from './groq.js';
import { gemini } from './gemini-v2.js';
import { openrouter } from './openrouter.js';
import { local } from './local.js';
import { deepseek } from './deepseek.js'; 
import { storage } from '../core/storage.js';

const PROVIDERS = { groq, gemini, openrouter, local, deepseek };
export function getProvider() {
  const cfg = storage.loadAI();
  const name = cfg.provider || (window.MF_CONFIG?.ai?.defaultProvider || 'local');
  const impl = PROVIDERS[name] || local;
  return { name, impl, key: (cfg.keys && cfg.keys[name]) || '', configured: name === 'local' || !!(cfg.keys && cfg.keys[name]) };
}
export function setProvider(name, apiKey) {
  const cfg = storage.loadAI();
  cfg.provider = name;
  cfg.keys = cfg.keys || {};
  if (apiKey) cfg.keys[name] = apiKey;
  storage.saveAI(cfg);
}
export function setApiKey(name, apiKey) {
  const cfg = storage.loadAI();
  cfg.keys = cfg.keys || {};
  cfg.keys[name] = apiKey;
  storage.saveAI(cfg);
}
