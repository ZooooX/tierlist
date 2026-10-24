import { useMemo } from 'react';
import { fmtCoef, generalEntries } from '../lib/scoring.js';
import RankingSection from './RankingSection.jsx';
import ScoreInput from './ScoreInput.jsx';

export default function GeneralView({ config, update, view, onView, notify }) {
  const entries = useMemo(() => generalEntries(config), [config]);
  const setGlobal = (xid, fid, v) => update((c) => {
    c.globalScores[xid][fid] = v;
  });

  const parts = [
    ...config.games.map((g) => `${g.label} ×${fmtCoef(g.weight)}`),
    ...config.globals.map((x) => `${x.label} ×${fmtCoef(x.coef)}`),
  ];

  return (
    <>
      <RankingSection
        title={`${config.title} · Général`}
        entries={entries}
        tag="GEN"
        view={view}
        onView={onView}
        showBarValues
        notify={notify}
      />
      {config.globals.length > 0 && (
        <section>
          <h2 className="label">Critères globaux</h2>
          <div className="grid-scroll">
            <table className="narrow">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Pote</th>
                  {config.globals.map((x) => (
                    <th key={x.id} className="c gcol">
                      {x.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {config.friends.map((f, i) => (
                  <tr key={f.id}>
                    <td className="slot">{i + 1}</td>
                    <td className="pname">{f.name || 'Ami ' + (i + 1)}</td>
                    {config.globals.map((x) => (
                      <td key={x.id} className="c gcol">
                        <ScoreInput
                          id={`g-${x.id}-${f.id}`}
                          className="score-global"
                          value={config.globalScores[x.id][f.id]}
                          label={`${x.label} de ${f.name || 'ami ' + (i + 1)}`}
                          onChange={(v) => setGlobal(x.id, f.id, v)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <p className="foot">
        Note générale = moyenne pondérée de {parts.join(', ') || 'rien pour l’instant'}. Un jeu sans aucune note est ignoré, et un pote sans
        jeu noté n'est pas classé.
      </p>
    </>
  );
}
