// Modèle de données : une seule config contient la structure (amis, jeux, critères) et les notes.
// Les notes sont indexées par id pour survivre aux renommages et aux réordonnancements.
import { isAvatar } from './avatar.js';

export const MAX_SCORE = 100;
export const LIMITS = { friends: 50, games: 12, criteria: 12, globals: 6 };
export const PALETTE = ['#0a8f93', '#d93a4b', '#2d6fe0', '#9b4fd1', '#e07a1f', '#2f9e5b', '#c2417f', '#6b7a1f'];

export function uid(prefix) {
  return prefix + '-' + Math.random().toString(36).slice(2, 9);
}

export function shortOf(label) {
  const s = String(label || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase();
  return s || '?';
}

const clampScore = (v) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(MAX_SCORE, Math.round(v))) : null;
const text = (v, max = 40) => (typeof v === 'string' ? v.slice(0, max) : '');
const positive = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback);

function idMaker(prefix) {
  const seen = new Set();
  return (v) => {
    let id = typeof v === 'string' && v ? v.slice(0, 40) : uid(prefix);
    while (seen.has(id)) id = uid(prefix);
    seen.add(id);
    return id;
  };
}

// Valide et complète une config venant du stockage ou d'un fichier importé. Lève une Error lisible si c'est inutilisable.
export function normalize(raw) {
  if (!raw || typeof raw !== 'object') throw new Error("ce fichier ne contient pas de config");
  if (!Array.isArray(raw.friends) || !Array.isArray(raw.games)) {
    throw new Error('il manque la liste des amis ou des jeux');
  }
  const friendId = idMaker('f');
  const gameId = idMaker('g');
  const globalId = idMaker('x');

  const friends = raw.friends.slice(0, LIMITS.friends).map((f) => ({
    id: friendId(f?.id),
    name: text(f?.name),
    avatar: isAvatar(f?.avatar) ? f.avatar : null,
  }));

  const games = raw.games.slice(0, LIMITS.games).map((g, gi) => {
    const label = text(g?.label) || 'Jeu ' + (gi + 1);
    const critId = idMaker('c');
    const criteria = (Array.isArray(g?.criteria) ? g.criteria : []).slice(0, LIMITS.criteria).map((c, ci) => {
      const cl = text(c?.label) || 'Critère ' + (ci + 1);
      return { id: critId(c?.id), label: cl, short: text(c?.short, 5) || shortOf(cl) };
    });
    return {
      id: gameId(g?.id),
      label,
      short: text(g?.short, 5) || shortOf(label),
      color: /^#[0-9a-f]{6}$/i.test(g?.color) ? g.color : PALETTE[gi % PALETTE.length],
      weight: positive(g?.weight, 1),
      criteria,
    };
  });

  const globals = (Array.isArray(raw.globals) ? raw.globals : []).slice(0, LIMITS.globals).map((x, xi) => {
    const label = text(x?.label) || 'Bonus ' + (xi + 1);
    return { id: globalId(x?.id), label, short: text(x?.short, 5) || shortOf(label), coef: positive(x?.coef, 0.25) };
  });

  const scores = {};
  for (const g of games) {
    scores[g.id] = {};
    for (const f of friends) {
      scores[g.id][f.id] = {};
      for (const c of g.criteria) scores[g.id][f.id][c.id] = clampScore(raw.scores?.[g.id]?.[f.id]?.[c.id]);
    }
  }
  const globalScores = {};
  for (const x of globals) {
    globalScores[x.id] = {};
    for (const f of friends) globalScores[x.id][f.id] = clampScore(raw.globalScores?.[x.id]?.[f.id]);
  }

  return { version: 1, title: text(raw.title, 60) || 'Tier des potes', friends, games, globals, scores, globalScores };
}

// Config de départ : les potes et notes saisis dans la première version de la page.
export function defaultConfig() {
  const names = ['ZooooX', 'Fernandosa', 'Unee', 'Rick', 'Dauthdeart', 'Xylopales', 'Kero', 'Yael'];
  const games = [
    {
      id: 'league', label: 'League', short: 'LOL', color: '#0a8f93',
      criteria: [['vision', 'Vision de jeu', 'VIS'], ['skill', 'Skill pur', 'SKL'], ['comms', 'Comms', 'COM'], ['rank', 'Rank', 'RNK']],
      rows: [[68, 74, 35, 65], [73, 68, 62, 85], [54, 49, 65, 50], [30, 85, 50, 68], [52, 61, 53, 70], [65, 65, 58, 50], [23, 42, 39, 38], [1, 8, 5, 3]],
    },
    {
      id: 'shooter', label: 'Shooter', short: 'FPS', color: '#d93a4b',
      criteria: [['aim', 'Aim', 'AIM'], ['stuff', 'Stuff', 'STF'], ['gamesense', 'Gamesense', 'GSN'], ['comms', 'Comms', 'COM'], ['rank', 'Rank', 'RNK']],
      rows: [[80, 42, 74, 65, 75], [70, 42, 69, 64, 73], [60, 45, 40, 47, 50], [56, 53, 49, 43, 50], [20, 20, 15, 10, 10], [28, 13, 20, 17, 19], [64, 37, 42, 51, 50], [24, 19, 26, 30, 25]],
    },
    {
      id: 'rocket', label: 'Rocket', short: 'RL', color: '#2d6fe0',
      criteria: [['mechs', 'Mechs', 'MEC'], ['rota', 'Rota', 'ROT'], ['rank', 'Rank', 'RNK']],
      rows: [[18, 21, 20], [60, 53, 68], [40, 60, 55], [55, 58, 59], [6, 5, 5], [10, 7, 8], [58, 52, 65], [36, 39, 50]],
    },
  ];
  const delu = [20, 68, 85, 44, 53, 73, 51, 57];
  const friends = names.map((name, i) => ({ id: 'f' + (i + 1), name }));
  const scores = {};
  for (const g of games) {
    scores[g.id] = {};
    friends.forEach((f, i) => {
      scores[g.id][f.id] = Object.fromEntries(g.criteria.map(([cid], j) => [cid, g.rows[i][j]]));
    });
  }
  return normalize({
    title: 'Tier des potes',
    friends,
    games: games.map((g) => ({ ...g, weight: 1, criteria: g.criteria.map(([id, label, short]) => ({ id, label, short })) })),
    globals: [{ id: 'delu', label: 'Délu', short: 'DÉLU', coef: 0.25 }],
    scores,
    globalScores: { delu: Object.fromEntries(friends.map((f, i) => [f.id, delu[i]])) },
  });
}

// Garde la structure (amis, jeux, critères) mais efface toutes les notes.
export function clearScores(cfg) {
  return normalize({ ...cfg, scores: {}, globalScores: {} });
}
