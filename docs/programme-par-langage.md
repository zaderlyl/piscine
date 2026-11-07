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

## 3. Algorithmique & Résolution de problèmes

L'algorithmique est abordée immédiatement avant JavaScript et PHP, les premiers langages qui calculent et prennent des décisions. Elle pose les schémas de pensée universels indispensables pour tout le reste du cursus (JS, Canvas 2D, Phaser, PHP et SQL).

Elle s'appuie sur le démonstrateur visuel interactif ([visualisation-logique.md](visualisation-logique.md)) pour matérialiser l'exécution pas à pas, la table de trace et les formes normalisées ISO 5807.

Le programme d'algorithmique est structuré en deux niveaux progressifs :
- **Niveau 1 : Le Socle indispensable (Piscine)** : les notions, syntaxes et patterns à acquérir obligatoirement pour savoir programmer.
- **Niveau 2 : Approfondissements & Culture Dev (Ouverture)** : les pièges avancés du web/multimédia, la complexité et les optimisations.

---

### PARTIE A : LE SOCLE INDISPENSABLE (NIVEAU 1 - PISCINE)

#### 3.1. Approche didactique et formalisme (R1.12)
- **Double formalisme : Pseudo-code et Code exécutable** :
  - Le pseudo-code algorithmique standardisé sert d'outil de conception papier lors des évaluations écrites de la ressource R1.12.
  - En travaux pratiques, les algorithmes sont traduits directement en syntaxe épurée (JavaScript et PHP 8+) pour être exécutés et testés immédiatement.
- **Visualisation tridirectionnelle** : chaque algorithme est analysé sous trois angles complémentaires : le code source, l'organigramme (norme ISO 5807) et la table de trace pas à pas (état des variables ligne par ligne).

#### 3.2. Modèle mémoire, variables et expressions
- **Variables et modèle mémoire** :
  - Distinction fondamentale entre l'identifiant (nom), l'adresse mémoire et la valeur stockée.
  - Constantes (`const` par défaut) pour les valeurs invariantes, variables (`let` en JS, `$var` en PHP) pour les accumulateurs et compteurs.
  - Distinction formelle entre l'affectation (`=`) et la comparaison.
- **Rigueur sur l'égalité : pourquoi privilégier `===`** :
  - L'opérateur d'égalité lâche (`==`) effectue des coercitions de types implicites sources de comportements contre-intuitifs (ex. en JS : `"" == 0` renvoie `true`, `false == "0"` renvoie `true`).
  - En PHP 8+, la table de comparaison de `==` a été révisée (ex. `"abc" == 0` est désormais `false`, alors qu'il était `true` en PHP 7), créant des divergences supplémentaires.
  - *Règle de rigueur* : utiliser systématiquement l'égalité stricte (`===`) et l'inégalité stricte (`!==`), qui vérifient à la fois la valeur et le type.
- **Absence de valeur : `null` vs `undefined`** :
  - `null` : absence explicite et volontaire de valeur (ex. aucun ennemi ciblé).
  - `undefined` : variable déclarée non initialisée, ou accès à un index inexistant dans un tableau (`tab[10]` sur 3 éléments). *Note : PHP n'a pas de type `undefined` ; une variable non initialisée y est absente (warning) ou `null`.*
- **L'opérateur Modulo (%) et la cyclicité** :
  - Reste de la division entière, indispensable pour tester l'alternance et la parité (`n % 2 === 0` / `$n % 2 === 0`).
  - Navigation cyclique sans débordement d'indice (ex. carrousel d'images, inventaire en boucle) : `index = (index + 1) % tab.length`.
  - Conversion d'un indice de tableau 1D plat en coordonnées de grille 2D : `colonneX = index % largeur` et `ligneY = Math.floor(index / largeur)`.

#### 3.3. Structures de contrôle fondamentales
- **Branchements conditionnels (`if`, `else if`, `else`)** :
  - Comparaisons et algèbre de Boole : ET logique (`&&`), OU logique (`||`), NON logique (`!`).
  - Évaluation en court-circuit : sécuriser l'accès aux propriétés (`if (joueur !== null && joueur.hp > 0)`).
  - *Pattern des clauses de garde* : traiter les cas d'erreur ou d'arrêt en tout début de fonction avec un `return` immédiat pour éviter l'imbrication excessive de blocs `if`.
- **Itérations bornées (boucle `for`)** :
  - Boucle à compteur : initialisation (`let i = 0`), condition de continuation (`i < limite`), incrémentation (`i++`).
  - Parcours linéaire classique d'un tableau de gauche à droite.
