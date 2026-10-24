import { useCallback, useEffect, useState } from 'react';
import { clearScores, defaultConfig, normalize } from './lib/config.js';
import { loadConfig, loadPref, saveConfig, savePref } from './lib/storage.js';
import { configBlob, downloadBlob, onColor, slug, today } from './lib/files.js';
import GameView from './components/GameView.jsx';
import GeneralView from './components/GeneralView.jsx';
import Settings from './components/Settings.jsx';

export default function App() {
  const [config, setConfig] = useState(loadConfig);
  const [tab, setTab] = useState(() => loadPref('tab', 'general'));
  const [view, setView] = useState(() => (loadPref('view', 'list') === 'cards' ? 'cards' : 'list'));
  const [toast, setToast] = useState(null);
  const [storageOk, setStorageOk] = useState(true);

  useEffect(() => setStorageOk(saveConfig(config)), [config]);
  useEffect(() => savePref('tab', tab), [tab]);
  useEffect(() => savePref('view', view), [view]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Mise à jour immuable : fn modifie une copie profonde de la config.
  const update = useCallback((fn) => setConfig((c) => {
    const next = structuredClone(c);
    fn(next);
    return next;
  }), []);
  const notify = useCallback((text, kind = 'ok') => setToast({ text, kind, key: Date.now() }), []);

  const game = config.games.find((g) => g.id === tab);
  const current = game ? tab : tab === 'settings' ? 'settings' : 'general';
  const accent = game?.color;

  const exportConfig = () => {
    const name = `${slug(config.title)}-config-${today()}.json`;
    downloadBlob(configBlob(config), name);
    notify('Config exportée : ' + name);
  };
  const importConfig = async (file) => {
    try {
      const next = normalize(JSON.parse(await file.text()));
      const summary = `${next.friends.length} amis, ${next.games.length} jeux`;
      if (!confirm(`Remplacer la config actuelle par « ${next.title} » (${summary}) ? Pense à exporter la tienne avant si tu veux la garder.`)) return;
      setConfig(next);
      notify(`Config « ${next.title} » importée (${summary}).`);
    } catch (e) {
      notify(`Import impossible : ${e instanceof SyntaxError ? "le fichier n'est pas du JSON valide" : e.message}.`, 'error');
    }
  };
  const resetConfig = () => {
    if (!confirm('Revenir à la config de départ ? Tes amis, jeux et notes actuels seront remplacés.')) return;
    setConfig(defaultConfig());
    notify('Config de départ restaurée.');
  };
  const wipeScores = () => {
    if (!confirm('Effacer toutes les notes ? Les amis, jeux et critères restent.')) return;
    setConfig((c) => clearScores(c));
    notify('Toutes les notes sont effacées.');
  };

  const tabs = [...config.games.map((g) => ({ id: g.id, label: g.label, color: g.color })), { id: 'general', label: 'Général' }];

  return (
    <div className="wrap" style={accent ? { '--accent': accent, '--on-accent': onColor(accent) } : undefined}>
      <header className="top">
        <div>
          <h1>{config.title || 'Tier des potes'}</h1>
          <p className="sub">Note tes potes de 0 à 100 sur chaque critère. Classements et cartes se calculent tout seuls.</p>
        </div>
        <div className="top-actions">
          <button className="btn-ghost" onClick={exportConfig}>
            Exporter
          </button>
          <label className="btn-ghost file-btn">
            Importer
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) importConfig(file);
              }}
            />
          </label>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Jeux">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            className="tab"
            aria-selected={current === t.id}
            style={t.color ? { '--tab': t.color } : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <button role="tab" className="tab tab-settings" aria-selected={current === 'settings'} onClick={() => setTab('settings')}>
          Réglages
        </button>
      </nav>

      {!storageOk && (
        <p className="note error">Ce navigateur bloque le stockage local : tes changements seront perdus en fermant la page. Exporte la config pour la garder.</p>
      )}

      {current === 'settings' ? (
        <Settings config={config} update={update} onExport={exportConfig} onImport={importConfig} onReset={resetConfig} onClearScores={wipeScores} />
      ) : game ? (
        <GameView config={config} game={game} update={update} view={view} onView={setView} notify={notify} />
      ) : (
        <GeneralView config={config} update={update} view={view} onView={setView} notify={notify} />
      )}

      <footer className="foot">Tout reste dans ton navigateur : aucune donnée n'est envoyée sur un serveur.</footer>

      {toast && (
        <div key={toast.key} className={'toast ' + toast.kind} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}
