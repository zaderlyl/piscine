# Feuille de route

État du projet et prochaines étapes. La vision complète est dans le [README](../README.md) (section 18). Ce fichier se met à jour à chaque PR qui termine une étape.

Pour prendre une tâche : ouvre une issue ou préviens le mainteneur (voir [CONTRIBUTING.md](../CONTRIBUTING.md)).

> L'avancement détaillé est dans le tableau **Projects** du dépôt. Cette page garde la vision des grandes étapes.

## Étape en cours : prototypes techniques

Tout tourne dans le navigateur (compatible GitHub Pages).

- [x] Éditeur multi-fichiers (HTML, CSS, JS) avec aperçu
- [x] Tests JS automatiques dans l'aperçu
- [x] Emmet limité, débloqué par la réussite des exos
- [x] Éléments HTML obsolètes (`font`, `center`, `marquee`, `frameset`) : testés
- [x] Documentation dans un panneau (Énoncé, Cours, Méthode, Indice)
- [x] Correctif : insertion des tests dans le document (cas `frameset`) et encodage UTF-8
- [x] PHP dans le navigateur (php-wasm)
- [ ] SQLite côté navigateur (sql.js)
- [ ] Faux terminal Bash
- [ ] Simulateur de tirage PTP (sans interface, élèves fictifs)
- [ ] Panneau de visualisation de la logique (variables, boucles, fonctions) : voir [visualisation-logique.md](visualisation-logique.md)
- [ ] Module Git visuel : niveaux 1 à 7 faits (moteur, page, exos 01 à 11). Reste : intégration en panneau (dépend de #29), retours pédagogiques affinés, test avec des élèves (issue [#36](https://github.com/zaderlyl/piscine/issues/36)) : voir [git-apprentissage.md](git-apprentissage.md)

## Contenu (exos)

Ordre des langages et notions attendues : [programme-par-langage.md](programme-par-langage.md).

Module HTML : 42 exos prévus (`00` à `41`, voir README section 3).

**Squelette**
- [ ] `00` : À quoi sert HTML
- [ ] `01` : Squelette à la main
- [ ] `02` : Le squelette en un raccourci (débloque `!`)
- [ ] `03` : `head` (title, meta)

**Texte**
- [x] `04` : Titres h1 à h6
- [ ] `05` : Paragraphes, `hr` (débloque `lorem`)
- [ ] `06` : Gras et italique
- [ ] `07` : Titre en gras ou en italique : qui contient qui ?
- [ ] `08` : Autres balises de texte
- [ ] `09` : Balises de sens (`abbr`, `cite`, `code`…)
- [ ] `10` : Reproduire un modèle de texte

**Couleurs**
- [ ] `11` : Noms, hexadécimal, `rgb`
- [ ] `12` : HTML à l'ancienne (`font`, `center`, `marquee`), à tester avant d'écrire

**Listes**
- [ ] `13` : Listes à puces et numérotées (débloque `ul>li*3`)
- [ ] `14` : Options des listes et listes de définitions
- [ ] `15` : Listes imbriquées

**Liens**
- [ ] `16` : Liens externes
- [ ] `17` : Ancres dans la page
- [ ] `18` : Liens vers un deuxième espace
- [ ] `19` : `mailto`, `tel`, `download`

**Images**
- [ ] `20` : Images (`src`, `alt`)
- [ ] `21` : `figure`, `figcaption`, `picture`
- [ ] `22` : Image cliquable
- [ ] `23` : Zones cliquables (`map`, `area`)

**Tableaux**
- [ ] `24` : Tableau simple (débloque `table>tr*3>td*3`)
- [ ] `25` : Tableau complet
- [ ] `26` : Cellules fusionnées

**Structure**
- [ ] `27` : `div` et `span`
- [ ] `28` : `header`, `nav`, `main`, `section`, `article`, `footer`
- [ ] `29` : Cadres `iframe` et `frameset` (historique, à tester)

**Formulaires**
- [ ] `30` : `form`, `input`, `label`
- [ ] `31` : Types d'input
- [ ] `32` : `select`, `option`, `datalist`
- [ ] `33` : `textarea`, `button`, `fieldset`
- [ ] `34` : Validation (`required`, `pattern`)
- [ ] `35` : Formulaire complet

**Interactifs et médias**
- [ ] `36` : `details`, `dialog`, `progress`, `meter`
- [ ] `37` : `audio`, `video`, `canvas`

**Finitions**
- [ ] `38` : Caractères spéciaux
- [ ] `39` : Attributs globaux
- [ ] `40` : Palier : une page complète à cahier des charges
- [ ] `41` : Projet : page personnelle

### Module JavaScript (DOM et Événements)
- [x] `13` : Sélection d'éléments (`querySelector` et `querySelectorAll`)
- [x] `14` : Manipulation de texte, classes CSS (`classList`) et attributs `dataset`
- [x] `15` : Écouteurs d'événements avec `addEventListener` et l'objet événement (`e`)
- [x] `16` : Délégation d'événements pour les listes dynamiques (`e.target`)
- [x] `17` : Rendu dynamique avec la balise `<template>` et clonage propre (`cloneNode(true)`)
- [x] `18` : Sauvegarde locale sans serveur avec `localStorage` (score ou préférence)
- [x] `19` : Bruitages légers avec l'API HTML5 Audio (`new Audio().play()`)
- [x] `20` : Animations d'apparition avec `IntersectionObserver`
- [x] `21` : Modularité native : découper son code avec `<script type="module">` (`import` / `export`)

L'écriture des exos demande peu de code : c'est la tâche idéale pour contribuer. Voir [ecrire-un-exo.md](ecrire-un-exo.md).

## Ensuite

Dans l'ordre du README : comptes et rôles, import des exos Markdown, module HTML complet, gel de l'écran et chrono, échanges PTP, signalements, modules CSS/SVG/JS, Bash/PHP/MySQL, projets, pilote.