- **Itérations non bornées (boucle `while`) et règle des 3 phases** :
  - Répétition tant qu'un prédicat est vrai (ex. attente, jeu, réduction arithmétique).
  - *Règle des 3 phases (anti-boucle infinie)* :
    1. Phase 1 : Initialisation de la variable de condition avant la boucle.
    2. Phase 2 : Test de continuation en tête de boucle.
    3. Phase 3 : **Mise à jour impérative de l'état avant l'accolade fermante**.
- **Ruptures de séquence** : `break` pour interrompre immédiatement une boucle, `continue` pour sauter directement à l'itération suivante.

#### 3.4. Décomposition fonctionnelle et modularité
- **Signature et contrat d'une fonction** : paramètres reçus en entrée, calcul interne, et valeur unique renvoyée via `return`.
- **Portée lexicale (Scope) et pile d'appels (Call Stack)** :
  - Portée de bloc : les variables déclarées à l'intérieur d'une fonction ou d'une boucle n'existent pas à l'extérieur.
  - Empilement du cadre local lors de l'appel, et **destruction immédiate des variables locales lors du `return`**.
- **Passage par valeur vs référence** :
  - Les primitifs (nombres, chaînes, booléens) sont transmis par copie de valeur.
  - Les collections (tableaux, objets) sont transmises par référence mémoire : modifier un tableau dans une fonction altère directement la structure externe si elle n'a pas été clonée au préalable.

#### 3.5. Les 7 patterns algorithmiques incontournables
Ces 7 patrons de conception sont universels et constituent la boîte à outils quotidienne du développeur :

1. **La permutation de valeurs (Swap)** :
   - Échanger le contenu de deux variables sans écraser la valeur d'origine.
   - Méthode canonique avec variable temporaire : `temp = a; a = b; b = temp;` (en PHP : `$temp = $a; $a = $b; $b = $temp;`).
   - Transcription moderne par déstructuration (JS) : `[a, b] = [b, a]`.
2. **L'accumulation et élément neutre** :
   - Cumuler des valeurs dans une variable réassignée à chaque tour (`total = total + valeur`).
   - *Règle de l'élément neutre* : initialiser à `0` pour une addition (`somme = 0`), chaîne vide pour du texte (`texte = ""`), mais impérativement à **`1`** pour un produit ou multiplicateur (`produit = 1`), sous peine de bloquer le résultat final à zéro.
3. **Le comptage sélectif** :
   - Compter le nombre d'éléments validant une condition (ex. nombre de produits en stock).
   - Initialiser un compteur à `0`, et n'incrémenter (`compteur++`) qu'à l'intérieur d'un `if`.
4. **La recherche d'extremum (Minimum / Maximum)** :
   - *Étape 1 (Clause de garde obligatoire)* : tester impérativement si le tableau est vide (`if (tab.length === 0) return null;`) pour éviter d'injecter `undefined` dans les calculs.
   - *Étape 2 (Initialisation sur le premier élément)* : une fois la garde franchie, initialiser `let max = tab[0];` (ne jamais initialiser arbitrairement à `0`, ce qui fausserait le calcul sur un tableau de nombres exclusivement négatifs).
5. **La recherche séquentielle (Flag & ID)** :
   - Trouver un élément répondant à un identifiant ou un critère.
   - *Le piège universel du `return` dans le `else` (à bannir formellement)* :
     ```javascript
     // ERREUR CLASSIQUE (stoppe dès le 1er élément testé !) :
     for (let i = 0; i < tab.length; i++) {
       if (tab[i].id === cibleId) {
         return tab[i];
       } else {
         return null; // FAUX !
       }
     }

     // SCHÉMA CORRECT (l'échec ne se constate qu'après la fin de la boucle) :
     for (let i = 0; i < tab.length; i++) {
       if (tab[i].id === cibleId) {
         return tab[i]; // Trouvé : arrêt immédiat
       }
     }
     return null; // Non trouvé après avoir inspecté TOUT le tableau
     ```
6. **Le filtrage et partitionnement** :
   - Parcourir une collection source pour créer une nouvelle collection ne conservant que les éléments conformes (socle conceptuel de `.filter()` en JS, `array_filter()` en PHP et `WHERE` en SQL).
