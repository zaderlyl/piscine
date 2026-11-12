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
- [x] Panneau de visualisation de la logique (variables, boucles, fonctions) : voir [visualisation-logique.md](visualisation-logique.md)
- [ ] Module Git visuel : niveaux 1 à 7 faits (moteur, page, exos 01 à 11). Reste : intégration en panneau (dépend de #29), retours pédagogiques affinés, test avec des élèves (issue [#36](https://github.com/zaderlyl/piscine/issues/36)) : voir [git-apprentissage.md](git-apprentissage.md)

## Contenu (exos)

Ordre des langages et notions attendues : [programme-par-langage.md](programme-par-langage.md).

### Module HTML : 42 exos prévus (`00` à `41`, voir README section 3)

**Squelette**
- [x] `00` : À quoi sert HTML
- [x] `01` : Squelette à la main
- [x] `02` : Le squelette en un raccourci (débloque `!`)
- [x] `03` : `head` (title, meta)

**Texte**
- [x] `04` : Titres h1 à h6
- [ ] `05` : Paragraphes, `hr` (débloque `lorem`)
- [ ] `06` : Gras et italique
- [ ] `07` : Titre en gras ou en italique : qui contient qui ?
- [x] `08` : Autres balises de texte
- [x] `09` : Balises de sens (`abbr`, `cite`, `code`…)
- [x] `10` : Reproduire un modèle de texte

**Couleurs**
- [ ] `11` : Noms, hexadécimal, `rgb`
- [ ] `12` : HTML à l'ancienne (`font`, `center`, `marquee`), à tester avant d'écrire

**Listes**
- [x] `13` : Listes à puces et numérotées (débloque `ul>li*3`)
- [x] `14` : Options des listes et listes de définitions
- [x] `15` : Listes imbriquées

**Liens**
- [x] `16` : Liens externes
- [x] `17` : Ancres dans la page
- [x] `18` : Liens vers un deuxième espace
- [x] `19` : `mailto`, `tel`, `download`

**Images**
- [x] `20` : Images (`src`, `alt`)
- [x] `21` : `figure`, `figcaption`, `picture`
- [x] `22` : Image cliquable
- [x] `23` : Zones cliquables (`map`, `area`)

**Tableaux**
- [x] `24` : Tableau simple (débloque `table>tr*3>td*3`)
- [x] `25` : Tableau complet
- [x] `26` : Cellules fusionnées

**Structure**
- [x] `27` : `div` et `span`
- [x] `28` : `header`, `nav`, `main`, `section`, `article`, `footer`
- [x] `29` : Cadres `iframe` et `frameset` (historique, à tester)

**Formulaires**
- [x] `30` : `form`, `input`, `label`
- [x] `31` : Types d'input
- [x] `32` : `select`, `option`, `datalist`
- [x] `33` : `textarea`, `button`, `fieldset`
- [x] `34` : Validation (`required`, `pattern`)
- [x] `35` : Formulaire complet

**Interactifs et médias**
- [ ] `36` : `details`, `dialog`, `progress`, `meter`
- [ ] `37` : `audio`, `video`, `canvas`

**Finitions**
- [ ] `38` : Caractères spéciaux
- [ ] `39` : Attributs globaux
- [ ] `40` : Palier : une page complète à cahier des charges
- [ ] `41` : Projet : page personnelle

---

### Module JavaScript & Algorithmique (R1.12, R3.12)

Programme détaillé des 7 sous-modules : [programme-par-langage.md](programme-par-langage.md).

**1. Fondamentaux, Algorithmique & Syntaxe moderne (vanilla)**
- [x] `00` : À quoi sert JavaScript (variables, `const`)
- [x] `01` : Variables modifiables avec `let`
- [x] `02` : Calculs et opérations arithmétiques
- [x] `03` : La condition `if` et `else`
- [x] `04` : Répéter avec la boucle `for`
- [x] `05` : Créer sa première fonction (`return`)
- [x] `06` : La boucle `while` (tant que)
- [x] `07` : Fonctions fléchées `() => {}` et paramètres par défaut
- [x] `08` : Tableaux simples : déclaration, indexation et `.length`
- [x] `09` : Objets littéraux : paires clé-valeur
- [x] `10` : Déstructuration et opérateur Spread `...`
- [x] `11` : Données fiables avec le chaînage optionnel `?.` et le nullish coalescing `??`
- [x] `12` : Palier : simulation d'un inventaire de jeu complet

**2. DOM moderne, Événements et Persistance locale (vanilla)**
*Vigilance séance 21 : anticiper le protocole HTTP (Live Server) pour éviter les blocages CORS sur les modules.*
- [x] `13` : Sélectionner des éléments avec `querySelector` et `querySelectorAll`
- [x] `14` : Modifier le texte, classes CSS dynamiques et attributs `dataset`
- [x] `15` : Écouter un événement avec `addEventListener` et l'objet `e`
- [x] `16` : Délégation d'événements : gérer une liste dynamique avec `e.target`
- [x] `17` : Rendu propre avec la balise `<template>` et `.cloneNode(true)`
- [x] `18` : Sauvegarder des données locales avec `localStorage` (thème et score)
- [x] `19` : Retours sonores légers avec HTML5 `new Audio()`
- [x] `20` : Animation d'apparition au défilement avec `IntersectionObserver`
- [x] `21` : Modularité native : découper son code avec `<script type="module">` (`import` / `export`)

**3. Asynchronisme, Données et POO Passerelle (vanilla)**
*Fil conducteur : réutilisation des données de l'inventaire du Module 1, exercices calibrés courts (5 à 10 lignes) pour éviter le décrochage.*
- [ ] `22` : Méthodes de tableau fonctionnelles : `.map()`, `.filter()`, `.reduce()`
- [ ] `23` : Requêtes réseau modernes avec `fetch()` et `async / await`
- [ ] `24` : Gestion des erreurs réseau avec `try...catch`
- [ ] `25` : Formulaires automatiques avec l'objet `FormData`
- [ ] `26` : Chargement simultané de ressources avec `Promise.all()`
- [ ] `27` : POO tremplin : `class`, `constructor` et héritage (`extends`) pour Phaser et PHP

**4. Graphisme 2D Canvas (canvas)**
*Démystification de la boucle de rendu et des collisions manuelles avant Phaser.*
- [ ] `01` : Initialiser le canvas 2D et tracer des formes géométriques
- [ ] `02` : Couleurs, styles, images et effacement
- [ ] `03` : Boucle d'animation fluide avec `requestAnimationFrame`
- [ ] `04` : Pointer Events (`pointerdown`, `pointermove`) pour le dessin et le tactile
- [ ] `05` : Détection de collisions (AABB) et mini-jeu d'arcade

**5. Visualisation de données avec Chart.js (chartjs)**
- [ ] `01` : Premier graphique en barres avec Chart.js
- [ ] `02` : Graphique en courbes et personnalisation des axes
- [ ] `03` : Graphique circulaire (camembert / donut)
- [ ] `04` : Mise à jour dynamique des données avec `chart.update()`

**6. Moteur de jeu 2D avec Phaser (phaser)**
*Réutilisation de la POO (`class GameScene extends Phaser.Scene`) et de la physique Arcade.*
- [ ] `01` : Configuration et scène Phaser (`preload`, `create`, `update`)
- [ ] `02` : Spritesheets, animations et physique Arcade
- [ ] `03` : Contrôles au clavier, sauts et limites du monde
- [ ] `04` : Collisions, score et sauvegarde du record avec `localStorage`

**7. Interactivité déclarative avec Alpine.js (alpine)**
- [ ] `01` : État réactif avec `x-data` et affichage avec `x-text`
- [ ] `02` : Événements (`@click`) et bascule d'affichage (`x-show`)
- [ ] `03` : Rendu de listes dynamiques avec `x-for`
- [ ] `04` : Transitions et animations légères avec `x-transition`

---

### Module PHP (Sessions et Sécurité)
- [x] `03` : Cookies HTTP sécurisés (`setcookie` avec flags `httponly`, `secure`, `samesite`) et sessions serveur (`session_start`, `$_SESSION`)
- [x] `04` : Authentification sécurisée complète : hachage (`password_hash`, `password_verify`), régénération de session (`session_regenerate_id(true)`) et protection de page
- [x] `05` : Traitement de formulaires `$_POST`, assainissement XSS contextuel (`htmlspecialchars`), pattern PRG (Post-Redirect-Get) et messages flash en session
- [x] `06` : Protection anti-CSRF : génération de jeton aléatoire en session, vérification avec `hash_equals()`
- [x] `07` : Téléversement sécurisé de fichiers (`$_FILES`) : taille maximale, contrôle du type MIME réel (`mime_content_type`) et renommage

L'écriture des exos demande peu de code : c'est la tâche idéale pour contribuer. Voir [ecrire-un-exo.md](ecrire-un-exo.md).

## Ensuite

Dans l'ordre du README : comptes et rôles, import des exos Markdown, module HTML complet, gel de l'écran et chrono, échanges PTP, signalements, modules CSS/SVG/JS, Bash/PHP/MySQL, projets, pilote.
