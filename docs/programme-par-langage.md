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

### 4.8. Points de vigilance pour l'animation en classe

Deux points critiques sont à anticiper par les intervenants pour garantir la fluidité des séances :

1. **Le piège CORS sur les modules ES (séance 21 et `<script type="module">`)** :
   - *Problème* : dès qu'un fichier HTML utilise `<script type="module">`, le navigateur applique la politique de sécurité Same-Origin et bloque le chargement local direct (`file:///`). Les étudiants qui ouvrent leur fichier par un double-clic obtiennent un écran blanc et une erreur bloquante en console.
   - *Anticipation pédagogique* : expliquer le modèle client-serveur HTTP dès le début de la séance. Imposer l'utilisation d'un serveur local (extension VS Code **Live Server** ou le bac à sable de la plateforme) avant toute manipulation.

2. **La gestion de la charge cognitive sur le Module 3 (séances 22 à 27)** :
   - *Problème* : ce bloc enchaîne les méthodes fonctionnelles (`map`, `filter`, `reduce`), l'asynchronisme (`fetch`, `async / await`) et la POO (`class`, `extends`). C'est la zone où le risque de décrochage est le plus élevé si les concepts sont présentés de manière abstraite.
   - *Solution fil conducteur* : réutiliser le jeu de données de l'inventaire manipulé au Module 1 (ex. un tableau d'objets `[ { nom, prix, stock, type } ]`). Les élèves n'ont aucune charge mentale sur la structure des données et se concentrent uniquement sur la nouvelle notion syntaxique.
   - *Calibrage* : limiter chaque exercice de ce bloc à 5 à 10 lignes de code maximum, avec un résultat immédiatement observable, pour maintenir le rythme et la motivation avant d'aborder la gratification visuelle du Canvas 2D.

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

Le module PHP introduit le développement côté serveur (Back-End) et le cycle de vie des requêtes HTTP (R2.13). Il assure la transition directe depuis la POO JavaScript vers l'architecture Back-End, la manipulation des bases de données relationnelles et la conception d'API JSON. Il se découpe en 7 sous-modules progressifs :

### 7.1. Fondamentaux, Syntaxe PHP 8+ & Templating serveur (R2.13)
- **Balises et syntaxe** : balises d'ouverture `<?php`, instruction d'affichage `echo`, terminaison par point-virgule `;`.
- **Variables et typage** : préfixe `$`, typage dynamique et strict (`declare(strict_types=1)`), types primitifs (string, int, float, bool).
- **Opérateurs et conditions** : concaténation avec le point `.`, conditions `if`, `else`, `elseif`, opérateur ternaire, null-safe `?->` et null-coalescing `??`.
- **Boucles et parcours** : boucles `while`, `for`, et parcours de tableaux avec `foreach ($tableau as $cle => $valeur)`.
- **Tableaux associatifs** : structures clé-valeur (`['id' => 1, 'nom' => 'Potion']`), fonctions natives de tableaux (`array_push`, `in_array`, `array_filter`).
- **Fonctions personnalisées** : déclaration, typage des arguments et des valeurs de retour (`function calculerTotal(array $items): float`).
- **Gestion moderne des dates et du temps** :
  - Définition du fuseau horaire par défaut : `date_default_timezone_set('Europe/Paris')`.
  - Manipulation de l'objet natif immuable `DateTimeImmutable` (évite les effets de bord de `DateTime`).
  - Formatage d'affichage français (`->format('d/m/Y H:i')`) et formatage standard SQL (`->format('Y-m-d H:i:s')`).
- **Templating serveur modulaire** : découpage d'une page HTML en composants avec `require_once` et `include` (`header.php`, `navbar.php`, `footer.php`).