7. **La validation globale par drapeau (Flag)** :
   - Déterminer si une condition s'applique à tous les éléments ou au moins un élément (socle de `.every()` et `.some()`).
   - *Application géométrique multimédia* : le test d'intersection AABB (boîtes englobantes alignées sur les axes) pour la détection de contact dans les jeux Canvas 2D et Phaser.

#### 3.6. Méthodologie d'analyse : Table de trace (R1.12) et ISO 5807
- **Organigrammes normalisés (ISO 5807)** :
  - Rectangles arrondis : Début / Fin.
  - Parallélogrammes : Entrées / Sorties de données (`console.log`, `echo`).
  - Losanges : Décisions et embranchements conditionnels (branches Vrai / Faux).
  - Rectangles : Processus de calcul et affectations.
  - Rectangles à double barre latérale : Sous-programmes / Appels de fonctions.
- **Table de trace manuelle (Format examen)** :
  - Remplir pas à pas un tableau comprenant une colonne par étape, une colonne pour la ligne de code active, l'évaluation de la condition, **une colonne dédiée par variable**, la sortie écran et l'effet produit.

---

### PARTIE B : APPROFONDISSEMENTS & CULTURE DEV (NIVEAU 2 - OUVERTURE)

#### 3.7. Pièges classiques du web et du multimédia
- **Conversions de type et valeurs de formulaires HTML** :
  - Les valeurs issues d'un formulaire (`<input>`) sont toujours reçues sous forme de chaînes de caractères (`"42"`).
  - `Number("")` renvoie `0`, tandis que `Number("abc")` renvoie `NaN`.
  - *Piège absolu sur `NaN`* : `NaN === NaN` renvoie **`false`** ! Pour tester si une valeur n'est pas un nombre, on utilise exclusivement `Number.isNaN(val)`.
- **Valeurs « Truthy » et « Falsy »** :
  - Dans un test conditionnel `if (valeur)`, 6 valeurs sont falsy en JS : `false`, `0`, `""`, `null`, `undefined`, et `NaN`.
  - *Piège des collections vides* : les tableaux vides `[]` et les objets vides `{}` sont considérés comme **truthy** en JavaScript (`if ([])` s'exécute !). Pour tester si un tableau est vide, tester `tab.length === 0`.
- **Le piège universel des flottants (IEEE 754)** :
  - En calcul binaire flottant, `0.1 + 0.2 === 0.3` renvoie `false` (`0.30000000000000004`).
  - Deux approches distinctes selon le besoin :
    - *Calculs monétaires (paniers e-commerce, TVA)* : calculer en centimes entiers (`10 + 20 === 30`) ou arrondir avec `Math.round()`.
    - *Comparaisons scientifiques / physiques* : tester avec une tolérance infinitésimale via `Math.abs(a - b) < Number.EPSILON`.
- **La boucle à rebours (Reverse Loop) pour la suppression en place** :
  - Lors de la suppression d'éléments dans un tableau dynamique avec `splice()` (ex. projectile touchant un ennemi dans Canvas 2D), un parcours croissant classique saute systématiquement l'élément suivant à cause du décalage d'indices.
  - La boucle décrémentale (`for (let i = tab.length - 1; i >= 0; i--)`) résout ce problème sans décalage fantôme.
- **Interdiction de muter une collection pendant `forEach` ou `for...of`** :
  - Modifier la taille d'un tableau en cours de parcours fonctionnel provoque des sauts d'itérations imprévisibles ; préférer une boucle indexée à rebours ou la méthode non-destructive `.filter()`.
- **Mathématiques multimédia : Trigonométrie et Aléatoire** :
  - Les fonctions trigonométriques `Math.sin()` et `Math.cos()` attendent des angles en radians et non en degrés (`radians = degres * (Math.PI / 180)`).
  - Génération d'un entier aléatoire compris entre 0 et `n - 1` : `Math.floor(Math.random() * n)`.
- **Delta-temps et fluidité d'animation (`requestAnimationFrame`)** :
  - Dans une boucle de jeu ou d'animation, la vitesse d'une entité ne doit pas dépendre du taux de rafraîchissement (60 Hz vs 144 Hz) mais du temps réel écoulé : `x += vitesse * deltaTemps`.
- **Comportement sur la division par zéro (JS vs PHP)** :
  - En JavaScript : `1 / 0` renvoie `Infinity` sans bloquer le programme.
  - En PHP 8+ : `1 / 0` lève une exception fatale `DivisionByZeroError` qui interrompt le script si elle n'est pas interceptée.

#### 3.8. Sensibilité à la complexité et cas limites
- **Complexité intuitive** :
  - Parcours linéaire $O(n)$ : le temps d'exécution croît proportionnellement à la taille des données.
  - Double parcours quadratique $O(n^2)$ : tester chaque élément contre tous les autres (ex. détection de collision brute entre toutes les entités).
  - *Distinction sur les grilles 2D* : une double boucle parcourant une grille de $L$ colonnes par $H$ lignes réalise $L \times H$ opérations, ce qui est une complexité linéaire $O(N)$ par rapport au nombre total de tuiles $N$. Elle n'est en $O(n^2)$ que si $n$ représente la longueur du côté d'une grille carrée.
- **Le piège du décalage d'un (« Off-by-one »)** :
  - Confondre `<` et `<=` lors de l'accès à un tableau de longueur $N$ (le dernier élément valide est à l'indice $N - 1$).
