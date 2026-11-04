# Apprendre Git visuellement

Git est difficile parce que son fonctionnement est invisible : l'historique, les branches et les fusions n'existent que dans le terminal, sous forme de texte. Ce document propose un module où l'élève **voit** le graphe des commits bouger à chaque commande, sans installer Git et sans risque pour son dépôt.

Il développe la partie « Git » de [visualisation-logique.md](visualisation-logique.md) et la place proposée dans [programme-par-langage.md](programme-par-langage.md). Référentiel : R4, « gestion de versions » (voir [referentiel-mmi.md](referentiel-mmi.md)).

Ce document est une proposition, à valider. Rien n'est développé.

## Principes

- **Le graphe est le personnage principal.** Chaque commit est un nœud, relié à son parent. Les branches sont des étiquettes qui pointent vers un commit. `HEAD` indique où l'on se trouve.
- **Pas de vrai dépôt.** Les commandes agissent sur un modèle simulé en JavaScript. L'élève ne peut rien casser, et on peut recommencer à tout moment.
- **Pas de test « au hasard ».** Chaque exo a un **graphe cible**. L'élève réussit quand son graphe a la même forme que la cible. Les identifiants de commit (`a3f2c1`) ne comptent pas : on compare les messages, les liens et les étiquettes.
- **Une commande = une conséquence visible.** Après `git commit`, un nouveau nœud apparaît et l'étiquette de la branche avance. Rien d'autre n'est caché.
- **Le lien avec le vrai Git est montré.** Chaque commande simulée affiche la commande réelle (« équivalent : `git switch -c feature/menu` ») pour que l'élève fasse le passage au terminal.
- **Les erreurs parlent comme Git.** Une erreur est expliquée dans un message clair, par exemple « Tu as des modifications non enregistrées : enregistre-les avec `add` et `commit` avant de changer de branche ».

## L'interface

Le module tient dans un seul panneau, avec trois zones :

1. **Le graphe** (à gauche) : les commits, les branches, `HEAD`. Le commit courant est entouré. Un commit fusionné a deux liens entrants.
2. **Les zones de travail** (en bas) : répertoire de travail, zone de préparation (`add`), dépôt (`commit`). Chaque commande déplace les fichiers d'une zone à l'autre, comme dans [visualisation-logique.md](visualisation-logique.md).
3. **La commande** (à droite) : un champ de saisie avec quelques commandes reconnues, et la liste des commandes déjà tapées.

La consigne de l'exo reste visible en haut, avec le graphe cible affiché à côté du graphe de l'élève pour comparer.

## Commandes simulées, par niveau

Le module n'implémente que les commandes nécessaires à chaque niveau. Une commande hors niveau affiche un message clair (« pas encore au programme ») au lieu d'une erreur de syntaxe.

| Niveau | Thème | Commandes |
|---|---|---|
| 1 | Premier commit | `status`, `add`, `commit`, `log` |
| 2 | Branches | `branch`, `switch`, `switch -c` (ou `checkout -b`) |
| 3 | Fusion | `merge` (avance rapide, puis fusion à trois) |
| 4 | Conflit | `merge` avec conflit, résolution, `add`, `commit` |
| 5 | Revenir en arrière | `restore`, `reset` (doux, mixte), `revert` |
| 6 | Dépôt distant | `remote`, `push`, `fetch`, `pull` (avec un second graphe « origin ») |
| 7 | Travail à plusieurs | `push -u`, pull request simulée, relecture, fusion |

Les niveaux 5 et 6 peuvent être découpés plus tard. Le `rebase` n'est pas dans ce module : il arrive après les notions de base, en complément.

## Exemple d'exo : niveau 2

```markdown
---
type: classique
titre: Une branche pour tester
annee: 1
ptp: non
notions: [branch, switch]
panneaux: [enonce, depot]
---

## Cours
Une branche est une étiquette qui pointe vers un commit. Quand tu fais un commit, l'étiquette de la branche courante avance.

## Énoncé
Crée une branche `menu` à partir du commit courant, et place-toi dessus. Fais ensuite un commit sur `menu`.

## Départ
```
main: A ← B   (HEAD → main)
```

## Cible
```
main: A ← B
menu:       ← C   (HEAD → menu)
```

## Indice
La commande `switch -c menu` crée la branche et change de branche en une fois.
```

Le graphe cible est lu par le moteur, pas par l'élève. Une fois l'exo réussi, le moteur compare la forme du graphe : deux commits, une branche `menu` sur le second, `HEAD` sur `menu`.

## Format des exos

- **Un fichier Markdown par exo**, rangé dans `exos/git/visuel/NN.md`. Le dossier `git` n'est pas un langage : il regroupe les exos Git.
- **Sections** : `## Cours`, `## Énoncé`, `## Départ`, `## Cible`, `## Indice`, puis `## Solution` (suite de commandes, jamais envoyée à l'élève).
- **Pas de section `## Tests` en JavaScript.** La vérification vient de la comparaison de graphes. Un exo reste donc lisible sans savoir coder.
- **Solution obligatoire** : la suite de commandes doit mener du départ à la cible, sinon l'exo est refusé à l'import (voir [ecrire-un-exo.md](ecrire-un-exo.md)).
- **Exception à la règle « pas de `## Départ` »** de [ecrire-un-exo.md](ecrire-un-exo.md) : ici, le départ est un graphe, pas un éditeur vide. Cette règle devra être précisée si ce module est retenu.

## Limites assumées

- Une simulation ne couvre que quelques commandes et options. L'élève passera ensuite au vrai terminal, où les messages et les options sont plus riches.
- Les identifiants de commit sont fictifs. On ne travaille pas sur les hashs.
- Le module ne remplace pas la pratique réelle : il prépare le passage au terminal (voir [feuille-de-route.md](feuille-de-route.md), faux terminal Bash, à venir).

## Plan de travail proposé

1. **Moteur de graphe** (JavaScript, sans interface) : commits, branches, `HEAD`, commandes du niveau 1 et 2, comparaison avec une cible. Tests unitaires simples, en dehors du navigateur.
2. **Panneau visuel** : affichage du graphe, des zones de travail et de la saisie, en SVG.
3. **Deux exos** : niveau 1 (premier commit) et niveau 2 (branche). Vérifier avec des élèves de la promo.
4. **Niveaux 3 à 5**, puis **6 et 7** selon les retours.

## Points à trancher

1. **Simulation ou vrai Git** : je recommande la simulation (voir [visualisation-logique.md](visualisation-logique.md)). À confirmer.
2. **Un panneau ou une page** : intégré au panneau d'exo de la plateforme, ou page séparée ? Le panneau est plus cohérent, la page est plus simple à tester.
3. **Comparaison de graphes** : on ignore les hashs. Faut-il aussi ignorer l'ordre des branches, ou le considérer comme une erreur ?
4. **Niveaux 6 et 7** : un second graphe « origin » suffit-il, ou faut-il simuler un vrai dépôt distant avec plusieurs utilisateurs ?
