// Calculs du classement : moyennes, note générale pondérée, rangs, paliers de carte.

export const TIERS = [
  { min: 80, id: 'legend', label: 'Légende' },
  { min: 65, id: 'gold', label: 'Or' },
  { min: 50, id: 'silver', label: 'Argent' },
  { min: 0, id: 'bronze', label: 'Bronze' },
];
const UNRANKED = { id: 'none', label: 'Non classé' };

export function mean(values) {
  const v = values.filter((x) => typeof x === 'number');
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export const fmt = (n) => (n == null ? '–' : String(Math.round(n)));
export const fmtCoef = (n) => String(n).replace('.', ',');

export function gameScore(cfg, game, friendId) {
  return mean(game.criteria.map((c) => cfg.scores[game.id]?.[friendId]?.[c.id] ?? null));
}

export function globalValue(cfg, glob, friendId) {
  const v = cfg.globalScores[glob.id]?.[friendId];
  return typeof v === 'number' ? v : null;
}

// Moyenne pondérée : chaque jeu noté pèse son poids, chaque critère global pèse son coef.
// Sans aucun jeu noté, pas de note générale (un critère global seul ne classe personne).
export function generalScore(cfg, friendId) {
  let sum = 0;
  let weight = 0;
  for (const g of cfg.games) {
    const s = gameScore(cfg, g, friendId);
    if (s != null && g.weight > 0) {
      sum += s * g.weight;
      weight += g.weight;
    }
  }
  if (!weight) return null;
  for (const x of cfg.globals) {
    const v = globalValue(cfg, x, friendId);
    if (v != null && x.coef > 0) {
      sum += v * x.coef;
      weight += x.coef;
    }
  }
  return sum / weight;
}

// Trie par note décroissante (ordre de saisie en cas d'égalité) ; les ex aequo partagent la même place.
export function rank(items) {
  const sorted = [...items].sort((a, b) => {
    if (a.score == null && b.score == null) return a.order - b.order;
    if (a.score == null) return 1;
    if (b.score == null) return -1;
    return b.score - a.score || a.order - b.order;
  });
  let place = null;
  let last = null;
  return sorted.map((it, k) => {
    if (it.score == null) return { ...it, place: null };
    if (last === null || it.score !== last) {
      place = k + 1;
      last = it.score;
    }
    return { ...it, place };
  });
}

export function tierFor(score) {
  if (score == null) return UNRANKED;
  return TIERS.find((t) => Math.round(score) >= t.min);
}

// Point fort / point faible parmi des notes { label, sub, value }.
export function traits(entries) {
  const v = entries.filter((e) => e.value != null).sort((a, b) => b.value - a.value);
  return { best: v[0] || null, worst: v.length > 1 ? v[v.length - 1] : null };
}

// Lignes prêtes à afficher pour un jeu.
export function gameEntries(cfg, game) {
  return rank(
    cfg.friends.map((f, order) => {
      const vals = game.criteria.map((c) => ({
        key: c.id,
        label: c.label,
        short: c.short,
        value: cfg.scores[game.id]?.[f.id]?.[c.id] ?? null,
      }));
      return {
        id: f.id,
        order,
        name: f.name || 'Ami ' + (order + 1),
        score: mean(vals.map((v) => v.value)),
        bars: vals,
        chips: [],
        stats: vals.map((v) => ({ key: v.key, label: v.short, value: v.value })),
        traits: traits(vals.map((v) => ({ label: v.label, sub: '', value: v.value }))),
      };
    }),
  );
}

// Lignes prêtes à afficher pour l'onglet Général.
export function generalEntries(cfg) {
  return rank(
    cfg.friends.map((f, order) => {
      const games = cfg.games.map((g) => ({ key: g.id, label: g.label, short: g.short, value: gameScore(cfg, g, f.id) }));
      const globs = cfg.globals.map((x) => ({ key: x.id, label: x.label, short: x.short, value: globalValue(cfg, x, f.id) }));
      const all = cfg.games.flatMap((g) =>
        g.criteria.map((c) => ({ label: c.label, sub: g.label, value: cfg.scores[g.id]?.[f.id]?.[c.id] ?? null })),
      );
      return {
        id: f.id,
        order,
        name: f.name || 'Ami ' + (order + 1),
        score: generalScore(cfg, f.id),
        bars: games,
        chips: globs,
        stats: [...games, ...globs].map((v) => ({ key: v.key, label: v.short, value: v.value })),
        traits: traits(all),
      };
    }),
  );
}