- **Immutabilité profonde** :
  - `[...tab]` ne réalise qu'une copie superficielle (Shallow Copy). Pour cloner des structures contenant des objets imbriqués sans effets de bord résiduels, utiliser `structuredClone(tab)`.

---
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

## 7. PHP & Architecture Back-End

Le module PHP couvre le développement côté serveur et le cycle de requêtes HTTP (R2.13). Il assure la transition directe depuis la POO JavaScript vers l'architecture Back-End, la manipulation des bases de données relationnelles et la conception d'API JSON. 

Il est calibré pour le volume horaire du BUT MMI (~30 à 40 heures encadrées) en **20 séances de travaux pratiques complètes**, regroupées en 7 sous-modules à l'ordre chronologique rigoureux :

### 7.1. Fondamentaux, Typage strict & Templating serveur (R2.13)
- **Typage strict dès le jour 1** : instruction `declare(strict_types=1);` placée en toute première ligne pour bannir le transtypage implicite et dangereux de PHP.
- **Balises et syntaxe moderne** : balises `<?php`, affichage avec `echo`, terminaison par point-virgule `;`.
- **Variables et types primitifs** : préfixe `$`, typage explicite (string, int, float, bool).
- **Opérateurs et conditions** : concaténation avec le point `.`, conditions `if`, `else`, `elseif`, opérateur ternaire, null-safe `?->` et null-coalescing `??`.
- **Boucles et tableaux associatifs** : boucles `for`, `while`, parcours avec `foreach ($items as $key => $val)`, fonctions natives de tableaux.
- **Fonctions personnalisées et dates** :
  - Déclaration avec typage strict des paramètres et du retour (`function nom(int $id): string`).
  - Fuseau horaire par défaut : `date_default_timezone_set('Europe/Paris');`.
  - Manipulation de l'objet natif immuable `DateTimeImmutable` et formatage SQL (`->format('Y-m-d H:i:s')`).
- **Templating serveur modulaire** : découpage d'une page HTML en composants avec `require_once` (`header.php`, `navbar.php`, `footer.php`).

### 7.2. Sessions, Cookies & Authentification sécurisée (R2.13)
*Chronologie : les sessions sont apprises ici afin d'être immédiatement disponibles pour le CSRF au module suivant.*
- **Cookies HTTP** : fonctionnement des en-têtes `Set-Cookie`, création avec `setcookie()`, lecture avec `$_COOKIE`, drapeaux de sécurité obligatoires (`httponly`, `secure`, `samesite`).
- **Mécanisme des sessions** : initialisation avec `session_start()`, stockage d'état côté serveur dans la superglobale `$_SESSION`, fermeture propre avec `session_destroy()`.
- **Prévention de la fixation de session** : appel impératif de `session_regenerate_id(true);` immédiatement après la validation des identifiants de connexion pour détruire l'identifiant de pré-session.
- **Sécurité des mots de passe** : hachage irréversible avec `password_hash($mdp, PASSWORD_DEFAULT)` et vérification avec `password_verify()`.
- **Contrôle d'accès et espace membre** : redirection sécurisée avec `header('Location: login.php'); exit;` si l'utilisateur n'est pas authentifié.

### 7.3. Formulaires sécurisés, Uploads & Pattern PRG (R2.13)
- **Cycle HTTP** : requêtes GET (lecture/recherche) vs requêtes POST (mutation de données).
- **Superglobales et validation** : lecture de `$_GET` et `$_POST`, nettoyage avec `trim()`, validation des formats avec `filter_var()` (email, entiers, URL).
- **Sécurité XSS contextuelle** :
  - Neutralisation systématique à l'affichage texte avec `htmlspecialchars($valeur, ENT_QUOTES, 'UTF-8')`.
  - Assainissement des liens : interdiction des fausses URLs injectant du JavaScript (`javascript:alert(1)`) en exigeant une validation stricte du protocole HTTP/HTTPS via `filter_var($url, FILTER_VALIDATE_URL)`.
