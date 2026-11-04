---
type: cours
titre: Les conflits
notions: [merge, conflit, add, commit, merge --abort]
---

## Cours

### Quand un conflit arrive
Tu fusionnes une branche dans une autre avec `git merge`. Git combine les changements automatiquement, tant qu'ils ne touchent pas les **mêmes lignes** d'un même fichier.

Si deux branches ont modifié la même ligne, Git ne sait pas quelle version garder. Il s'arrête et te demande de décider : c'est un **conflit**.

Exemple : sur `main`, le titre est `Accueil`. Sur `menu`, le même titre a été changé en `Menu`. Fusionner `menu` dans `main` crée un conflit.

### Ce que Git écrit dans le fichier
Git ne choisit pas à ta place. Il écrit les deux versions dans le fichier, entre des marqueurs :

```
<<<<<<< HEAD
Accueil
=======
Menu
>>>>>>> menu
```

- Entre `<<<<<<< HEAD` et `=======` : ta version, celle de la branche où tu te trouves.
- Entre `=======` et `>>>>>>> menu` : la version de l'autre branche.

Les marqueurs ne sont pas du contenu : ils doivent disparaître.

### Comment résoudre
1. Ouvre le fichier et décide ce qui doit rester : une des deux versions, ou un mélange des deux.
2. Supprime les trois marqueurs (`<<<<<<<`, `=======`, `>>>>>>>`).
3. Prépare le fichier avec `git add`, puis termine la fusion avec `git commit`. Git prépare un message de fusion, tu peux le garder.

Tant que le fichier est en conflit et qu'il n'est pas préparé avec `add`, Git refuse de terminer la fusion.

### Annuler une fusion
Si tu veux revenir à l'état d'avant la fusion, `git merge --abort` annule tout. Ton travail d'avant la fusion est conservé.

### Ce qui n'est pas un conflit
- Deux branches qui modifient des **lignes différentes** du même fichier : Git fusionne sans rien demander.
- Deux branches qui modifient des **fichiers différents** : pas de conflit.

### Erreurs fréquentes
- Laisser les marqueurs dans le fichier : le fichier ne fonctionne plus.
- Oublier `git add` après avoir corrigé le fichier.
- Choisir une version sans regarder ce qu'elle change.

Dans le module, la fusion est simulée : tu vois le fichier avec ses marqueurs, et tu résous le conflit avec les mêmes commandes qu'en réel.
