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

## Avant de proposer ton exo

- [ ] Le fichier est au bon endroit et nommé correctement.
- [ ] Les accents et la ponctuation sont corrects.
- [ ] En mode `?auteur`, la solution fait passer tous les tests.
- [ ] Un code faux fait afficher un ❌ avec un message compréhensible.
- [ ] Aucune erreur en console.
- [ ] Commit : `exo: Ajoute l'exo HTML 05 sur les paragraphes`, sur une branche `exo/...`.