- **Le pattern PRG (Post-Redirect-Get)** :
  - Redirection après validation (`header('Location: ...'); exit;`) et transmission des alertes de succès/erreur via un message flash temporaire en session (`$_SESSION['flash']`, consommé puis supprimé avec `unset()` à l'affichage).
  - Règle didactique : élimine définitivement le renvoi accidentel du formulaire et la duplication des données lors d'un rafraîchissement (touche F5).
- **Protection contre le CSRF (Cross-Site Request Forgery)** :
  - Génération d'un token aléatoire stocké en session : `$_SESSION['csrf_token'] = bin2hex(random_bytes(32));`.
  - Champ masqué `<input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">`.
  - Contrôle strict avec `hash_equals()` avant d'exécuter l'action en POST.
- **Upload sécurisé de fichiers (`$_FILES`)** :
  - Attribut de formulaire `enctype="multipart/form-data"`.
  - Vérification de l'état d'upload via `$_FILES['image']['error'] === UPLOAD_ERR_OK` et contrôle de la taille maximale.
  - Contrôle du type MIME réel via `mime_content_type()` (interdiction de se fier à l'extension).
  - Renommage aléatoire unique (`uniqid() . bin2hex(random_bytes(8)) . '.jpg'`) et déplacement avec `move_uploaded_file()`.
  - Sécurisation du stockage : neutralisation de l'exécution de scripts soit par placement du dossier hors de la racine web (`../uploads/`), soit via `.htaccess` (`php_flag engine off`) sous Apache.

### 7.4. Programmation Orientée Objet (POO) & Autoloading (R2.13, R3.12)
*Transition directe depuis la POO JavaScript (séance 27) pour structurer le code avant d'aborder la persistance.*
- **Classes et objets en PHP 8** : déclaration `class`, typage strict des propriétés, instanciation avec `new`.
- **Constructeur moderne** : promotion de propriétés dans `__construct(public string $nom, private int $prix)` pour un code concis.
- **Encapsulation et visibilité** : portée `public`, `private` et `protected`, accesseurs (getters) et mutateurs (setters).
- **Héritage** : mot-clé `extends`, surcharge de méthodes et appel du parent avec `parent::__construct()`.
- **Autoloading sans bundler** : configuration de `spl_autoload_register()` pour charger automatiquement les classes à la volée, éliminant définitivement les erreurs de `require_once` manqués ou dupliqués.

### 7.5. Base de données avec PDO, Relations SQL & Transactions (R2.13, R2.14)
- **Sécurisation des identifiants sans Composer** :
  - En PHP natif sans `vlucas/phpdotenv`, les fichiers `.env` ne sont pas lus automatiquement.
  - Méthode enseignée : un fichier `config.local.php` retournant un tableau (`return ['db_pass' => '...'];`), exclu du dépôt par `.gitignore`, accompagné d'un gabarit versionné `config.example.php`.
- **Connexion PDO sécurisée** : instanciation de l'objet `PDO` obligatoirement enrobée dans un `try ... catch (PDOException $e)` pour empêcher l'affichage de la pile d'appels et des mots de passe en clair en cas d'erreur de connexion.
- **Protection absolue contre les injections SQL** : interdiction totale de concaténer des variables dans le SQL. Utilisation systématique des requêtes préparées avec `prepare()` et `execute([$param])` ou `bindParam()`.
- **Pagination SQL et piège du typage PDO** :
  - Décompte du nombre total d'enregistrements via `SELECT COUNT(*) FROM table` pour calculer le nombre total de pages.
  - Calcul dynamique de `LIMIT :limit OFFSET :offset` à partir de l'URL (`?page=2`).
  - *Piège technique corrigé* : passer `:limit` dans un tableau `execute([':limit' => $limit])` injecte une chaîne (`LIMIT '10'`) provoquant une erreur de syntaxe MySQL. Obligation d'utiliser `$stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);` et `$stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);`.
- **Relations SQL et requêtes jointes (anti-piège du N+1)** :
  - Clés étrangères (`FOREIGN KEY`).
  - Utilisation systématique des jointures `INNER JOIN` et `LEFT JOIN` pour récupérer les entités reliées (ex: un article et les données de son auteur) en une seule requête SQL, bannissant l'anti-pattern de la boucle `foreach` contenant une requête SQL par ligne.
- **Transactions PDO et intégrité relationnelle** :
  - Sécurisation des opérations multi-tables via `$pdo->beginTransaction()`, `$pdo->commit()` et `$pdo->rollBack()` dans un bloc `try / catch`. En cas d'erreur sur l'une des requêtes, la base annule toutes les modifications.
- **Opérations CRUD complètes** : insertion, sélection avec jointure et pagination, modification et suppression contrôlée.

### 7.6. Architecture MVC & Routage (R2.13, SAÉ)
- **Séparation des responsabilités (MVC)** :
  - **Modèle** : classes métiers et repositories instanciant PDO pour interroger la base de données.
  - **Vue** : templates HTML/PHP purs avec variables injectées, sans requêtes SQL ni logique métier.
  - **Contrôleur** : réception de la requête, interrogation du modèle, sélection et transmission des données à la vue.
- **Routage et fallback 404** :
  - Point d'entrée unique `index.php` avec aiguillage par action ou route.
  - *Gestion obligatoire du 404* : si l'action ou la page demandée n'existe pas, envoi impératif de `http_response_code(404);` et affichage d'une vue 404 dédiée pour éviter les erreurs non gérées.

### 7.7. API Back-End JSON & Communication avec le Front-End (R2.13, R3.12)
- **En-têtes de réponse HTTP** : déclaration de `header('Content-Type: application/json; charset=utf-8');`.
- **Sérialisation JSON** : transformation de structures PHP en JSON avec `json_encode()`.
- **Le piège de la réception JSON (`php://input`)** :
  - Lorsque le client JavaScript envoie un payload JSON via `fetch('/api', { method: 'POST', body: JSON.stringify(data) })`, la superglobale `$_POST` est totalement vide.
  - En PHP natif, il faut impérativement lire le flux d'entrée brut : `$json = file_get_contents('php://input');` puis décoder avec `$data = json_decode($json, true);`.
- **Codes de statut HTTP réels** : utilisation impérative de `http_response_code(400)` (Bad Request), `401` (Unauthorized) ou `404` (Not Found) afin que la propriété `response.ok` du `fetch()` JS détecte immédiatement les erreurs sans passer par un statut 200 trompeur.
- **Gestion complète du CORS et des requêtes Preflight OPTIONS** :
  - Lorsque JS envoie un `POST` avec l'en-tête `Content-Type: application/json`, le navigateur émet d'abord une requête HTTP `OPTIONS`.
  - Gestion obligatoire en début de script :
    ```php
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type');
        http_response_code(200);
        exit;
    }
    header('Access-Control-Allow-Origin: *');
    ```

### 7.8. Points de vigilance pour l'animation en classe PHP

Quatre points critiques doivent être anticipés lors des séances PHP :

1. **La sécurité réflexe dès le premier jour** :
   - *Strict types* : exiger `declare(strict_types=1);` dès le début.
   - *XSS* : neutraliser immédiatement toute écriture brute avec `htmlspecialchars()`, et valider les protocoles d'URL contre les failles `javascript:`.
   - *Injections SQL* : imposer les requêtes préparées `prepare()` dès la première démonstration.
   - *CSRF et PRG* : exiger le token CSRF et la redirection Post-Redirect-Get sur toute mutation de données.
   - *Credentials PDO* : enrober la connexion dans un `try / catch` et vérifier le `.gitignore`.
   - *Dossier d'upload* : interdire l'exécution PHP dans les répertoires d'upload via `.htaccess`.

2. **L'obligation du protocole HTTP local** :
   - Rappeler qu'un fichier PHP ne s'ouvre jamais via le protocole `file:///`. Un serveur HTTP local (Laragon, serveur interne `php -S`, Docker ou le bac à sable php-wasm de la plateforme) doit être démarré.

3. **Le piège SQL de la pagination PDO** :
   - Rappeler que `LIMIT` et `OFFSET` exigent `$stmt->bindValue(..., PDO::PARAM_INT)` sous peine d'erreur de syntaxe SQL avec MySQL.

4. **Le piège CORS Preflight et réception JSON (`php://input`) lors des TP couplés JS/PHP** :
   - Vérifier la gestion de la méthode `OPTIONS` et la lecture de `php://input` dès que les étudiants font communiquer leur front JS et leur back PHP.

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
