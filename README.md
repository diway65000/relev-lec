# Compteur Électrique (PWA)

Suivi de relevés de compteur électrique : saisie, historique, graphiques, coût au kWh.
Application web installable (PWA), qui fonctionne aussi hors ligne.
Les données sont enregistrées **dans le navigateur de l'appareil**.

## Mise en ligne sur GitHub Pages

1. Crée un dépôt GitHub (par ex. `compteur-electrique`) et dépose-y **tout le contenu** de ce dossier
   (y compris le dossier caché `.github`), sur la branche `main`.
2. Dans le dépôt : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
3. Va dans l'onglet **Actions** : le déploiement démarre tout seul (1 à 3 minutes).
   Sinon : Actions → « Déployer la PWA » → *Run workflow*.
4. L'adresse sera : `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/`

## Installer sur le téléphone

- **iPhone** : ouvrir le lien dans Safari → Partager → « Sur l'écran d'accueil ».
- **Android** : ouvrir le lien dans Chrome → ⋮ → « Installer l'application ».

## En local (optionnel)

```
npm install
npm run build:web      # génère dist/
npx serve dist         # ou tout autre serveur statique
```

Pour tester en mode développement : `npx expo start --web`.

## Mises à jour

Chaque `git push` sur `main` reconstruit et redéploie le site.
L'appli installée se met à jour à la réouverture suivante (parfois après deux ouvertures).
