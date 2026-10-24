import { fmt } from '../lib/scoring.js';

// showBarValues : dans l'onglet Général, chaque barre est la moyenne d'un jeu, on affiche le chiffre.
export default function Leaderboard({ entries, showBarValues = false }) {
  if (!entries.length) return <p className="empty-state">Ajoute des amis dans les réglages pour voir le classement.</p>;
  return (
    <ol className="board">
      {entries.map((r) => (
        <li key={r.id} className={'row' + (r.score == null ? ' empty' : '')} data-place={r.place ?? ''}>
          <div className="pos">{r.place ?? '–'}</div>
          <div className="who">
            <div className="name">{r.name}</div>
            <div className="bars">
              {r.chips.map(
                (c) =>
                  c.value != null && (
                    <span key={c.key} className="chip">
                      {c.label} {c.value}
                    </span>
                  ),
              )}
              {r.bars.map((b) => (
                <span className="bar" key={b.key} title={`${b.label} : ${fmt(b.value)}/100`}>
                  {b.label}
                  {showBarValues && <em>{fmt(b.value)}</em>}
                  <i>
                    <b style={{ width: (b.value ?? 0) + '%' }} />
                  </i>
                </span>
              ))}
            </div>
          </div>
          <div className="avg">
            {fmt(r.score)}
            <small>/ 100</small>
          </div>
        </li>
      ))}
    </ol>
  );
}
