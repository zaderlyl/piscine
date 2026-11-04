# Contribuer à Piscine

Merci de participer ! Ce fichier donne les règles pour travailler à plusieurs sans se marcher dessus.

Pour comprendre le projet, lis d'abord le [README](README.md). Pour le lancer chez toi, voir [docs/lancer-le-projet.md](docs/lancer-le-projet.md).

## Principes

- `main` doit toujours fonctionner. **Personne ne code directement dessus.**
- Une branche = une fonctionnalité (ou un exo, ou un correctif).
- Toute modification arrive dans `main` par **Pull Request (PR)**.
- Chaque PR est relue par **au moins une autre personne** avant la fusion.
- **Seul le mainteneur fusionne dans `main`** (pour l'instant : Lilian).

## Le cycle d'une contribution

1. Choisis une tâche (une issue GitHub, ou demande au mainteneur) et dis que tu la prends.
2. Mets `main` à jour, puis crée ta branche :
   ```bash
   git switch main && git pull
   git switch -c feature/nom-court
   ```
3. Travaille par petites étapes : **un commit = une idée**.
4. Pousse ta branche et ouvre une PR vers `main` (le modèle de PR se remplit tout seul).
5. Une personne relit, commente, puis valide.
6. Le mainteneur fusionne. Tu peux supprimer ta branche.
7. Avant de repartir : `git switch main && git pull`.

Si ta branche a pris du retard sur `main`, ramène-y les nouveautés (`git merge main` depuis ta branche) avant de demander la relecture.

## Branches

| Préfixe | Usage | Exemple |
|---|---|---|
| `feature/` | Une fonctionnalité | `feature/panneau-doc` |
| `fix/` | Correction d'un bug | `fix/injection-tests` |
| `exo/` | Écriture d'un ou plusieurs exos | `exo/html-05-06` |
| `refactor/` | Réorganiser sans changer le comportement | `refactor/constantes` |
| `docs/` | Documentation | `docs/collaboration` |

Noms en minuscules, mots séparés par des tirets.

## Commits

Format : `type: Message en français` (le type est collé au `:`, un espace après).

| Type | Usage | Exemple |
|---|---|---|
| `feat` | Nouvelle fonctionnalité | `feat: Ajoute les onglets du panneau de doc` |
| `fix` | Correction d'un bug | `fix: Corrige le test de l'exo 04` |
| `exo` | Ajout ou modification d'un exo | `exo: Ajoute l'exo HTML 05 sur les paragraphes` |
| `docs` | Documentation | `docs: Ajoute le guide de contribution` |
| `refactor` | Réorganiser sans changer le comportement | `refactor: Découpe afficherApercu` |
| `style` | Mise en forme uniquement | `style: Corrige l'indentation` |
| `chore` | Configuration, outillage | `chore: Ajoute un .gitignore` |

Le type correspond au préfixe de la branche. `fix` sert uniquement à corriger un bug : ajouter du nouveau, c'est `feat`.

Ne jamais committer de clé API, de token ou de chemin personnel.

## Pull Requests

- Une PR = un sujet. Petite, donc facile à relire.
- Explique **ce que fait** la PR et **comment la tester**.
- Teste ton travail avant de la proposer (aucune erreur en console).
- Pour un nouvel exo : les tests doivent passer sur la solution (voir [docs/ecrire-un-exo.md](docs/ecrire-un-exo.md)).

## Relire une PR

- Récupère la branche et lance le projet : un relecteur **teste**, il ne se contente pas de lire.
- Vérifie les consignes, la clarté du code et les accents ou fautes dans les textes.
- Commente avec bienveillance, en proposant plutôt qu'en imposant.
- Valide (« Approve ») uniquement si tu as testé.

## Fonctionnement de l'équipe

Chacun travaille sur Piscine à côté de ses études : il n'y a pas de deadline, on avance quand on a le temps.

- **Prendre une tâche** : s'assigner l'issue avant de commencer.
- **Tâche qui traîne** : sans nouvelle pendant 14 jours, l'issue est libérée et redevient disponible. Aucun problème, on peut la reprendre plus tard.
- **Bloqué ?** Le dire sur Discord ou dans l'issue (label `statut: bloquée`) plutôt que de rester seul.
- **PR en attente** : sans relecture après 7 jours, relancer sur Discord.

## Communication

- **Discord** : questions rapides, entraide, annonces.
- **GitHub** : tout ce qui doit rester écrit (décisions, choix techniques, bugs, avancement).
- Une décision prise sur Discord est recopiée dans l'issue concernée.

## Décisions techniques

On discute dans l'issue. En cas de désaccord, le mainteneur (Lilian) tranche et on avance.

## Premiers pas (nouveau membre)

1. Lis le [README](README.md) pour comprendre le projet.
2. Installe et lance-le avec [docs/lancer-le-projet.md](docs/lancer-le-projet.md).
3. Cherche une issue `bonne-première-tâche` dans le tableau Projects, assigne-la-toi et suis le cycle de ce fichier.
4. Bloqué ? Pose ta question sur Discord : personne ne t'en voudra.

## Suivi de l'avancement

Le tableau **Projects** de GitHub fait foi pour savoir qui fait quoi. `docs/feuille-de-route.md` décrit la vision d'ensemble, pas l'avancement au jour le jour.

## Retours de relecture

- Le relecteur dit **ce qui doit changer et pourquoi**, avec un exemple de correction quand c'est possible.
- Les remarques portent sur le code, jamais sur la personne.
- L'auteur corrige **dans la même PR**, sans en rouvrir une.
- Si les changements sont importants, 10 minutes d'appel valent mieux qu'un long message.

## Conventions de code

- Fichiers en kebab-case, commentaires en français.
- Le prototype est sans build : pas d'outil à installer, on garde cette simplicité.
- Ne réorganise pas la structure des dossiers sans en parler d'abord.

## Besoin d'aide ?

Ouvre une issue ou demande au mainteneur. Une question posée tôt coûte moins cher qu'une PR refaite.
