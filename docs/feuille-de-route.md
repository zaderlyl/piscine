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
- [x] `00` : Cours : à quoi sert HTML
- [x] `01` : Un premier paragraphe (`p`)
- [x] `02` : Squelette à la main
- [x] `03` : Le squelette en un raccourci (débloque `!`)
- [x] `04` : `head` (title, meta)

**Texte**
- [x] `05` : Titres h1 à h6
- [x] `06` : Ligne horizontale `hr` (débloque `lorem`)
- [x] `07` : Gras et italique avec `strong` et `em`, et leur imbrication
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

Le module JS a **deux familles** sous la même ressource : `js/vanilla` (JavaScript pur, résultat en texte ou en nombres, comme on apprendrait Python) et `js/dom` (interactivité sur une page déjà faite, dont l'élève ne voit pas le code : il n'écrit que `script.js`, voir [ecrire-un-exo.md](ecrire-un-exo.md)).

**1. Fondamentaux, Algorithmique & Syntaxe moderne (`js/vanilla`)**
- [x] `00` : Cours : à quoi sert JavaScript (programme, variable)
- [x] `01` : Ma première variable (`const`)
- [x] `02` : Variables modifiables avec `let`
- [x] `03` : Calculs et opérations arithmétiques
- [x] `04` : La condition `if` et `else`
- [x] `05` : Répéter avec la boucle `for`
- [x] `06` : Créer sa première fonction (`return`)
- [x] `07` : La boucle `while` (tant que)
- [x] `08` : Fonctions fléchées `() => {}` et paramètres par défaut
- [x] `09` : Tableaux simples : déclaration, indexation et `.length`
- [x] `10` : Objets littéraux : paires clé-valeur
- [x] `11` : Déstructuration et opérateur Spread `...`
- [x] `12` : Données fiables avec le chaînage optionnel `?.` et le nullish coalescing `??`
- [x] `13` : Palier : simulation d'un inventaire de jeu complet

**2. Données et POO passerelle (`js/vanilla`)**
*Fil conducteur : réutilisation des données de l'inventaire, exercices calibrés courts (5 à 10 lignes) pour éviter le décrochage.*
- [x] `14` : Méthodes de tableau fonctionnelles : `.map()`, `.filter()`, `.reduce()`
- [x] `15` : Gestion des erreurs avec `try...catch`
- [x] `16` : POO tremplin : `class`, `constructor` et héritage (`extends`) pour Phaser et PHP

**3. DOM, Événements et Persistance locale (`js/dom`)**
*Page fournie et non affichée : l'énoncé liste les `id` et classes à utiliser. Vigilance séance 21 : anticiper le protocole HTTP (Live Server) pour éviter les blocages CORS sur les modules.*
- [x] `00` : Cours : le DOM, la page vue par JavaScript
- [x] `01` : Retrouver un élément avec `getElementById`
- [x] `02` : Sélectionner des éléments avec `querySelector` et `querySelectorAll`
- [x] `03` : Modifier le texte, classes CSS dynamiques et attributs `dataset`
- [x] `04` : Écouter un événement avec `addEventListener` et l'objet `e`
- [x] `05` : Délégation d'événements : gérer une liste dynamique avec `e.target`
- [x] `06` : Rendu propre avec la balise `<template>` et `.cloneNode(true)`
- [x] `07` : Sauvegarder des données locales avec `localStorage` (thème et score)
- [x] `08` : Retours sonores légers avec HTML5 `new Audio()`
- [x] `09` : Animation d'apparition au défilement avec `IntersectionObserver`
- [x] `10` : Modularité native : découper son code avec `<script type="module">` (`import` / `export`)
- [ ] `11` : Requêtes réseau modernes avec `fetch()` et `async / await`
- [ ] `12` : Formulaires automatiques avec l'objet `FormData`
- [ ] `13` : Chargement simultané de ressources avec `Promise.all()`
*Les exos `01` à `09` ont une page cachée. Le `10` garde son propre `index.html` : il enseigne la balise `<script type="module">`, que l'élève doit donc écrire lui-même (la page cachée n'accepte pas encore les modules).*

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
- [x] `00` : Cours : à quoi sert PHP (côté serveur, `echo`)
- [x] `01` : Premier script, `declare(strict_types=1)` dès le départ, balises `<?php ?>`, types et concaténation
- [x] `02` : Structures de contrôle (`if`, `else`, ternaire), boucles (`while`, `for`, `foreach`) et tableaux associatifs
- [x] `03` : Fonctions typées, gestion moderne du temps (`DateTimeImmutable`, fuseau horaire) et templating (`require_once`)

**2. Sessions, Cookies & Authentification sécurisée (R2.13)**
*Les sessions sont apprises ici afin d'être disponibles pour le token CSRF au module suivant.*
- [x] `04` : Cookies HTTP sécurisés (`setcookie`, `httponly`, `secure`) et sessions serveur (`session_start`, `$_SESSION`)
- [x] `05` : Authentification complète : hachage (`password_hash`, `password_verify`), régénération (`session_regenerate_id(true)`) et protection de page

