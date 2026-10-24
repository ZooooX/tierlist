# Tier des potes

Site React pour classer ses amis jeu par jeu et générer leurs cartes de joueurs.

- Amis, jeux, critères et critères globaux (comme Délu) configurables dans l'onglet **Réglages**.
- Import et export de la config complète (structure et notes) en JSON.
- Export des cartes en image PNG : téléchargement, copie dans le presse-papiers ou partage sur mobile.
- Tout est stocké dans le `localStorage` du navigateur, rien n'est envoyé sur un serveur.

## Lancer

```bash
npm install
npm run dev
```

## Construire

```bash
npm run build
```

Le dossier `dist/` est un site statique (chemins relatifs) : il peut être posé sur n'importe quel hébergeur statique.

## Mise en ligne (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` construit et publie le site à chaque push sur `main`.
À faire une fois sur GitHub : **Settings → Pages → Source : GitHub Actions**.

## Calcul

- Moyenne d'un jeu : moyenne des critères notés de ce jeu.
- Note générale : moyenne pondérée des moyennes de jeu (poids du jeu) et des critères globaux (coef). Un jeu sans note est ignoré.
- Paliers des cartes : Légende à 80, Or à 65, Argent à 50, Bronze en dessous.
