// Tout est gardé dans le localStorage du navigateur : rien n'est envoyé ailleurs.
import { defaultConfig, normalize } from './config.js';

const KEY = 'tierlist:config';

export function loadConfig() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) {
    console.warn('Config locale illisible, retour à la config de départ', e);
  }
  return defaultConfig();
}

export function saveConfig(cfg) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
    return true;
  } catch {
    return false;
  }
}

export function loadPref(name, fallback) {
  try {
    return localStorage.getItem('tierlist:' + name) ?? fallback;
  } catch {
    return fallback;
  }
}

export function savePref(name, value) {
  try {
    localStorage.setItem('tierlist:' + name, value);
  } catch {
    // préférence perdue au rechargement, sans gravité
  }
}
