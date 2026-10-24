// Fichiers générés côté navigateur : export JSON de la config et capture PNG des cartes.
import { toBlob } from 'html-to-image';

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slug(s) {
  return (
    String(s)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'tierlist'
  );
}

export const today = () => new Date().toISOString().slice(0, 10);

export function configBlob(cfg) {
  const payload = { app: 'tierlist', exportedAt: new Date().toISOString(), ...cfg };
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export async function nodeToPng(node) {
  const backgroundColor = getComputedStyle(document.body).backgroundColor;
  const blob = await toBlob(node, { pixelRatio: 2, backgroundColor, cacheBust: true });
  if (!blob) throw new Error('capture vide');
  return blob;
}

export async function copyImage(blob) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('unsupported');
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  } catch {
    // permission refusée ou format non pris en charge : même conseil pour l'utilisateur
    throw new Error('unsupported');
  }
}

export function canShareFiles() {
  try {
    return !!navigator.canShare?.({ files: [new File([''], 'x.png', { type: 'image/png' })] });
  } catch {
    return false;
  }
}

// Texte noir ou blanc selon la luminance de la couleur de fond (contraste WCAG).
export function onColor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const lin = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.179 ? '#111318' : '#ffffff';
}
