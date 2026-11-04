# Simulateur du tirage PTP

Simule le tirage des correcteurs pour les échanges PTP, avec des élèves fictifs. Il sert à régler les probabilités, le repos et le plafond avant le pilote (README §6 et §19). Sans interface, sans dépendance.

## Lancer

Depuis la racine du dépôt :

```bash
node prototypes/ptp/simulation.mjs
```

Une graine optionnelle donne un résultat reproductible, utile pour comparer deux réglages :

```bash
node prototypes/ptp/simulation.mjs 7
```

Il faut Node.js (version récente, pour les modules ES).

## Régler les paramètres

Tous les réglages sont dans l'objet `PARAMETRES`, en tête de `simulation.mjs` :

| Paramètre | Rôle |
|---|---|
| `nbEleves`, `nbAnnees` | Taille de la simulation et répartition sur les années |
| `nbTicks` | Durée simulée (une unité = un tick) |
| `probaConnexion` | Chance qu'un élève soit connecté à un instant donné |
| `probaValidation` | Chance qu'un élève connecté valide un exo |
| `partExosNonPtp` | Part des exos `ptp: non` (jamais tirés) |
| `probaDeclenchement` | Chance de déclenchement selon le nombre d'exos validés depuis le dernier PTP |
| `plafond` | Au-delà de ce compteur, déclenchement garanti |
| `dureeEchange` | Ticks pendant lesquels élève et correcteur sont occupés |
| `bonusAutreAnnee` | Préférence légère pour un correcteur d'une autre année |
| `penalitePaire`, `fenetrePaire` | Évite qu'une même paire revienne trop vite |

## Ce que fait la simulation

- Un élève valide des exos. Son compteur augmente à chaque exo validé, éligible ou non.
- Pour un exo éligible, le déclenchement suit `probaDeclenchement` selon le compteur.
- Le correcteur est pris parmi les élèves connectés et libres, sans soi-même. On choisit le moins récemment sollicité, avec un bonus pour une autre année et une pénalité pour une paire récente.
- S'il n'y a personne de libre, le tirage est **reporté** : le compteur reste, l'élève n'attend pas.
- Après un échange, le compteur de l'élève repart de zéro. Le correcteur ne voit pas son compteur changer.

## Ce que l'on lit

Le script affiche un tableau par élève (exos validés, échanges reçus, corrections données, écart à la moyenne), puis un bilan :

- tirages déclenchés, échanges réalisés, tirages reportés ;
- élèves sans aucun échange reçu ;
- plus petit nombre d'exos validés entre deux échanges reçus. Le repos doit rester à 3 ou plus ;
- nombre de paires distinctes et écart type des corrections.

Le script vérifie aussi que le nombre d'échanges reçus égale le nombre de corrections données, et qu'aucun élève ne se corrige lui-même.

## Limites

- Une session est modélisée par une simple probabilité de connexion. Le délai de 30 s de vérification d'activité et l'alerte de 10 min ne sont pas simulés.
- Il n'y a pas de notion de promo, seulement d'année.
- Les hypothèses sur le compteur (remise à zéro pour l'élève seulement, correcteur non compté) viennent de la lecture du README et sont à valider.
