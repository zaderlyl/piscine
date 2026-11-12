# Écrire un exo

Un exo = **un fichier Markdown**, rangé dans `exos/<langage>/<famille>/<numéro>.md` (exemple : `exos/html/vanilla/04.md`). Le cadrage pédagogique complet est dans le [README](../README.md), sections 2, 3 et 11.

## Modèle

````markdown
---
type: classique          # intro | classique | palier | projet | cours
titre: Les conditions
annee: 1
ptp: oui                 # oui (défaut) | non | simple | riche
notions: [if, else]
panneaux: [enonce, editeur, apercu]
emmet_debloque: ["lorem"]   # raccourcis Emmet acquis à la validation (facultatif)
---

## Cours
Une condition permet d'exécuter du code seulement si...

## Énoncé
Déclare une variable `age` et affiche "majeur" si elle vaut 18 ou plus.

## Méthode
- [ ] Utilise un `if`

## Résultat
- [ ] La console affiche "majeur" pour age = 20

## Indice
Pense à la condition qui compare `age` à 18.

## Tests
```js
assert(...)
```

## Solution: script.js
```js
const age = 20;
if (age >= 18) console.log("majeur");
```
````

## Cours seul (exos 00)

Chaque famille commence par un exo `00` qui est un **cours seul** : l'élève lit, sans exercice à valider. L'exo compte comme fait dès qu'il est ouvert, et le bouton « Exo suivant » apparaît tout de suite.

```markdown
---
type: cours
titre: À quoi sert HTML
notions: [balise, élément]
---

## Cours
Le texte du cours, en Markdown. Les sous-titres `###` sont permis.
```

- Seuls `type`, `titre` et `notions` sont obligatoires. Pas de `panneaux` ni de `ptp`.
- La seule section autorisée est `## Cours` : pas d'énoncé, de méthode, de résultat, d'indice, de tests ni de solution. Le validateur refuse le fichier sinon.
- Le cours doit apprendre ce qui sert dans l'exo `01`, rien de plus.

## Les sections

| Section | Rôle |
|---|---|
| `## Cours` | La notion expliquée. Affichée dans l'onglet Cours. |
| `## Énoncé` | Ce que l'élève doit faire. |
| `## Méthode` | Contraintes d'outil (exos seulement). |
| `## Résultat` | Ce qui doit être obtenu. |
| `## Indice` | Un coup de pouce, sans donner la solution. |
| `## Tests` | Code JS exécuté dans l'aperçu, dans un bloc de code. |
| `## Solution: <fichier>` | Solution de référence pour ce fichier, dans un bloc de code. |
| `## Schéma` | Exos de schéma SQL seulement (voir plus bas). Remplace Tests et Solution. |
| `## Base` / `## Solutions` | Exos de requêtes SQL seulement (voir plus bas). Remplacent Tests et Solution. |

Tout le texte est du Markdown : gras, listes, code avec des backticks.

## Écrire les tests

Les tests s'exécutent dans l'aperçu une fois la page chargée. Ils disposent de ces outils :

| Outil | Rôle |
|---|---|
| `assert(condition, message)` | Enregistre un test. Le message s'affiche si la condition est fausse. |
| `$(sélecteur)` | Premier élément correspondant (`querySelector`). |
| `$$(sélecteur)` | Tous les éléments correspondants, sous forme de tableau. |
| `style(sélecteur, propriété)` | Valeur calculée d'une propriété CSS. |
| `click(sélecteur)` | Simule un clic. |
| `type(sélecteur, texte)` | Remplit un champ et déclenche `input` et `change`. |
| `wait(ms)` | Attend (avec `await`). |

Exemple :

```js
for (let i = 1; i <= 6; i++) {
  assert($$("h" + i).length === 1, "Il faut exactement un <h" + i + ">");
}
```

