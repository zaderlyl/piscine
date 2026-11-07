# Programme par langage

Ce document précise ce qu'on apprend dans chaque langage, et dans quel ordre. Il s'appuie sur le [README](../README.md) (section 3, et section 11 pour le module HTML) et sur le [référentiel MMI](referentiel-mmi.md).

Les étapes sont une **proposition**, à valider. Le principe : chaque notion arrive quand l'élève en a besoin. HTML et CSS vont d'abord, car ils ne demandent aucune logique et donnent un résultat visible tout de suite. L'algorithmique arrive juste avant JS, le premier langage qui calcule.

## Ordre proposé

1. HTML
2. CSS
3. Algorithmique (avant le premier langage qui calcule)
4. JavaScript
5. Git (en parallèle de JS, pour versionner ses exos)
6. Bash
7. PHP
8. SQL et MySQL
9. Projet et notions avancées

## 1. HTML

42 exos prévus, détaillés dans le README (section 11). Blocs :

- **Squelette** (exos 00 à 03) : structure d'une page, `head`, métadonnées.
- **Texte** (04 à 10) : titres, paragraphes, balises de mise en forme et de sens.
- **Couleurs** (11 et 12) : noms, hexadécimal, `rgb`. L'exo 12 (HTML obsolète) est à tester avant écriture.
- **Listes** (13 à 15) : listes à puces, numérotées, imbriquées.
- **Liens** (16 à 19) : liens externes, ancres, `mailto`, `tel`.
- **Images** (20 à 23) : `src`, `alt`, `figure`, image cliquable, zones cliquables.
- **Tableaux** (24 à 26) : tableaux simples, complets, cellules fusionnées.
- **Structure** (27 à 29) : `div` et `span`, `header`, `nav`, `main`, `section`, `article`. L'exo 29 (`frameset`, historique) est à tester avant écriture.
- **Formulaires** (30 à 35) : `form`, `input`, `select`, `textarea`, validation, formulaire complet.
- **Interactifs et médias** (36 et 37) : `details`, `dialog`, `audio`, `video`, `canvas`.
- **Attributs** (38 et 39) : caractères spéciaux, attributs globaux.
- **Palier et projet** (40 et 41) : page à cahier des charges, page personnelle.

Notion transversale (R1.11) : HTML sémantique et accessibilité, avec `alt` et balises de structure.

Outils (R1.12) : éditeur, navigateur, console et outils de développement. Lire une première erreur avant de corriger.

## 2. CSS

- Sélecteurs, cascade et spécificité
- Boîte : `margin`, `padding`, `border`, `display`
- Positionnement
- Typographie et couleurs
- Mise en page : flexbox et grille
- Responsive : media queries et points de rupture (R3.12)
- Accessibilité : contraste, focus visible, WCAG (R1.11, R3.12)
- Framework : Bootstrap (README)

## 3. Algorithmique

Vue juste avant JS. Les exemples peuvent être donnés en pseudo-code ou directement en JS.

- **Variables et types** : nombres, chaînes de caractères, booléens (`let`, `const`)
- **Conditions et branchements** : `if`, `else`, `else if`, opérateurs de comparaison (`===`, `!==`, `<`, `>`, `<=`, `>=`) et logiques (`&&`, `||`, `!`)
- **Boucles fondamentales** : boucle `while` (tant que) et boucle `for` (itérations avec compteur)
- **Fonctions** :
  - Déclaration et syntaxe
  - Paramètres d'entrée et arguments
  - Valeur de retour (`return`)
  - Portée des variables (portée de bloc, variables locales vs globales)
  - Fonctions pures et effets de bord
- **Structures de données fondamentales** :
  - Tableaux : création, indexation `[0]`, `.length`, ajout `.push()`
  - Parcours de tableau : boucles, accumulation de valeurs
  - Objets : paires clé-valeur, lecture et assignation de propriétés
- **Débogage et observation** :
  - Organigrammes algorithmiques (norme ISO : début, action, losange de condition, bouclage)
  - Tables de trace manuelle (valeurs des variables à chaque tour)
  - Points d'arrêt et `console.log`

Référentiel : R1.12, « Base de l'algorithmique (structures de contrôle et fonctions) » et « méthodes de débogage ».

## 4. JavaScript

Le module JavaScript est le plus vaste du cursus MMI. Il se découpe en sous-ressources progressives selon le référentiel :

