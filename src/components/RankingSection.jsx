import Leaderboard from './Leaderboard.jsx';
import CardGrid from './CardGrid.jsx';

// Classement d'un onglet, en liste ou en cartes.
export default function RankingSection({ title, entries, tag, view, onView, showBarValues, notify }) {
  return (
    <section>
      <div className="sec-head">
        <h2 className="label">Classement {title}</h2>
        <div className="seg" role="group" aria-label="Affichage du classement">
          <button aria-pressed={view === 'list'} onClick={() => onView('list')}>
            Liste
          </button>
          <button aria-pressed={view === 'cards'} onClick={() => onView('cards')}>
            Cartes
          </button>
        </div>
      </div>
      {view === 'cards' ? (
        <CardGrid entries={entries} tag={tag} heading={title} notify={notify} />
      ) : (
        <Leaderboard entries={entries} showBarValues={showBarValues} />
      )}
    </section>
  );
}