Règles : un message clair par test (l'élève le lit), et le code des tests ne doit jamais boucler.

## Exos de schéma SQL

Dans `exos/sql/schema/`, l'élève complète des tables avec des listes déroulantes, sans écrire de code. Front matter : `panneaux: [enonce, schema]`. Il n'y a ni `## Tests` ni `## Solution` : la section `## Schéma` contient tout.

```
## Schéma
table: commandes
colonnes: id  produit  client_id
cles: ?[primaire|étrangère|aucune]  ?[primaire|étrangère|aucune]  ?[primaire|étrangère|aucune]
lignes:
- 10 | Clavier | 2
- 11 | Souris | 1
reponses: primaire, aucune, étrangère
```

- `table:` donne le nom de la table. Pour plusieurs tables, écris plusieurs blocs, chacun commençant par `table:`.
- Chaque ligne `nom: ...` avant `lignes:` est une rangée d'en-tête (colonnes, types, clés…). Un élément est soit un mot fixe, soit un trou `?[choix1|choix2|…]`.
- `lignes:` est suivi des lignes de données, une par `- a | b | c`.
- `reponses:` donne la bonne réponse de chaque trou, dans l'ordre de lecture (table par table, rangée par rangée, de gauche à droite). Elle peut être omise pour une table sans trou.
- Pour les rangées nommées `colonnes`, `types` ou `cles`, l'élève reçoit un conseil adapté s'il se trompe.

`node scripts/valider-exos.js` vérifie que le schéma est lisible et que chaque réponse est dans les choix de son trou.

## Exos de requêtes SQL

Dans `exos/sql/requetes/`, l'élève écrit une requête dans un éditeur, l'exécute pour voir le résultat, puis la vérifie. Front matter : `panneaux: [enonce, sql]`. Pas de `## Tests` ni de `## Solution`.

````
## Base
```sql
CREATE TABLE eleves (id INTEGER, nom TEXT);
INSERT INTO eleves VALUES (1, 'Alice'), (2, 'Bruno');
```

## Solutions
```sql
SELECT nom FROM eleves;
```
```sql
SELECT eleves.nom FROM eleves;
```
````

- `## Base` : un seul bloc de code, exécuté pour créer la base de départ. Elle repart de zéro à chaque exécution.
- `## Solutions` : un bloc de code par requête acceptée. Mets plusieurs solutions quand le palier ou le projet en accepte plusieurs écritures.
- `node scripts/valider-exos.js` exécute chaque solution sur la base (il faut le paquet `sql.js` installé, sinon un avertissement s'affiche).

### Trois modes de vérification

Le champ `verification:` du front matter choisit comment la requête de l'élève est jugée : `texte` (défaut), `resultat` ou `etat`. Une autre valeur est refusée par le validateur.

| | `verification: texte` | `verification: resultat` | `verification: etat` |
|---|---|---|---|
| Idée | Faire utiliser l'outil demandé (exos classiques) | Obtenir le bon tableau, par n'importe quel chemin (paliers et projets de lecture) | Obtenir les bonnes données, par n'importe quel chemin (paliers et projets d'écriture) |
| Comment | Le **texte** de la requête est comparé à chaque solution | La requête et les solutions sont exécutées sur la même base, et les **tableaux** sont comparés | La requête et les solutions sont exécutées sur la même base, et le **contenu des tables** après exécution est comparé |
| `## Solutions` | Un bloc par écriture acceptée | Une seule solution suffit, les autres écritures qui donnent le même tableau sont acceptées | Une seule solution suffit, les autres façons d'arriver aux mêmes données sont acceptées |

En mode `texte`, sont ignorés : majuscules/minuscules (sauf dans le texte entre guillemets), espaces (y compris autour de `=`, `<`, `>`, `<=`, `>=`, `<>`, `!=`), retours à la ligne, commentaires `--` et `;` final. Le reste doit être identique : si l'exo accepte plusieurs écritures (`INNER JOIN` ou `JOIN`, conditions dans un autre ordre), mets un bloc par écriture.

En mode `resultat` :
- Les colonnes doivent être les mêmes (casse ignorée), avec le même nombre de lignes et les mêmes valeurs.
- L'ordre des lignes compte **seulement si la solution contient un `ORDER BY`**. Pour un tri, choisis des données sans égalité sur la colonne triée.
- Le validateur refuse une solution qui renvoie 0 ligne (n'importe quelle requête vide passerait).
- Si une colonne est calculée (`COUNT(*)`…), demande dans l'énoncé le nom de la colonne (`AS nb`) : les noms de colonnes sont comparés.

En mode `etat` :
- Toutes les tables sont comparées après l'exécution : mêmes tables, mêmes colonnes, mêmes lignes. L'ordre des lignes est ignoré (une table n'a pas d'ordre).
- L'élève peut écrire plusieurs requêtes à la suite, dans n'importe quel ordre : seul compte l'état final.
- Le validateur refuse une solution qui ne modifie aucune table.

Extrait de l'en-tête d'un palier (les autres champs restent obligatoires) :

```
---
type: palier
titre: Palier : lire une table
verification: resultat
panneaux: [enonce, sql]
---
```

## Exos d'écriture SQL

Dans `exos/sql/ecriture/`, l'élève écrit des requêtes qui **modifient** les données (`INSERT`, `UPDATE`, `DELETE`). Le format est celui des exos de requêtes (`## Base` et `## Solutions`, `panneaux: [enonce, sql]`), avec ces particularités :
- Après **Exécuter**, le panneau affiche le contenu de **toutes les tables** après la requête (une requête d'écriture n'a pas de tableau de résultat).
- Un bloc de `## Solutions` peut contenir plusieurs requêtes (un palier en demande souvent trois).
- Les exos classiques se vérifient par le `texte`, les paliers par l'`etat` (voir plus haut).
- Le validateur refuse, dans ce dossier, une solution qui ne modifie aucune table.
- Dans le cours, rappelle que `UPDATE` et `DELETE` sans `WHERE` touchent **toutes** les lignes.

## Les règles à respecter

- **L'élève part d'un éditeur vide.** Pas de section `## Départ`.
- `## Solution` n'est jamais envoyée aux élèves.
- Une solution est obligatoire : **les tests doivent passer sur elle**. Vérifie avec `?auteur` puis « Charger la solution ».
- Numérotation sur deux chiffres (`00`, `01`, `04`…), voir README section 2.
- Les titres de section sont exacts : `## Énoncé` (avec accents), pas `## Enonce`.
- `emmet_debloque` : les abréviations Emmet débloquées quand l'exo est réussi. Facultatif.

## Principes pédagogiques

Ces principes guident l'écriture de tous les exercices de la plateforme (HTML, CSS, JS, Git, etc.). Ils garantissent une progression fluide, bienveillante et sans frustration.

### 1. Typologie des exercices
Chaque module alterne trois types d'exercices :
- **Base** : Découverte d'une seule notion nouvelle dans un cadre guidé (ex. : `04` pour les titres `h1` à `h6`).
- **Imbriquer** : Combinaison de deux notions déjà apprises (ex. : `07` pour un titre contenant du gras `<h1><strong>...</strong></h1>`, ou un lien autour d'une image).
- **Reproduire** : Mini-palier sans consigne de code détaillée (ex. : `10`). L'élève reproduit un résultat visuel d'après un modèle, en mobilisant ses acquis en autonomie.

### 2. Rythme et taille d'un pas
- **Une seule idée nouvelle par exercice.** Le `01` apprend `p`, le `05` apprend `h1` à `h6`. Si un exercice demande d'assimiler plusieurs notions complexes d'un coup, on le coupe.
- **On montre avant d'expliquer (résultat visuel d'abord).** Les premiers exercices produisent un résultat visible immédiat dans l'aperçu. Les notions qui ne s'affichent pas (`head`, `meta charset`, `description`) arrivent plus tard, dans le contexte d'une vraie page complète.
- **Aucun prérequis caché.** Si un test exige une balise, un attribut ou une structure, cette notion doit impérativement avoir été introduite dans le cours ou un exercice précédent.
- **Texte libre par défaut.** L'élève est libre de son contenu textuel, sauf quand le test a besoin d'un mot-clé précis pour vérifier l'exercice.

### 3. Difficulté et autonomie
- **Toujours du code à produire.** L'élève part toujours d'un éditeur vide : pas de code à trous, pas de bug artificiel à réparer, pas de code à prédire.
- **Durée cible : 2 à 5 minutes par exercice classique.** Un exercice qui prend plus de temps est soit trop verbeux, soit trop dense.
- **Difficulté en profondeur, pas en dureté.** La complexité vient de la combinaison de briques simples, jamais de pièges syntaxiques obscurs.

### 4. Indices (aide progressive)
- **Un seul indice par exercice** dans la section `## Indice`.
- L'indice donne la forme générale ou le modèle syntaxique (`<balise>...</balise>`), sans jamais fournir la réponse exacte à copier-coller.
- Au-delà, l'élève s'appuie sur le cours, la documentation ou demande de l'aide à un camarade en présentiel.

### 5. Retours à l'élève et messages de tests
- **Formulation constructive obligatoire.** Le message d'erreur d'un test doit dire explicitement **ce qu'il faut ajouter ou corriger**, en commençant par un verbe d'action (« Ajoute un titre principal h1 dans le body »).
- **Jamais de constat passif.** Éviter les messages froids du type `❌ Erreur`, `❌ h1 manquant` ou `Assertion failed`.
- **Clarté sans jargon.** Nommer précisément les balises entre crochets (`<h1>`, `<p>`) et les zones concernées (`dans le head`, `dans le body`), sans terme technique non vu en cours.
- **Tolérance technique.** Les tests vérifient la sémantique et le DOM, pas des détails invisibles et frustrants (comme le nombre exact d'espaces d'indentation).
- **Une page vide n'est jamais validée.**

### 6. Rôle des tests automatiques vs Échange PTP
- **Ce que la machine teste :** La présence des éléments, la conformité de l'arborescence DOM et le comportement minimal attendu.
- **Ce que l'échange PTP valide :** La compréhension réelle de l'élève (« Pourquoi as-tu utilisé cette balise ? », « À quoi sert cet attribut ? »). La pédagogie repose sur l'explication orale entre pairs.

## Avant de proposer ton exo

- [ ] Le fichier est au bon endroit et nommé correctement.
- [ ] Les accents et la ponctuation sont corrects.
- [ ] En mode `?auteur`, la solution fait passer tous les tests.
- [ ] Un code faux fait afficher un ❌ avec un message compréhensible.
- [ ] Aucune erreur en console.
- [ ] Commit : `exo: Ajoute l'exo HTML 05 sur les paragraphes`, sur une branche `exo/...`.
