---
type: cours
titre: Git et GitHub dans VS Code, pas à pas
notions: [contrôle de code source, git init, add, commit, push, pull, VS Code]
---

## Cours

Dans le cours précédent, tu as vu ce que font les commandes. Ici, tu les retrouves dans VS Code, avec des clics au lieu de commandes à taper. Derrière chaque bouton, c'est la même commande : le but est que tu reconnaisses chaque geste le jour où tu ouvres VS Code.

Les images imitent VS Code. Les libellés peuvent changer un peu selon ta version et ta langue (par exemple « Commit » au lieu de « Valider » si VS Code est en anglais).

### Avant de commencer
- **Git doit être installé sur ton ordinateur.** VS Code ne l'apporte pas : il s'en sert. Pour vérifier, ouvre un terminal et tape `git --version`. Sans réponse, installe Git : sur Windows depuis git-scm.com, sur Mac avec `xcode-select --install`.
- **Le panneau « Contrôle de code source » est déjà dans VS Code**, pas besoin d'extension. La connexion à GitHub se fait aussi sans extension : VS Code te la propose la première fois que tu publies.
- **Une extension est utile pour les pull requests** : « GitHub Pull Requests » (publiée par GitHub). Elle permet de créer et de relire des pull requests sans quitter VS Code. Pour l'installer, ouvre le panneau Extensions (`Cmd+Maj+X` sur Mac, `Ctrl+Maj+X` sous Windows), cherche son nom et clique sur « Installer ». Elle n'est pas nécessaire pour les commits.

### 1. Initialiser le dépôt
Ouvre un dossier vide dans VS Code, puis le panneau « Contrôle de code source » (l'icône avec trois points reliés). Le dossier n'est pas encore suivi par Git : clique sur « Initialiser le dépôt ». VS Code lance `git init` à ta place.

![VS Code sur un dossier vide : le panneau Contrôle de code source propose Initialiser le dépôt](../assets/vscode-1-initialiser.svg)

### 2. Créer un fichier
Crée un fichier `index.html`. Il apparaît dans la liste « Modifications » avec la lettre **U** (Untracked) : Git le voit, mais il ne le suit pas encore.

![Le fichier index.html apparaît dans Modifications avec la lettre U](../assets/vscode-2-nouveau-fichier.svg)

### 3. Indexer : `git add`
Au survol du fichier, un **+** apparaît. Un clic dessus fait `git add` : le fichier passe dans « Modifications indexées », avec la lettre **A**. Il est prêt pour le prochain commit.

![Le fichier est dans Modifications indexées avec la lettre A](../assets/vscode-3-indexer.svg)

### 4. Faire un commit : `git commit`
Écris un message court dans le champ, par exemple « Crée la page d'accueil », puis clique sur « Valider ». VS Code lance `git commit -m "ton message"`. Le commit est enregistré, mais **seulement chez toi**.

![Un message est écrit dans le champ et le bouton Valider est mis en évidence](../assets/vscode-4-commit.svg)

### 5. Publier : `git push`
Le bouton devient « Publier la branche ». Un clic envoie ton projet sur GitHub avec `git push`. La première fois, VS Code te demande de te connecter à GitHub et te propose de créer le dépôt, en privé ou en public. Tant que le petit nuage est dans la barre du bas, la branche n'est pas encore sur GitHub.

![Le bouton Publier la branche et le nuage dans la barre du bas](../assets/vscode-5-publier.svg)

### 6. Modifier un fichier
Ajoute une ligne dans `index.html`. Le fichier repasse dans « Modifications » avec la lettre **M** (Modified), et une barre verte marque la ligne ajoutée. Tu refais les mêmes gestes qu'avant : le **+**, un message, « Valider ».

![Le fichier modifié avec la lettre M et une barre verte sur la ligne ajoutée](../assets/vscode-6-modifier.svg)

### 7. Synchroniser : `git pull` puis `git push`
Le bouton devient « Synchroniser les modifications ». Un clic lance `git pull` (tu récupères le travail des autres) puis `git push` (tu envoies le tien). En bas, `1↑` veut dire un commit à envoyer, `0↓` rien à récupérer.

![Le bouton Synchroniser les modifications et 0↓ 1↑ dans la barre du bas](../assets/vscode-7-synchroniser.svg)

### Ce que tu retiens
| Dans VS Code | La commande derrière |
|---|---|
| Initialiser le dépôt | `git init` |
| Le **+** à côté d'un fichier | `git add` |
| Écrire un message, puis Valider | `git commit -m "…"` |
| Publier la branche | `git push` |
| Synchroniser les modifications | `git pull` puis `git push` |

### Erreurs fréquentes
- Cliquer sur « Valider » sans avoir indexé le fichier avec le **+** : rien n'est enregistré, ou pas ce que tu veux.
- Croire que « Valider » envoie sur GitHub : il faut aussi publier ou synchroniser.
- Écrire un message vague comme « modifs » : dans une semaine, tu ne sauras plus ce qu'il y avait dedans.
- Oublier de synchroniser avant de commencer à travailler : tu pars d'une version périmée.