### 4.1. Fondamentaux & Syntaxe moderne ES6+ (R1.12)
- **Variables et types** : `const` par défaut, `let` pour les réassignations, types primitifs (string, number, boolean).
- **Opérateurs et conditions** : `if`, `else`, opérateur ternaire, égalité stricte (`===`), chaînage optionnel (`?.`) et coalescence des nuls (`??`).
- **Boucles fondamentales** : boucle `while` (tant que), boucle `for` avec compteur, parcours moderne avec `for...of`.
- **Fonctions modernes** :
  - Déclaration classique et fonctions fléchées (`() => {}`).
  - Paramètres par défaut et valeur de retour (`return`).
  - Portée de bloc (`block scope`) et conservation lexicale du `this`.
- **Structures de données** :
  - Tableaux : indexation, `.length`, `.push()`.
  - Objets littéraux : paires clé-valeur.
  - Déstructuration d'objets et de tableaux (`const { x, y } = point;`).
  - Opérateur Spread et Rest (`...`) pour cloner et fusionner sans mutation.

### 4.2. DOM moderne, Événements et Persistance (R1.12, R3.12)
- **Sélection et manipulation du DOM** : `document.querySelector()`, `document.querySelectorAll()`, `.textContent`, `.classList` (`add`, `remove`, `toggle`), attributs `dataset`.
- **Gestion des événements** : écouteurs `addEventListener()`, objet d'événement `e`, interception `preventDefault()`.
- **Délégation d'événements** : propagation des événements (bubbling), détection avec `e.target` pour gérer dynamiquement des listes sans multiplier les écouteurs.
- **Rendu dynamique propre** : utilisation de la balise `<template>` et clonage via `.cloneNode(true)` pour éviter les concaténations non sécurisées avec `innerHTML`.
- **Modularité native sans bundler** : utilisation de `<script type="module">` avec `import` et `export` pour découper son code en modules sans Node ni Vite. *Point d'attention technique* : requiert un serveur local HTTP (Live Server, serveur Python ou bac à sable Piscine), car les navigateurs bloquent les imports sous le protocole `file:///` (règle CORS).
- **Persistance locale sans serveur** : Web Storage (`localStorage` et `sessionStorage`), sauvegarde d'état (meilleur score de jeu, préférences de thème clair/sombre).
- **Multimédia audio léger** : objet HTML5 `Audio` (`new Audio()`, lecture, pause, volume) pour les retours sonores d'interface et bruitages de jeux.
- **Défilement et visibilité** : API `IntersectionObserver` (déclenchement d'animations à l'apparition, lazy-loading d'images pour portfolios et vitrines).

### 4.3. Asynchronisme, Données et POO Passerelle (R2.13, R3.12)
- **Méthodes fonctionnelles de tableau** : `.forEach()`, `.map()`, `.filter()`, `.reduce()`, `.find()`, `.sort()`.
- **Asynchronisme moderne** : requêtes réseau avec `fetch()`, syntaxe linéaire `async / await` avec gestion propre des erreurs via `try...catch` (évite les chaînes verbeuses de `.then()`).
- **Manipulation des données JSON** : consommation d'API REST, parsing et sérialisation (`JSON.parse()`, `JSON.stringify()`).
- **Formulaires modernes** : objet `FormData` pour collecter automatiquement tous les champs et les envoyer proprement via `fetch` en méthode `POST`.
- **Parallélisation** : `Promise.all()` pour charger simultanément plusieurs ressources distantes (données JSON + assets graphiques).
- **Conception objet (POO)** : syntaxe `class`, constructeur `constructor`, méthodes et héritage (`extends`). Enseignée via des modèles concrets d'entités de jeu (`class Entite`, `class Ennemi`, coordonnées `x`, `y`, méthode `deplacer()`), servant de tremplin direct pour étendre les scènes Phaser (`class GameScene extends Phaser.Scene`) et aborder la POO en PHP (Module 7).

### 4.4. Graphisme 2D avec l'API Canvas (R3.12)
- Balise `<canvas>` et obtention du contexte 2D (`getContext("2d")`).
- Formes géométriques : rectangles (`fillRect`, `strokeRect`), tracés vectoriels (`beginPath`, `moveTo`, `lineTo`, `arc`).
- Couleurs, contours, typographie et dessin d'images sur le canvas.
- Boucle d'animation fluide avec `requestAnimationFrame()` (delta time et nettoyage via `clearRect`).
- Événements unifiés : Pointer Events (`pointerdown`, `pointermove`, `pointerup`) pour supporter souris, stylet et tactile sans distinction.
- Détection de collisions simples (boîtes englobantes AABB) et mini-jeu d'arcade interactif.
- *Rôle didactique clé* : cette étape permet aux étudiants de comprendre manuellement le cycle de rendu et la physique bas niveau, démystifiant totalement ce que fera le moteur Phaser sous le capot.

### 4.5. Visualisation de données avec Chart.js (R3.12)
- Rendu de graphiques dynamiques sur balise `<canvas>`.
- Types de graphiques : barres (`bar`), courbes/lignes (`line`), camemberts et beignets (`pie`, `doughnut`).
- Paramétrage complet : séries de données (`datasets`), axes, couleurs, légendes et tooltips.
- Mise à jour dynamique des données en temps réel (`chart.update()`).
- Cas d'usage MMI : dashboards de statistiques, data-visualisation interactive pour projets et SAÉ.

### 4.6. Moteur de jeu 2D avec Phaser (R3.12 et projets)
- Transition naturelle depuis Canvas 2D et la POO : réutilisation des concepts de boucle de rendu et d'héritage de classes (`class MainScene extends Phaser.Scene`).
- Initialisation et configuration d'une instance `Phaser.Game`.
- Architecture des scènes Phaser et cycle de vie : `preload()`, `create()`, `update()`.
- Chargement d'assets : images, feuilles de sprites (`spritesheets`), effets sonores.
- Physique Arcade : vélocité, gravité, rebonds, limites de monde (`collideWorldBounds`).
- Gestion des collisions : `physics.add.collider()`, `physics.add.overlap()`.
- Contrôles au clavier et tactile : déplacements, saut, tirs.
- Gestion d'état de jeu : collecte d'objets, score à l'écran, vies, défaite/victoire et sauvegarde du record avec `localStorage`.

### 4.7. Interactivité déclarative avec Alpine.js (R3.12)
- Intégration ultra-légère sans outillage de build.
- Directives d'état : `x-data`, `x-text`, `x-html`, `x-bind`.
- Gestion des événements et interactions : `x-on:click` (`@click`), `x-show`, `x-if`.
- Répétition déclarative de listes : `x-for`.
- Transitions et animations : `x-transition`.

C'est à cette étape que la visualisation de la logique (variables, boucles, fonctions) a le plus de sens : voir [visualisation-logique.md](visualisation-logique.md).

## 5. Git (proposition)

Le référentiel le place en R4 (gestion de versions). On le propose plus tôt, en parallèle de JS, pour que les élèves versionnent leurs exos.

- Commits, historique, état des fichiers (`status`, `log`)
- Branches : créer, changer de branche, fusionner (`merge`)
- Conflits : les repérer et les résoudre
- Dépôt distant : `push`, `pull`, pull request

## 6. Bash

- Navigation et manipulation de fichiers en ligne de commande
- Variables et scripts simples
- Léger, bases uniquement, après JS (README)

Référentiel : R4.DWeb-DI.08, « création de scripts ».

## 7. PHP

- Syntaxe : variables, tableaux, conditions, boucles, fonctions
- Générer des pages à partir de données (AC14.03)
- Formulaires et validation des données côté serveur (R2.13)
- Accès à une base de données avec PDO (SQLite en simulation)
- Requêtes préparées et échappement des données, pour la sécurité
- Sessions
- POO et MVC (R2.13, R3.12)
- Serveur local (R1.13) : installer un environnement PHP et MySQL en local (XAMPP, Laragon ou Docker, voir [lancer le projet](lancer-le-projet.md))

WordPress est reporté (README).

## 8. SQL et MySQL

- Modélisation : modèle conceptuel (MCD), puis modèle physique (MPD) (R2.14)
- Requêtes : `SELECT`, `WHERE`, `ORDER BY`, `GROUP BY` (agrégation), `JOIN`
- Modification : `INSERT`, `UPDATE`, `DELETE`
- Clés primaires et étrangères
- Formats d'échange : CSV, XML, JSON (R2.14)
- Sauvegarde et migration de base

Outils : phpMyAdmin, ou SQLite en simulation (README).

## 9. Projet et notions avancées

- Architecture : POO, MVC, principes SOLID et GRASP, design patterns (SAÉ 3)
- Déploiement : serveur web, réécriture d'URL, certificats, `npm` et `composer` (R4)
- Sécurité : chiffrement, certificats, validation et échappement côté serveur (R2 et R3)
- Accessibilité et éco-conception (SAÉ 3)

## Points à trancher

- **Git** : après JS, comme proposé ici, ou plus tard, comme dans le référentiel ?
- **Python** : absent du référentiel. À garder comme langage optionnel, ou à retirer ?
- **Durée** de chaque étape : à estimer avec les premiers pilotes.
