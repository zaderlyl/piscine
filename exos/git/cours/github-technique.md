---
type: cours
titre: Git et GitHub, comment ça marche
notions: [git, github, commit, branche, merge, dépôt, push, pull, pull request]
---

## Cours

### À quoi ça sert
Quand tu travailles sur un projet, tu veux pouvoir **revenir en arrière** si tu casses quelque chose, et **travailler à plusieurs** sans écraser le travail des autres. C'est le rôle de **Git** : un outil qui garde l'historique de ton projet.

**GitHub** est un site qui héberge cet historique sur Internet. Git est l'outil, GitHub est l'endroit où on le partage. Les deux ne sont pas la même chose.

### Un commit
Un **commit** est une photo du projet à un instant, avec un **message** qui dit ce qui a changé. L'historique d'un projet est une suite de commits : tu peux relire chaque étape, ou revenir à n'importe laquelle.

Un bon message dit ce qui change, par exemple « Ajoute le titre de la page », jamais « modifs ».

### Une branche
Une **branche** est une ligne de commits parallèle. Le projet a une branche principale, `main`, qui doit toujours fonctionner. Pour tester une idée sans risque, tu crées une branche : tes commits s'y accumulent sans toucher à `main`.

Quand le travail est fini, un **merge** (une fusion) ramène la branche dans `main`.

![Une ligne main avec trois commits, une branche feature/menu qui en part avec deux commits, puis un merge qui les rassemble](../assets/git-commits-et-branches.svg)

### Le dépôt, chez toi et sur GitHub
Un **dépôt** est un projet suivi par Git, avec tout son historique. Il existe en deux exemplaires :
- le **dépôt local**, sur ton ordinateur, où tu travailles ;
- le **dépôt distant**, sur GitHub, que toute l'équipe partage.

Chez toi, un fichier passe par trois endroits avant d'être enregistré : ton **dossier de travail** (où tu modifies les fichiers), la **zone d'index** (où tu choisis ce qui entre dans le prochain commit) et le **dépôt local** (où le commit est enregistré).

### Les commandes : d'où vers où
Chaque commande déplace ton travail d'un endroit à un autre. Suis les flèches.

![Les quatre zones, dossier de travail, zone d'index, dépôt local et dépôt GitHub, reliées par les commandes clone, add, commit, push, fetch, pull, checkout et merge](../assets/git-zones-et-commandes.svg)

- `git add` prépare les fichiers que tu veux enregistrer.
- `git commit` enregistre une version dans ton dépôt local. Rien n'est encore sur GitHub.
- `git push` envoie tes commits sur GitHub.
- `git fetch` récupère les nouveautés de GitHub, **sans toucher à tes fichiers**.
- `git pull` fait `fetch` puis `merge` : il récupère et met à jour tes fichiers.
- `git checkout` (ou `git switch`) change de branche.
- `git clone` copie un dépôt GitHub chez toi, une seule fois, au départ.

### La pull request
Sur un projet d'équipe, on ne modifie pas `main` directement. On passe par une **pull request** : une demande pour fusionner sa branche dans `main`. Les autres lisent tes changements, commentent, puis valident. Rien n'arrive dans `main` sans relecture.

![Le trajet d'une fonctionnalité en huit étapes : créer une branche, travailler, push, ouvrir la pull request, relecture, merge, pull de main, main à jour](../assets/git-trajet-pull-request.svg)

1. Tu crées une branche et tu y travailles, avec des commits.
2. Tu l'envoies sur GitHub avec `git push`.
3. Tu ouvres une pull request sur GitHub.
4. Un collègue relit et valide, puis la pull request est mergée : `main` reçoit ta branche.
5. Chez toi, tu reviens sur `main` et tu fais `git pull` pour avoir la version à jour.

### Erreurs fréquentes
- Croire que `git commit` envoie le travail sur GitHub : il faut aussi `git push`.
- Oublier `git add` : le fichier modifié n'entre pas dans le commit.
- Travailler directement sur `main` au lieu de créer une branche.
- Oublier de faire `git pull` avant de commencer : tu travailles alors sur une version périmée.
- Écrire des messages de commit vagues comme « modifs ».

La suite montre ces gestes dans VS Code, pas à pas.
