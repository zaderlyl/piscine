# Visualisation de la logique algorithmique (R1.12)

Ce document cadre l'approche de visualisation de l'état interne des programmes (variables, flux d'exécution, pile d'appels, table de trace) et de l'historique Git dans la Piscine MMI.

Le principe directeur : **rendre visible ce qui est invisible** dans le code ou le terminal, sans jamais donner la réponse à la place de l'étudiant.

---

## 1. Deux outils complémentaires pour deux besoins distincts

L'expérience montre qu'une exécution pas à pas arbitraire de code libre tapé par un débutant pose des défis majeurs dans le navigateur (interpréteur AST lourd, détection des boucles infinies, gestion de la portée et de la pile d'appels). La Piscine adopte donc une architecture à deux niveaux :

| Outil | Rôle pédagogique | Moteur technique | Portée |
| :--- | :--- | :--- | :--- |
| **Visualiseur d'exercices** (`src/visualiseur-variables.js`) | Valider le code libre tapé par l'élève dans les exercices d'entraînement | Analyse statique et parsing AST via **Acorn** | JavaScript (variables globales en fin d'exécution) |
| **Démonstrateur pas à pas bilingue** (`src/logique-test.html`) | Comprendre les mécanismes fondamentaux en cours et préparer les évaluations R1.12 | Générateurs synchronisés (`function*`), SVG normalisé ISO 5807 et table de trace | Bilingue **JavaScript** et **PHP 8+** sur 8 scénarios types |

---

## 2. Le démonstrateur pas à pas bilingue (`src/logique-test.html`)

Développé dans le cadre de l'Issue #41, cet outil illustre pas à pas les concepts algorithmiques de la Section 3 du programme.

### 2.1. Bilinguisme JavaScript & PHP 8+
L'algorithmique pose des schémas de pensée universels indépendants de la syntaxe. Un sélecteur en tête d'interface permet de basculer instantanément entre :
- **JavaScript** : `let`, `console.log()`, égalité stricte `===`, typage dynamique (`number`, `string`, `boolean`, `null`, `undefined`).
- **PHP 8+** : variables préfixées par `$`, `echo`, typage strict des fonctions (`function doubler(int $n): int`), types `int`, `float`, `string`, `bool`, `null` (sans pseudo-concept `undefined`).

Le passage d'un langage à l'autre conserve le numéro d'étape et l'état d'exécution en cours pour faciliter la comparaison syntaxique directe.

### 2.2. Organigrammes normalisés (ISO 5807)
Les formes géométriques respectent rigoureusement le standard international :
- **Rectangles arrondis (ovales)** : Début et Fin du programme.
- **Parallélogrammes** : Entrées et Sorties de données (`console.log`, `echo`).
- **Losanges** : Conditions et embranchements décisionnels (branches Vrai / Faux).
- **Rectangles simples** : Processus de calcul et affectations de variables.
- **Rectangles à double barre latérale** : Sous-programmes et appels de fonctions prédéfinies.
- **Lignes orientées et bouclages** : Flux séquentiel et itérations.

*Ergonomie :* un bouton « Masquer / Afficher l'organigramme » permet de replier le schéma pour focaliser l'attention de l'élève sur le code, les variables et la table de trace.

### 2.3. Table de trace manuelle (Format examen R1.12)
La table de trace reprend exactement la disposition exigée lors des partiels écrits :
- Une colonne pour le numéro d'étape.
- Une colonne pour la ligne de code source correspondante.
- Une colonne pour le symbole ou nœud ISO 5807 actif.
- Une colonne pour l'évaluation booléenne de la condition (ex. `0 < 3 (Vrai)` ou `12 === 45 (Faux)`).
- **Une colonne dédiée pour chaque variable** du programme, avec surbrillance de la cellule lors d'une modification et tiret d'inaccessibilité (`—`) lorsque la variable est hors de portée.
- Une colonne pour la sortie console ou écran.
- Une colonne pour l'explication didactique de l'action.

### 2.4. Pile d'appels et destruction de portée locale
Dans le scénario de fonction (`doubler`), l'inspecteur de mémoire matérialise distinctement :
1. **La portée globale** (variables `x` et `y`).
2. **Le cadre local empilé sur la pile d'appels** (paramètre `n` et variable locale `res`).
3. **La destruction du cadre local** dès l'instruction `return` : les variables `n` et `res` disparaissent immédiatement de la mémoire active, illustrant concrètement l'impossibilité d'y accéder après l'appel.

### 2.5. Visualisation des collections et tableaux
Dans le scénario de recherche séquentielle, le tableau source est représenté graphiquement sous forme de cellules numérotées par leurs indices (`[0]`, `[1]`, `[2]`). L'indice actif `i` se déplace visuellement de case en case, et l'élément correspondant passe en vert dès qu'il est trouvé.

### 2.6. Contrôles d'exécution
- **Ligne suivante &rarr;** : avance pas à pas.
- **&larr; Pas précédent** : permet de rembobiner l'exécution d'une étape pour réexaminer une transition.
- **Lecture auto / Pause** : animation automatique continue.
- **Curseur de vitesse** : réglage dynamique entre 200 ms et 2000 ms (défaut : 800 ms).
- **Réinitialiser** : remet le programme et la mémoire à l'état initial.

---

## 3. Les 8 scénarios didactiques intégrés

1. **Boucle `for`** : compteur, condition d'arrêt et incrémentation pas à pas.
2. **Boucle `while` (Règle des 3 phases)** : initialisation, condition et mise à jour impérative du pas avant l'accolade fermante (protection anti-boucle infinie).
3. **Condition `if / else`** : comparaison stricte `===` et séparation nette des branches Vrai / Faux.
4. **Pattern 1 - Permutation (*Swap*)** : échange de deux valeurs via variable temporaire `$temp` / `temp`.
5. **Pattern 2 - Accumulation & élément neutre** : somme cumulative initialisée à `0`.
6. **Pattern 5 - Recherche séquentielle (Flag & Break)** : parcours de collection, détection avec drapeau booléen, interruption par `break`, et interdiction formelle du `return` dans le `else`.
7. **Conjecture de Syracuse (Collatz)** : arithmétique dynamique et test de parité via le modulo `%` (`n % 2 === 0` / `$n % 2 === 0`).
8. **Sous-programme / Fonction** : passage de paramètre, exécution locale et `return` avec dépilement mémoire.

---

## 4. Visualisation de Git (Volet futur)

L'historique Git et la gestion de branches feront l'objet d'un module visuel séparé pour le terminal simulé (ressources R4.DWeb-DI.08) :
- Graphe des commits avec étiquettes `HEAD` et pointeurs de branches.
- Matérialisation des trois zones : Répertoire de travail, Index (`add`) et Dépôt (`commit`).
- Arborescence visuelle des fusions à trois sources et conflits de fusion.