**3. Formulaires sécurisés, Uploads & Pattern PRG (R2.13)**
- [x] `06` : Formulaires `$_GET` / `$_POST`, assainissement XSS contextuel, pattern PRG (Post-Redirect-Get) et messages flash en session (`$_SESSION['flash']`)
- [x] `07` : Protection CSRF : génération de token en session, vérification avec `hash_equals()` et conservation des données
- [x] `08` : Upload de fichiers sécurisé (`$_FILES`) : `enctype`, taille max, contrôle MIME réel, renommage et stockage sécurisé (hors racine web ou `.htaccess`)

**4. Programmation Orientée Objet (POO) & Autoloading (R2.13, R3.12)**
*Transition directe depuis la POO JavaScript (séance 27) pour structurer le code avant la persistance.*
- [ ] `09` : Classes PHP 8, constructeur avec promotion de propriétés, typage strict et instanciation `new`
- [ ] `10` : Encapsulation (`public`, `private`, accesseurs) et héritage (`extends`, `parent::__construct()`)
- [ ] `11` : Autoloading de classes sans dépendance avec `spl_autoload_register()` (fin de la forêt de `require_once`)

**5. Base de données avec PDO, Relations SQL & Transactions (R2.13, R2.14)**
*Sécurisation des identifiants (config.local.php + .gitignore), try/catch et requêtes préparées systématiques.*
- [ ] `12` : Configuration locale et connexion sécurisée `PDO` enrobée dans un `try / catch`
- [ ] `13` : Requêtes préparées PDO (`prepare`, `execute`) et opérations CRUD fondamentales
- [ ] `14` : Pagination SQL : clauses `LIMIT` et `OFFSET` avec typage obligatoire (`bindValue(..., PDO::PARAM_INT)`) et décompte `COUNT(*)`
- [ ] `15` : Relations SQL et jointures (`INNER JOIN`, `LEFT JOIN`) pour éliminer l'anti-pattern des requêtes N+1
- [ ] `16` : Transactions PDO (`beginTransaction`, `commit`, `rollBack`) pour l'intégrité des opérations multi-tables

**6. Architecture MVC & Routage (R2.13, SAÉ)**
- [ ] `17` : Séparation des responsabilités : isoler Modèle (classes PDO), Vue (HTML) et Contrôleur
- [ ] `18` : Point d'entrée unique `index.php`, routage par action et fallback 404 obligatoire (`http_response_code(404)` et vue dédiée)

**7. API Back-End JSON & Communication avec le Front-End (R2.13, R3.12)**
- [ ] `19` : Réception de requêtes JSON du client JS via le flux brut `php://input` (contournement du piège de `$_POST` vide)
- [ ] `20` : Renvoyer du JSON avec `json_encode()`, codes HTTP réels (`http_response_code`) et gestion du CORS avec requêtes Preflight `OPTIONS`

---

### Module SQL (R2.13, R2.14)

Programme détaillé : [programme-par-langage.md](programme-par-langage.md), section 8. Les exos classiques sont vérifiés par le texte de la requête, les paliers par le tableau obtenu (lecture) ou par le contenu des tables (écriture) : voir [ecrire-un-exo.md](ecrire-un-exo.md).

**1. Schéma : tables, colonnes et clés (`sql/schema`)**
- [x] `00` : Cours : qu'est-ce qu'une base de données
- [x] `01` : Colonnes et lignes
- [x] `02` : Les types de colonnes
- [x] `03` : La clé primaire
- [x] `04` : Relier deux tables

**2. Requêtes de lecture (`sql/requetes`)**
- [x] `00` : Cours : à quoi sert SQL
- [x] `01` : Ma première requête (`SELECT *`)
- [x] `02` : Afficher des colonnes avec `SELECT`
- [x] `03` : Filtrer avec `WHERE`
- [x] `04` : Combiner des conditions avec `AND` et `OR`
- [x] `05` : Trier avec `ORDER BY`
- [x] `06` : Limiter avec `LIMIT`
- [x] `07` : Palier : lire une table (vérifié par le résultat)
- [x] `08` : Relier deux tables avec `INNER JOIN`
- [x] `09` : Palier : lire plusieurs tables (vérifié par le résultat)
- [x] `10` : Compter avec `COUNT`
- [x] `11` : Regrouper avec `GROUP BY`
- [x] `12` : Garder toutes les lignes avec `LEFT JOIN`
- [x] `13` : Palier : calculer et regrouper (vérifié par le résultat)

**3. Requêtes d'écriture (`sql/ecriture`)**
- [x] `00` : Cours : modifier les données
- [x] `01` : Ajouter une ligne avec `INSERT`
- [x] `02` : Modifier des lignes avec `UPDATE`
- [x] `03` : Supprimer des lignes avec `DELETE`
- [x] `04` : Palier : modifier une table (vérifié par l'état des tables)

**4. À faire**
- [ ] Autres fonctions d'agrégation (`SUM`, `AVG`, `MIN`, `MAX`) et `HAVING`
- [ ] Créer et modifier des tables (`CREATE TABLE`, clés primaires et étrangères en SQL)
- [ ] Projet SQL de fin de module

---

L'écriture des exos demande peu de code : c'est la tâche idéale pour contribuer. Voir [ecrire-un-exo.md](ecrire-un-exo.md).

## Ensuite

Dans l'ordre du README : comptes et rôles, import des exos Markdown, module HTML complet, gel de l'écran et chrono, échanges PTP, signalements, modules CSS/SVG/JS, Bash/PHP/MySQL, projets, pilote.
