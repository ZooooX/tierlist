// Avatars : l'image choisie est recadrée en carré et réduite dans le navigateur,
// puis gardée en data URL dans la config (localStorage). Elle n'est jamais envoyée.

export const AVATAR_SIZE = 256;
export const AVATAR_MAX_CHARS = 200_000; // ~150 Ko, garde le localStorage léger
const MAX_INPUT_BYTES = 20 * 1024 * 1024;

export function isAvatar(v) {
  return typeof v === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(v) && v.length <= AVATAR_MAX_CHARS;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("cette image n'a pas pu être lue"));
    };
    img.src = url;
  });
}

export async function fileToAvatar(file) {
  if (!file.type.startsWith('image/')) throw new Error("ce fichier n'est pas une image");
  if (file.size > MAX_INPUT_BYTES) throw new Error("l'image dépasse 20 Mo");
  const img = await loadImage(file);
  // recadrage carré centré
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  // WebP si le navigateur sait l'encoder, sinon JPEG ; on baisse la qualité si c'est trop lourd
  for (const quality of [0.85, 0.7, 0.55]) {
    let url = canvas.toDataURL('image/webp', quality);
    if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/jpeg', quality);
    if (url.length <= AVATAR_MAX_CHARS) return url;
  }
  throw new Error('image trop lourde même réduite');
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)).toUpperCase();
}
