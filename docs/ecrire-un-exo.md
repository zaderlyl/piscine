# Écrire un exo

Un exo = **un fichier Markdown**, rangé dans `exos/<langage>/<famille>/<numéro>.md` (exemple : `exos/html/vanilla/04.md`). Le cadrage pédagogique complet est dans le [README](../README.md), sections 2, 3 et 11.

## Modèle

````markdown
---
type: classique          # intro | classique | palier | projet
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
- **Une seule idée nouvelle par exercice.** Le `00` apprend `p`, le `04` apprend `h1` à `h6`. Si un exercice demande d'assimiler plusieurs notions complexes d'un coup, on le coupe.
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
