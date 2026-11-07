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

Un prototype isolé a été réalisé dans `src/logique-test.html` pour tester la faisabilité d'une exécution pas à pas dans le navigateur (sur un code très court avec une variable et une boucle `for`).

### Ce qui fonctionne
- L'utilisation des fonctions génératrices (`function*` et `yield`) permet de dérouler l'exécution ligne par ligne sans bloquer l'interface.
- L'affichage montre clairement les différentes phases d'une boucle : initialisation, évaluation de condition, exécution du corps, et incrémentation.
- La surbrillance visuelle des variables lors de leur modification donne un retour immédiat.

### Ce qui est trop difficile pour du code élève libre
- **Transformation automatique de l'AST** : instrumenter du code libre tapé par l'élève pour insérer des points d'arrêt à chaque expression ou sous-condition nécessite un transformateur lourd (Babel) ou un interpréteur JS en JS (type `JS-Interpreter`).
- **Gestion des boucles infinies** : si un élève commet une erreur d'incrémentation, l'interpréteur ou le générateur boucle indéfiniment.
- **Portée et pile d'appels** : gérer les fonctions imbriquées, les arguments, la portée lexicale et les retours demande un moteur de débogage complet.
- **Asynchronisme et DOM** : le pas à pas est incompatible de façon prévisible avec des gestionnaires d'événements (`addEventListener`) ou des promesses.

### Décision et recommandation
1. **Ne pas embarquer de moteur pas à pas complexe pour les exercices classiques** : le visualiseur actuel (`src/visualiseur-variables.js`), basé sur Acorn et affichant l'état final des variables globales, est robuste, léger et suffisant pour les débutants.
2. **Usage réservé aux démonstrations guidées** : le pas à pas peut être utilisé ponctuellement sous forme d'animations pré-enregistrées ou de cours interactifs, mais pas sur du code élève libre.
