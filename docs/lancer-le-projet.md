# Lancer le projet

Le prototype est **statique** : pas de `npm install`, pas de build. Il faut seulement un petit serveur local (le navigateur refuse de charger les exos depuis `file://`).

## Récupérer le code

```bash
git clone https://github.com/zaderlyl/piscine.git
cd piscine
```

## Lancer

Option 1, avec Python :

```bash
python3 -m http.server 8000
```

URL : http://localhost:8000/src/

Option 2, avec VS Code : extension **Live Server**, clic droit sur `src/index.html`, puis « Open with Live Server ».
URL : http://127.0.0.1:5500/src/index.html

Les bibliothèques (CodeMirror, Emmet, marked) sont chargées depuis internet : il faut une connexion.

## Mode auteur

Ajoute `?auteur` à l'URL pour afficher un bouton « Charger la solution ». Il remplit les éditeurs avec la solution de l'exo, pratique pour vérifier que les tests passent.

## Structure des dossiers

```
src/        code de la plateforme (index.html, style.css, script.js)
exos/       les exercices, un fichier Markdown par exo
  html/
    vanilla/
      04.md
assets/     images, sons, polices
docs/       documentation du projet
README.md   document de cadrage (le « pourquoi » et le « quoi »)
```

Un exo est rangé dans `exos/<langage>/<famille>/<numéro>.md`. Le format est décrit dans [ecrire-un-exo.md](ecrire-un-exo.md).

## Choisir l'exo affiché

Le prototype charge un seul exo, défini par la constante `FICHIER_EXO` en haut de `src/script.js`. Change-la pour tester un autre exo, mais **ne commite pas ce changement** sauf si la PR le demande.

## En cas de problème

- Page blanche ou rien ne s'affiche : ouvre la console (F12) et lis la première erreur.
- Modification non prise en compte : recharge sans cache (Cmd+Shift+R).
- « Aperçu suspendu » : le code de l'éditeur semble boucler à l'infini. Corrige-le, puis recharge.
