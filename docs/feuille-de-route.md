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
- [x] SQLite côté navigateur (sql.js)
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

### Module PHP & Architecture Web (R1.13, R2.13, R2.14)

Programme calibré en 20 séances de TP complètes : [programme-par-langage.md](programme-par-langage.md).

**1. Fondamentaux, Typage strict & Templating serveur**
- [x] `00` : Premier script, `declare(strict_types=1)` dès le départ, balises `<?php ?>`, types et concaténation
- [x] `01` : Structures de contrôle (`if`, `else`, ternaire), boucles (`while`, `for`, `foreach`) et tableaux associatifs
- [x] `02` : Fonctions typées, gestion moderne du temps (`DateTimeImmutable`, fuseau horaire) et templating (`require_once`)

**2. Sessions, Cookies & Authentification sécurisée (R2.13)**
*Les sessions sont apprises ici afin d'être disponibles pour le token CSRF au module suivant.*
- [x] `03` : Cookies HTTP sécurisés (`setcookie`, `httponly`, `secure`) et sessions serveur (`session_start`, `$_SESSION`)
- [x] `04` : Authentification complète : hachage (`password_hash`, `password_verify`), régénération (`session_regenerate_id(true)`) et protection de page

**3. Formulaires sécurisés, Uploads & Pattern PRG (R2.13)**
- [x] `05` : Formulaires `$_GET` / `$_POST`, assainissement XSS contextuel, pattern PRG (Post-Redirect-Get) et messages flash en session (`$_SESSION['flash']`)
- [x] `06` : Protection CSRF : génération de token en session, vérification avec `hash_equals()` et conservation des données
- [x] `07` : Upload de fichiers sécurisé (`$_FILES`) : `enctype`, taille max, contrôle MIME réel, renommage et stockage sécurisé (hors racine web ou `.htaccess`)

**4. Programmation Orientée Objet (POO) & Autoloading (R2.13, R3.12)**
*Transition directe depuis la POO JavaScript (séance 27) pour structurer le code avant la persistance.*
- [ ] `08` : Classes PHP 8, constructeur avec promotion de propriétés, typage strict et instanciation `new`
- [ ] `09` : Encapsulation (`public`, `private`, accesseurs) et héritage (`extends`, `parent::__construct()`)
- [ ] `10` : Autoloading de classes sans dépendance avec `spl_autoload_register()` (fin de la forêt de `require_once`)

**5. Base de données avec PDO, Relations SQL & Transactions (R2.13, R2.14)**
*Sécurisation des identifiants (config.local.php + .gitignore), try/catch et requêtes préparées systématiques.*
- [ ] `11` : Configuration locale et connexion sécurisée `PDO` enrobée dans un `try / catch`
- [ ] `12` : Requêtes préparées PDO (`prepare`, `execute`) et opérations CRUD fondamentales
- [ ] `13` : Pagination SQL : clauses `LIMIT` et `OFFSET` avec typage obligatoire (`bindValue(..., PDO::PARAM_INT)`) et décompte `COUNT(*)`
- [ ] `14` : Relations SQL et jointures (`INNER JOIN`, `LEFT JOIN`) pour éliminer l'anti-pattern des requêtes N+1
- [ ] `15` : Transactions PDO (`beginTransaction`, `commit`, `rollBack`) pour l'intégrité des opérations multi-tables

**6. Architecture MVC & Routage (R2.13, SAÉ)**
- [ ] `16` : Séparation des responsabilités : isoler Modèle (classes PDO), Vue (HTML) et Contrôleur
- [ ] `17` : Point d'entrée unique `index.php`, routage par action et fallback 404 obligatoire (`http_response_code(404)` et vue dédiée)

**7. API Back-End JSON & Communication avec le Front-End (R2.13, R3.12)**
- [ ] `18` : Réception de requêtes JSON du client JS via le flux brut `php://input` (contournement du piège de `$_POST` vide)
- [ ] `19` : Renvoyer du JSON avec `json_encode()`, codes HTTP réels (`http_response_code`) et gestion du CORS avec requêtes Preflight `OPTIONS`

---

### Module SQL (R2.13, R2.14)

Programme détaillé : [programme-par-langage.md](programme-par-langage.md), section 8. Les exos classiques sont vérifiés par le texte de la requête, les paliers par le tableau obtenu (voir [ecrire-un-exo.md](ecrire-un-exo.md)).

**1. Schéma : tables, colonnes et clés (`sql/schema`)**
- [x] `01` : Colonnes et lignes
- [x] `02` : Les types de colonnes
- [x] `03` : La clé primaire
- [x] `04` : Relier deux tables

**2. Requêtes de lecture (`sql/requetes`)**
- [x] `00` : À quoi sert SQL (`SELECT *`)
- [x] `01` : Afficher des colonnes avec `SELECT`
- [x] `02` : Filtrer avec `WHERE`
- [x] `03` : Combiner des conditions avec `AND` et `OR`
- [x] `04` : Trier avec `ORDER BY`
- [x] `05` : Limiter avec `LIMIT`
- [x] `06` : Palier : lire une table (vérifié par le résultat)
- [x] `07` : Relier deux tables avec `INNER JOIN`
- [x] `08` : Palier : lire plusieurs tables (vérifié par le résultat)

**3. À faire**
- [ ] Requêtes d'écriture (`INSERT`, `UPDATE`, `DELETE`), dans une famille `sql/ecriture` : la vérification compare l'état de la table après la requête
- [ ] Agrégation (`COUNT`, `GROUP BY`) et `LEFT JOIN`
- [ ] Vérifier les solutions SQL en CI (installer `sql.js` en `devDependency`)

---

L'écriture des exos demande peu de code : c'est la tâche idéale pour contribuer. Voir [ecrire-un-exo.md](ecrire-un-exo.md).

## Ensuite

Dans l'ordre du README : comptes et rôles, import des exos Markdown, module HTML complet, gel de l'écran et chrono, échanges PTP, signalements, modules CSS/SVG/JS, Bash/PHP/MySQL, projets, pilote.
