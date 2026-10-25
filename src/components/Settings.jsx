import { useState } from 'react';
import { LIMITS, PALETTE, shortOf, uid } from '../lib/config.js';
import { fileToAvatar } from '../lib/avatar.js';
import Avatar from './Avatar.jsx';

// Choix de l'avatar : l'image est réduite dans le navigateur et reste dans la config locale.
function AvatarPicker({ friend, index, onChange, notify }) {
  const [busy, setBusy] = useState(false);
  const who = friend.name || 'ami ' + (index + 1);
  const pick = async (file) => {
    setBusy(true);
    try {
      onChange(await fileToAvatar(file));
    } catch (e) {
      notify(`Avatar non ajouté : ${e.message}.`, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="avatar-pick">
      <label className={'avatar-btn' + (busy ? ' busy' : '')} title={friend.avatar ? "Changer l'avatar" : 'Ajouter un avatar'}>
        <Avatar src={friend.avatar} name={friend.name} />
        <input
          id={`avatar-${friend.id}`}
          type="file"
          accept="image/*"
          aria-label={`${friend.avatar ? "Changer l'avatar" : 'Ajouter un avatar'} de ${who}`}
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) pick(file);
          }}
        />
      </label>
      {friend.avatar && (
        <button className="avatar-clear" onClick={() => onChange(null)} aria-label={`Retirer l'avatar de ${who}`} title="Retirer l'avatar">
          ✕
        </button>
      )}
    </div>
  );
}

function move(arr, i, dir) {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

function RowTools({ index, count, onMove, onRemove, removeLabel }) {
  return (
    <div className="row-tools">
      <button className="icon-btn" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Monter" title="Monter">
        ↑
      </button>
      <button className="icon-btn" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Descendre" title="Descendre">
        ↓
      </button>
      <button className="icon-btn danger" onClick={onRemove} aria-label={removeLabel} title={removeLabel}>
        ✕
      </button>
    </div>
  );
}

function NumberField({ id, label, value, step, min, onChange }) {
  return (
    <label className="field small" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v) && v >= 0) onChange(v);
        }}
      />
    </label>
  );
}

