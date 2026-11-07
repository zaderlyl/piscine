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

### 4.1. JS Vanilla — DOM et Événements (R3.12)
- **Sélection d'éléments** : `document.querySelector()`, `document.querySelectorAll()`
- **Modification du DOM** : `.textContent`, `.innerHTML`, `.setAttribute()`, attributs de style
- **Classes CSS dynamiques** : `.classList.add()`, `.classList.remove()`, `.classList.toggle()`
- **Écouteurs d'événements** : `addEventListener()`, gestion des clics, saisies (`input`), survols (`mouseover`)
- **Gestion des formulaires** : validation avant envoi, interception de l'événement `submit`, `preventDefault()`

### 4.2. JS Vanilla — Programmation fonctionnelle, Objets et Asynchronisme (R2.13, R3.12)
- **Méthodes avancées de tableaux** : `.forEach()`, `.map()`, `.filter()`, `.reduce()`, `.find()`, `.sort()`
- **Fonctions modernes** : fonctions fléchées (`=>`), paramètres par défaut, déstructuration d'objets et de tableaux
- **Conception objet et classes** : syntaxe `class`, constructeur `constructor`, méthodes, héritage avec `extends`
- **Asynchronisme et API** : promesses, syntaxe `async / await`, requêtes réseau avec `fetch()`, manipulation du format JSON

### 4.3. Graphisme 2D avec l'API Canvas (R3.12)
- Balise `<canvas>` et obtention du contexte 2D (`getContext("2d")`)
- Formes géométriques de base : rectangles (`fillRect`, `strokeRect`), tracés vectoriels (`beginPath`, `moveTo`, `lineTo`, `arc`)
- Couleurs, contours, opacité et dégradés
- Textes et affichage d'images dans le canvas
- Boucle d'animation fluide avec `requestAnimationFrame()` (gestion du delta time et effacement avec `clearRect`)
- Détection de collisions simples (boîtes englobantes AABB) et interactions souris/clavier sur canvas

### 4.4. Moteur de jeu 2D avec Phaser (R3.12 et projets)
- Initialisation et configuration d'une instance `Phaser.Game`
- Architecture des scènes Phaser et cycle de vie : `preload()`, `create()`, `update()`
- Chargement d'assets : images, feuilles de sprites (`spritesheets`), sons
- Physique Arcade : vélocité, gravité, rebonds, limites de monde (`collideWorldBounds`)
- Gestion des collisions : `physics.add.collider()`, `physics.add.overlap()`
- Contrôles au clavier : gestion des flèches et de la touche saut
- Gestion d'état de jeu : collecte d'objets, score à l'écran, vies, défaite/victoire

### 4.5. Interactivité déclarative avec Alpine.js (R3.12)
- Intégration légère sans bundler
- Directives d'état : `x-data`, `x-text`, `x-html`, `x-bind`
- Gestion des événements et interactions : `x-on:click` (`@click`), `x-show`, `x-if`
- Répétition déclarative de listes : `x-for`
- Transitions et animations : `x-transition`

### 4.6. Visualisation de données avec Chart.js (R3.12)
- Rendu de graphiques sur Canvas
- Types de graphiques : barres (`bar`), lignes (`line`), camemberts (`pie`, `doughnut`)
- Paramétrage des séries de données (`datasets`), axes, légendes et tooltips
- Mise à jour dynamique des données en temps réel

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
