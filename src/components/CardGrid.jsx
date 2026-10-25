import { useMemo, useRef, useState } from 'react';
import { fmt, tierFor } from '../lib/scoring.js';
import { canShareFiles, copyImage, downloadBlob, nodeToPng, slug, today } from '../lib/files.js';
import Avatar from './Avatar.jsx';

function PlayerCard({ entry, tag }) {
  const tier = tierFor(entry.score);
  const { best, worst } = entry.traits;
  const trait = (label, t) => (
    <p>
      <b>{label}</b> {t.label}{' '}
      <span>
        {t.sub ? t.sub + ' · ' : ''}
        {t.value}
      </span>
    </p>
  );
  return (
    <article className={'pcard t-' + tier.id}>
      <div className="pc-top">
        <div className="pc-side">
          <div className="pc-ovr">
            {fmt(entry.score)}
            <small>{tag}</small>
          </div>
          <span className="pc-rank">{entry.place ? '#' + entry.place : '–'}</span>
          <span className="pc-tier">{tier.label}</span>
        </div>
        <Avatar src={entry.avatar} name={entry.name} className="pc-avatar" />
      </div>
      <h3 className="pc-name">{entry.name}</h3>
      <dl className="pc-stats">
        {entry.stats.map((s) => (
          <div key={s.key}>
            <dt>{s.label}</dt>
            <dd>{fmt(s.value)}</dd>
          </div>
        ))}
      </dl>
      <div className="pc-traits">
        {best ? trait('Point fort', best) : <p><b>Pas encore noté</b></p>}
        {worst && trait('Point faible', worst)}
      </div>
    </article>
  );
}

// Grille de cartes + capture en image. Le cadre capturé inclut un titre et la date pour le partage.
export default function CardGrid({ entries, tag, heading, notify }) {
  const shotRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const shareable = useMemo(canShareFiles, []);
  const fileName = `${slug(heading)}-${today()}.png`;

  const withImage = (action) => async () => {
    if (busy || !shotRef.current) return;
    setBusy(true);
    try {
      await action(await nodeToPng(shotRef.current));
    } catch (e) {
      if (e?.name === 'AbortError') return;
      if (e?.message === 'unsupported') notify("Ton navigateur n'a pas autorisé la copie de l'image : télécharge-la plutôt.", 'error');
      else notify("L'image n'a pas pu être créée : " + (e?.message || 'erreur inconnue'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const download = withImage((blob) => {
    downloadBlob(blob, fileName);
    notify('Image téléchargée : ' + fileName);
  });
  const copy = withImage(async (blob) => {
    await copyImage(blob);
    notify('Image copiée, tu peux la coller dans Discord ou ailleurs.');
  });
  const share = withImage((blob) => navigator.share({ files: [new File([blob], fileName, { type: 'image/png' })], title: heading }));

  if (!entries.length) return <p className="empty-state">Ajoute des amis dans les réglages pour générer leurs cartes.</p>;
  return (
    <div className="cards-block">
      <div className="toolbar">
        <button className="btn" onClick={download} disabled={busy}>
          {busy ? 'Création…' : "Télécharger l'image"}
        </button>
        <button className="btn-ghost" onClick={copy} disabled={busy}>
          Copier l'image
        </button>
        {shareable && (
          <button className="btn-ghost" onClick={share} disabled={busy}>
            Partager
          </button>
        )}
      </div>
      <div className="shot" ref={shotRef}>
        <div className="shot-head">
          <span className="shot-title">{heading}</span>
          <span className="shot-date">{new Date().toLocaleDateString('fr-FR')}</span>
        </div>
        <div className="cards">
          {entries.map((e) => (
            <PlayerCard key={e.id} entry={e} tag={tag} />
          ))}
        </div>
      </div>
    </div>
  );
}
