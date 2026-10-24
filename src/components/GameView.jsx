import { useMemo } from 'react';
import { fmt, gameEntries, gameScore } from '../lib/scoring.js';
import RankingSection from './RankingSection.jsx';
import ScoreInput from './ScoreInput.jsx';

export default function GameView({ config, game, update, view, onView, notify }) {
  const entries = useMemo(() => gameEntries(config, game), [config, game]);

  const setScore = (fid, cid, v) => update((c) => {
    c.scores[game.id][fid][cid] = v;
  });
  const rename = (fid, name) => update((c) => {
    c.friends.find((f) => f.id === fid).name = name;
  });

  return (
    <>
      <RankingSection title={`${config.title} · ${game.label}`} entries={entries} tag={game.short} view={view} onView={onView} notify={notify} />
      <section>
        <h2 className="label">Notes {game.label}</h2>
        {game.criteria.length === 0 ? (
          <p className="empty-state">Ce jeu n'a pas encore de critère. Ajoute-en dans les réglages.</p>
        ) : (
          <div className="grid-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Pote</th>
                  {game.criteria.map((c) => (
                    <th key={c.id} className="c">
                      {c.label}
                    </th>
                  ))}
                  <th className="c">Moy.</th>
                </tr>
              </thead>
              <tbody>
                {config.friends.map((f, i) => (
                  <tr key={f.id}>
                    <td className="slot">{i + 1}</td>
                    <td>
                      <input
                        id={`name-${game.id}-${f.id}`}
                        className="name-input"
                        type="text"
                        value={f.name}
                        placeholder={'Ami ' + (i + 1)}
                        maxLength={40}
                        aria-label={'Nom du pote ' + (i + 1)}
                        onChange={(e) => rename(f.id, e.target.value)}
                      />
                    </td>
                    {game.criteria.map((c) => (
                      <td key={c.id} className="c">
                        <ScoreInput
                          id={`s-${game.id}-${f.id}-${c.id}`}
                          value={config.scores[game.id][f.id][c.id]}
                          label={`${c.label} de ${f.name || 'ami ' + (i + 1)}`}
                          onChange={(v) => setScore(f.id, c.id, v)}
                        />
                      </td>
                    ))}
                    <td className="mean">{fmt(gameScore(config, game, f.id))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="foot">Les noms sont communs à tous les jeux. Note de 0 à 100 ; la moyenne du jeu fait le classement.</p>
    </>
  );
}
