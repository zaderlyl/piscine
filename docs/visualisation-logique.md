# Visualisation de la logique algorithmique

Idée : pendant que l'élève code, un panneau visuel montre l'état interne de son programme (variables, flux d'exécution) et, pour Git, l'historique du dépôt. Le panneau ne donne jamais la réponse. Il rend visible ce qui est invisible dans le code ou dans le terminal. L'élève garde la main.

Ce document est une idée, pas un engagement. Rien n'est développé.

## Programmation (JS, puis PHP et Python)

- **Variables** : une boîte avec son nom et sa valeur. Non utilisée, elle reste grise et « non connectée ». Une lecture trace un fil vers l'endroit où elle sert. Une affectation change la valeur avec une courte animation.
- **Conditions (`if`)** : un aiguillage. La valeur passe dans la branche qui s'applique, l'autre reste éteinte.
- **Boucles** : un compteur visible qui monte à chaque tour, et le bloc répété qui s'allume. Pour `while`, la condition est réévaluée avant chaque tour.
- **Fonctions** : une machine avec des entrées (paramètres) et une sortie (`return`). Chaque appel crée une boîte temporaire qui disparaît au retour. C'est le moyen le plus clair de montrer la portée des variables.
- **Tableaux et objets** : cases numérotées pour les tableaux, étiquettes pour les clés d'un objet. Un `push` ajoute une case, un accès par index la met en surbrillance.
- **Pas à pas** : un bouton « suivant » exécute une ligne à la fois. L'élève choisit le rythme.

## Git

Git est difficile parce que l'historique et les branches sont invisibles dans un terminal. Un panneau « Dépôt » pourrait montrer :

- **Graphe de commits** : chaque commit est un nœud, relié à son parent. Le commit courant (`HEAD`) est mis en évidence.
- **Branches** : des étiquettes qui pointent vers un commit. `git switch -c` crée une étiquette visible, et `git commit` fait avancer celle de la branche courante.
- **Fusion** : `git merge` dessine un nœud à deux parents. Un conflit s'affiche comme deux versions d'un même fichier côte à côte, avec la zone à résoudre.
- **Zones de travail** : trois colonnes pour le répertoire de travail, la zone de préparation (`add`) et le dépôt. Chaque commande déplace les fichiers d'une colonne à l'autre, ce qui montre la différence entre `add`, `commit` et `checkout`.
- **Terminal simulé** : l'élève tape des commandes Git dans un faux terminal (voir la feuille de route). Le graphe et les zones se mettent à jour en direct. Les commandes non supportées affichent un message clair.

## Liens entre les deux

Le même panneau peut servir aux deux sujets. Un exo JS peut être versionné : l'élève crée une branche pour tester une fonction, et voit la version précédente rester intacte dans l'historique. Ça relie la logique de code et la gestion de versions, que les élèves retiennent mieux séparées ensemble que séparées.

## Questions ouvertes

1. **Périmètre du premier prototype** : variables et conditions seulement, ou variables plus Git ? Conseil : valider d'abord la variable en JS, puis ajouter un graphe de commits minimal (commit, branche, fusion). Ce sont deux prototypes indépendants.
2. **Simulation ou vrai Git** : un Git simulé en JavaScript est simple et sûr, mais ne couvre qu'un sous-ensemble des commandes. Un vrai Git dans le navigateur (isomorphic-git) est plus fidèle, mais plus lourd. Recommandation : la simulation, pour l'apprentissage.
3. **Quelle année** : Git peut arriver dès la première année avec un graphe très simplifié, puis gagner en détail en deuxième et troisième années.

## Références

- Référentiel MMI : [referentiel-mmi.md](referentiel-mmi.md) (R1.12 pour l'algorithmique, R4.DWeb-DI.08 pour Git).


## Bilan du prototype pas à pas (Issue #41)

Un prototype interactif complet a été réalisé dans `src/logique-test.html` pour valider la faisabilité d'une exécution pas à pas dans le navigateur, synchronisée avec un organigramme normalisé ISO 5807 et une table de trace manuelle (R1.12).

### Ce qui fonctionne et a été intégré
- **8 algorithmes types interactifs** :
  1. Boucle `for` (compteur, initialisation, condition, corps, incrément, sortie).
  2. Boucle `while` (mise en application de la règle des 3 phases anti-boucle infinie).
  3. Condition `if / else` (bifurcation Vrai / Faux et égalité stricte `===`).
  4. Pattern 1 - Permutation (*Swap*) avec variable temporaire `temp` et protection contre l'écrasement.
  5. Pattern 2 - Accumulation & élément neutre (`0` pour la somme, `1` pour le produit).
  6. Pattern 5 - Recherche séquentielle (Flag & `break`, éradication du piège du `return` dans le `else`, sortie de boucle propre).
  7. Suite de Syracuse (arithmétique cyclique, modulo `%` et test de parité `n % 2 === 0`).
  8. Sous-programme / Fonction (symbole ISO 5807 à double barre latérale, passage de paramètre et `return`).
- **Synchronisation dynamique tridirectionnelle** :
  - Surlignage de la ligne de code active dans l'éditeur.
  - Activation du nœud et du connecteur orienté dans le SVG de l'organigramme.
  - Barre des variables avec affichage de la valeur courante et du type primitif (`number`, `string`, `boolean`, `null`, `undefined`).
- **Table de trace pas à pas (Norme R1.12)** :
  - Génération automatique et incrémentale de la table de trace (étape, ligne de code, identifiant du nœud ISO 5807, évaluation de condition, état mémoire des variables et action effectuée).

### Ce qui est trop difficile pour du code élève libre
- **Transformation automatique de l'AST** : instrumenter du code libre tapé par l'élève pour insérer des points d'arrêt à chaque expression ou sous-condition nécessite un transformateur lourd (Babel) ou un interpréteur JS en JS (type `JS-Interpreter`).
- **Gestion des boucles infinies** : si un élève commet une erreur d'incrémentation, l'interpréteur ou le générateur boucle indéfiniment.
- **Portée et pile d'appels** : gérer les fonctions imbriquées, les arguments, la portée lexicale et les retours demande un moteur de débogage complet.
- **Asynchronisme et DOM** : le pas à pas est incompatible de façon prévisible avec des gestionnaires d'événements (`addEventListener`) ou des promesses.

### Décision et recommandation
1. **Ne pas embarquer de moteur pas à pas complexe pour les exercices classiques** : le visualiseur actuel (`src/visualiseur-variables.js`), basé sur Acorn et affichant l'état final des variables globales, est robuste, léger et suffisant pour les débutants.
2. **Usage réservé aux démonstrations guidées** : le pas à pas et les organigrammes ISO 5807 (`src/logique-test.html`) constituent un support pédagogique pour illustrer les cours, les 7 patterns fondamentaux et la méthode de la table de trace exigée aux examens (R1.12).