export default function Settings({ config, update, notify, onExport, onImport, onReset, onClearScores }) {
  // --- amis
  const addFriend = () => update((c) => {
    const id = uid('f');
    c.friends.push({ id, name: '', avatar: null });
    for (const g of c.games) c.scores[g.id][id] = Object.fromEntries(g.criteria.map((k) => [k.id, null]));
    for (const x of c.globals) c.globalScores[x.id][id] = null;
  });
  const removeFriend = (f) => {
    if (!confirm(`Retirer ${f.name || 'cet ami'} et toutes ses notes ?`)) return;
    update((c) => {
      c.friends = c.friends.filter((x) => x.id !== f.id);
      for (const g of c.games) delete c.scores[g.id][f.id];
      for (const x of c.globals) delete c.globalScores[x.id][f.id];
    });
  };

  // --- jeux
  const addGame = () => update((c) => {
    const id = uid('g');
    const crit = { id: uid('c'), label: 'Skill', short: 'SKL' };
    c.games.push({ id, label: 'Nouveau jeu', short: 'JEU', color: PALETTE[c.games.length % PALETTE.length], weight: 1, criteria: [crit] });
    c.scores[id] = Object.fromEntries(c.friends.map((f) => [f.id, { [crit.id]: null }]));
  });
  const removeGame = (g) => {
    if (!confirm(`Supprimer le jeu ${g.label} et toutes ses notes ?`)) return;
    update((c) => {
      c.games = c.games.filter((x) => x.id !== g.id);
      delete c.scores[g.id];
    });
  };
  const editGame = (gid, fn) => update((c) => fn(c.games.find((x) => x.id === gid), c));

  // --- critères d'un jeu
  const addCrit = (gid) => editGame(gid, (g, c) => {
    const id = uid('c');
    g.criteria.push({ id, label: 'Nouveau critère', short: 'NEW' });
    for (const f of c.friends) c.scores[gid][f.id][id] = null;
  });
  const removeCrit = (g, k) => {
    if (!confirm(`Supprimer le critère ${k.label} de ${g.label} et ses notes ?`)) return;
    editGame(g.id, (game, c) => {
      game.criteria = game.criteria.filter((x) => x.id !== k.id);
      for (const f of c.friends) delete c.scores[g.id][f.id][k.id];
    });
  };

  // --- critères globaux
  const addGlobal = () => update((c) => {
    const id = uid('x');
    c.globals.push({ id, label: 'Bonus', short: 'BON', coef: 0.25 });
    c.globalScores[id] = Object.fromEntries(c.friends.map((f) => [f.id, null]));
  });
  const removeGlobal = (x) => {
    if (!confirm(`Supprimer le critère global ${x.label} et ses notes ?`)) return;
    update((c) => {
      c.globals = c.globals.filter((y) => y.id !== x.id);
      delete c.globalScores[x.id];
    });
  };

  return (
    <div className="settings">
      <section className="panel">
        <h2 className="label">Général</h2>
        <label className="field" htmlFor="site-title">
          <span>Nom du classement</span>
          <input id="site-title" type="text" maxLength={60} value={config.title} onChange={(e) => update((c) => { c.title = e.target.value; })} />
        </label>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="label">
            Amis <span className="count">{config.friends.length}</span>
          </h2>
          <button className="btn-ghost" onClick={addFriend} disabled={config.friends.length >= LIMITS.friends}>
            Ajouter un ami
          </button>
        </div>
        <ul className="edit-list">
          {config.friends.map((f, i) => (
            <li key={f.id}>
              <span className="slot">{i + 1}</span>
              <AvatarPicker friend={f} index={i} notify={notify} onChange={(url) => update((c) => { c.friends[i].avatar = url; })} />
              <input
                id={`friend-${f.id}`}
                type="text"
                maxLength={40}
                value={f.name}
                placeholder={'Ami ' + (i + 1)}
                aria-label={'Nom de l’ami ' + (i + 1)}
                onChange={(e) => update((c) => { c.friends[i].name = e.target.value; })}
              />
              <RowTools
                index={i}
                count={config.friends.length}
                onMove={(d) => update((c) => move(c.friends, i, d))}
                onRemove={() => removeFriend(f)}
                removeLabel={'Retirer ' + (f.name || 'cet ami')}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="label">
            Jeux <span className="count">{config.games.length}</span>
          </h2>
          <button className="btn-ghost" onClick={addGame} disabled={config.games.length >= LIMITS.games}>
            Ajouter un jeu
          </button>
        </div>
        <div className="game-list">
          {config.games.map((g, gi) => (
            <div key={g.id} className="game-edit" style={{ '--game': g.color }}>
              <div className="game-edit-head">
                <label className="field" htmlFor={`game-label-${g.id}`}>
                  <span>Nom</span>
                  <input
                    id={`game-label-${g.id}`}
                    type="text"
                    maxLength={40}
                    value={g.label}
                    onChange={(e) => editGame(g.id, (x) => { x.label = e.target.value; })}
                    onBlur={(e) => !e.target.value.trim() && editGame(g.id, (x) => { x.label = 'Jeu ' + (gi + 1); })}
                  />
                </label>
                <label className="field small" htmlFor={`game-short-${g.id}`}>
                  <span>Sigle</span>
                  <input
                    id={`game-short-${g.id}`}
                    type="text"
                    maxLength={5}
                    value={g.short}
                    onChange={(e) => editGame(g.id, (x) => { x.short = e.target.value.toUpperCase(); })}
                    onBlur={(e) => !e.target.value.trim() && editGame(g.id, (x) => { x.short = shortOf(x.label); })}
                  />
                </label>
                <label className="field small" htmlFor={`game-color-${g.id}`}>
                  <span>Couleur</span>
                  <input id={`game-color-${g.id}`} type="color" value={g.color} onChange={(e) => editGame(g.id, (x) => { x.color = e.target.value; })} />
                </label>
                <NumberField
                  id={`game-weight-${g.id}`}
                  label="Poids"
                  value={g.weight}
                  step="0.25"
                  min="0"
                  onChange={(v) => editGame(g.id, (x) => { x.weight = v; })}
                />
                <RowTools
                  index={gi}
                  count={config.games.length}
                  onMove={(d) => update((c) => move(c.games, gi, d))}
                  onRemove={() => removeGame(g)}
                  removeLabel={'Supprimer ' + g.label}
                />
              </div>
              <ul className="edit-list crit-list">
                {g.criteria.map((k, ki) => (
                  <li key={k.id}>
                    <input
                      id={`crit-label-${g.id}-${k.id}`}
                      type="text"
                      maxLength={40}
                      value={k.label}
                      aria-label="Nom du critère"
                      onChange={(e) => editGame(g.id, (x) => { x.criteria[ki].label = e.target.value; })}
                      onBlur={(e) => !e.target.value.trim() && editGame(g.id, (x) => { x.criteria[ki].label = 'Critère ' + (ki + 1); })}
                    />
                    <input
                      id={`crit-short-${g.id}-${k.id}`}
                      className="short-input"
                      type="text"
                      maxLength={5}
                      value={k.short}
                      aria-label="Abréviation sur la carte"
                      title="Abréviation sur la carte"
                      onChange={(e) => editGame(g.id, (x) => { x.criteria[ki].short = e.target.value.toUpperCase(); })}
                      onBlur={(e) => !e.target.value.trim() && editGame(g.id, (x) => { x.criteria[ki].short = shortOf(x.criteria[ki].label); })}
                    />
                    <RowTools
                      index={ki}
                      count={g.criteria.length}
                      onMove={(d) => editGame(g.id, (x) => move(x.criteria, ki, d))}
                      onRemove={() => removeCrit(g, k)}
                      removeLabel={'Supprimer ' + k.label}
                    />
                  </li>
                ))}
              </ul>
              <button className="btn-ghost add-crit" onClick={() => addCrit(g.id)} disabled={g.criteria.length >= LIMITS.criteria}>
                Ajouter un critère
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="label">Critères globaux</h2>
          <button className="btn-ghost" onClick={addGlobal} disabled={config.globals.length >= LIMITS.globals}>
            Ajouter un critère global
          </button>
        </div>
        <p className="hint">Notés une seule fois par ami, ils comptent uniquement dans la note générale, avec leur coefficient (chaque jeu compte son poids).</p>
        <ul className="edit-list">
          {config.globals.map((x, xi) => (
            <li key={x.id}>
              <input
                id={`glob-label-${x.id}`}
                type="text"
                maxLength={40}
                value={x.label}
                aria-label="Nom du critère global"
                onChange={(e) => update((c) => { c.globals[xi].label = e.target.value; })}
              />
              <input
                id={`glob-short-${x.id}`}
                className="short-input"
                type="text"
                maxLength={5}
                value={x.short}
                aria-label="Abréviation sur la carte"
                title="Abréviation sur la carte"
                onChange={(e) => update((c) => { c.globals[xi].short = e.target.value.toUpperCase(); })}
              />
              <NumberField
                id={`glob-coef-${x.id}`}
                label="Coef"
                value={x.coef}
                step="0.05"
                min="0"
                onChange={(v) => update((c) => { c.globals[xi].coef = v; })}
              />
              <RowTools
                index={xi}
                count={config.globals.length}
                onMove={(d) => update((c) => move(c.globals, xi, d))}
                onRemove={() => removeGlobal(x)}
                removeLabel={'Supprimer ' + x.label}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="label">Données</h2>
        <p className="hint">
          Tout est enregistré automatiquement dans ce navigateur, avatars compris : rien n'est envoyé sur internet. Exporte la config pour la
          sauvegarder ou l'envoyer à un pote ; le fichier contient aussi les avatars.
        </p>
        <div className="toolbar">
          <button className="btn" onClick={onExport}>
            Exporter la config
          </button>
          <label className="btn-ghost file-btn">
            Importer une config
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) onImport(file);
              }}
            />
          </label>
          <button className="btn-ghost" onClick={onClearScores}>
            Effacer toutes les notes
          </button>
          <button className="btn-ghost danger" onClick={onReset}>
            Revenir à la config de départ
          </button>
        </div>
      </section>
    </div>
  );
}