### 7.2. Formulaires, Upload de fichiers ($_FILES) & Sécurité XSS / CSRF (R2.13)
- **Cycle HTTP** : différence fondamentale entre requête GET (lecture, recherche, partage d'URL) et requête POST (envoi sécurisé, mutation).
- **Lecture des données** : superglobales `$_GET` et `$_POST`.
- **Sécurité XSS (Cross-Site Scripting)** : neutralisation systématique des failles XSS à l'affichage via `htmlspecialchars($valeur, ENT_QUOTES, 'UTF-8')`.
- **Validation et assainissement** : vérification des champs requis (`empty()`, `isset()`), nettoyage avec `trim()`, validation de formats avec `filter_var()` (emails, entiers, URL).
- **Upload de fichiers sécurisé (`$_FILES`)** :
  - Attribut de formulaire obligatoire : `enctype="multipart/form-data"`.
  - Vérification de l'état d'upload via `$_FILES['image']['error'] === UPLOAD_ERR_OK` et contrôle de la taille maximale.
  - Validation du type MIME réel avec `mime_content_type()` (interdiction de se fier à la simple extension).
  - Renommage aléatoire sécurisé (`uniqid() . bin2hex(random_bytes(8)) . '.jpg'`) et déplacement avec `move_uploaded_file()` vers un dossier public dédié pour empêcher l'exécution de scripts malveillants.
- **Protection contre le CSRF (Cross-Site Request Forgery)** :
  - Génération d'un token aléatoire dans `$_SESSION['csrf_token'] = bin2hex(random_bytes(32))`.
  - Transmission dans le formulaire via un champ masqué `<input type="hidden" name="csrf_token" value="...">`.
  - Vérification stricte avec `hash_equals()` avant d'exécuter toute action POST.

### 7.3. Sessions, Cookies & Authentification sécurisée (R2.13)
- **Cookies HTTP** : fonctionnement des en-têtes `Set-Cookie`, création avec `setcookie()`, lecture via `$_COOKIE` et drapeaux de sécurité indispensables (`httponly`, `secure`, `samesite`).
- **Mécanisme des sessions** : initialisation avec `session_start()`, stockage d'état côté serveur dans la superglobale `$_SESSION`, destruction propre (`session_destroy()`).
- **Prévention de la fixation de session** : appel impératif de `session_regenerate_id(true)` immédiatement après validation du mot de passe lors de la connexion pour invalider l'identifiant de pré-session.
- **Sécurité des mots de passe** : hachage irréversible avec l'algorithme par défaut via `password_hash($mdp, PASSWORD_DEFAULT)` et vérification avec `password_verify()`.
- **Espace membre privé** : contrôle d'accès sur les pages protégées (redirection `header('Location: login.php'); exit;` si non authentifié) et déconnexion.

### 7.4. Programmation Orientée Objet (POO) & Autoloading (R2.13, R3.12)
- **Transition naturelle depuis la POO JS** : réutilisation directe des concepts de classes abordés en séance JS 27.
- **Classes et objets en PHP 8** : déclaration `class`, typage strict des propriétés, instanciation avec `new`.
- **Constructeur moderne** : promotion de propriétés dans `__construct(public string $nom, private int $prix)` pour un code concis et lisible.
- **Encapsulation et visibilité** : portée `public`, `private` et `protected`, accesseurs (getters) et mutateurs (setters).
- **Héritage** : mot-clé `extends`, surcharge de méthodes et appel du parent avec `parent::__construct()`.
- **Autoloading moderne sans bundler** : configuration de `spl_autoload_register()` pour charger automatiquement les classes à la volée selon leur nom de fichier, éliminant définitivement la forêt de `require_once` en haut des scripts.

### 7.5. Base de données avec PDO, Relations SQL & Sécurité (R2.13, R2.14)
- **Sécurisation des identifiants sans Composer** :
  - En PHP natif sans dépendance externe (`vlucas/phpdotenv`), les fichiers `.env` ne sont pas lus automatiquement.
  - La méthode robuste enseignée : un fichier PHP `config.local.php` retournant un tableau (`return ['db_user' => '...', 'db_pass' => '...'];`), exclu du dépôt par `.gitignore`, accompagné d'un gabarit versionné `config.example.php`.
- **Connexion PDO sécurisée** : instanciation de l'objet `PDO` obligatoirement enrobée dans un bloc `try ... catch (PDOException $e)` pour empêcher l'affichage de la pile d'appels et des mots de passe en clair en cas d'erreur de connexion.
- **Lecture sécurisée** : exécution de requêtes avec `query()` et récupération via `fetchAll(PDO::FETCH_ASSOC)`.
- **Protection absolue contre les injections SQL** : interdiction totale de concaténer des variables dans le SQL. Utilisation systématique des requêtes préparées avec `prepare()` et `execute([$param])` ou `bindParam()`.
- **Pagination SQL (anti-saturation mémoire)** :
  - Calcul dynamique des clauses `LIMIT :limit OFFSET :offset` à partir du paramètre d'URL (`?page=2`).
  - Décompte préalable du nombre total d'enregistrements via `SELECT COUNT(*) FROM table` pour calculer le nombre total de pages.
- **Relations SQL et requêtes jointes (anti-piège du N+1)** :
  - Clés étrangères (`FOREIGN KEY`).
  - Utilisation systématique des jointures `INNER JOIN` et `LEFT JOIN` pour récupérer les entités reliées (ex: un article et les données de son auteur) en une seule requête SQL, bannissant l'anti-pattern de la boucle `foreach` contenant une requête SQL par ligne.
- **Transactions PDO et intégrité relationnelle** :
  - Sécurisation des opérations multi-tables (ex: création d'une commande + décrémentation du stock) via `$pdo->beginTransaction()`, `$pdo->commit()` et `$pdo->rollBack()` dans un bloc `try / catch`. En cas d'erreur sur l'une des requêtes, la base annule toutes les modifications et reste dans un état intègre.
- **Opérations CRUD complètes** :
  - **Create** : insertion sécurisée (`INSERT INTO ...`).
  - **Read** : sélection filtrée avec jointure et pagination (`SELECT ... LIMIT ... OFFSET ...`).
  - **Update** : mise à jour de données existantes (`UPDATE ... WHERE id = ?`).
  - **Delete** : suppression contrôlée avec confirmation (`DELETE ... WHERE id = ?`).

### 7.6. Architecture MVC & Routage (R2.13, SAÉ)
- **Séparation des responsabilités (MVC)** :
  - **Modèle** : classes métiers et repositories instanciant PDO pour interroger la base de données.
  - **Vue** : templates HTML/PHP purs avec variables injectées, sans requêtes SQL ni logique métier.
  - **Contrôleur** : réception de la requête, interrogation du modèle, sélection et transmission des données à la vue.
- **Routage minimaliste** : point d'entrée unique `index.php` avec analyse du paramètre de route ou d'action (`?page=articles` ou `?action=detail&id=12`).

### 7.7. API Back-End JSON & Communication avec le Front-End (R2.13, R3.12)
- **En-têtes de réponse HTTP** : déclaration de `header('Content-Type: application/json; charset=utf-8')`.
- **Sérialisation JSON** : transformation de structures PHP en JSON avec `json_encode()`.
- **Le piège de la réception JSON (`php://input`)** :
  - Lorsque le client JavaScript envoie un payload JSON via `fetch('/api', { method: 'POST', body: JSON.stringify(data) })`, la superglobale `$_POST` est totalement vide (car PHP ne peuple `$_POST` que pour les formulaires URL-encoded ou multipart).
  - En PHP natif, il faut impérativement lire le flux d'entrée brut : `$json = file_get_contents('php://input');` puis décoder avec `$data = json_decode($json, true);`.
- **Codes de statut HTTP réels** : utilisation impérative de `http_response_code(400)` (Bad Request), `401` (Unauthorized) ou `404` (Not Found) afin que la propriété `response.ok` du `fetch()` JS détecte immédiatement les erreurs sans passer par un statut 200 trompeur.
- **Gestion du CORS en environnement de développement** : en-tête `header('Access-Control-Allow-Origin: *')` pour autoriser les requêtes venant d'un serveur local front (ex. Live Server port 5500) vers le serveur PHP (port 8000).

### 7.8. Points de vigilance pour l'animation en classe PHP

Trois points critiques doivent être anticipés lors des séances PHP :

1. **La sécurité par défaut dès le jour 1** :
   - *XSS* : neutraliser immédiatement toute écriture brute avec `htmlspecialchars()`.
   - *Injections SQL* : bannir formellement toute concaténation de variables dans les requêtes SQL ; imposer `prepare()` dès la première démonstration.
   - *CSRF* : exiger le token CSRF sur tous les formulaires modifiant des données en POST.
   - *Credentials PDO* : enrober obligatoirement la connexion PDO dans un `try / catch` et vérifier le `.gitignore` pour ne pas pousser d'identifiants sur GitHub.

2. **L'obligation du protocole HTTP local** :
   - Rappeler qu'un fichier PHP ne s'ouvre jamais via le protocole `file:///`. Un serveur HTTP local (Laragon, serveur interne `php -S`, Docker ou le bac à sable php-wasm de la plateforme) doit être démarré.

3. **Le piège CORS et les statuts HTTP lors des échanges Front/Back** :
   - Si les étudiants connectent leur front JS (port 5500) à leur API PHP (port 8000), vérifier que le header CORS est présent et que les statuts d'erreur HTTP (`400`, `404`) sont envoyés pour ne pas induire le front en erreur.

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
