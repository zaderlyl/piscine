# Simulateur du tirage PTP

Simule les échanges PTP d'une ou plusieurs séances avec des élèves fictifs, pour régler les probabilités, le repos, le plafond et les délais avant le pilote (README §6, §8 et §19). Sans interface, sans dépendance. Il faut Node.js 18 ou plus.

## Lancer

Depuis la racine du dépôt :

```bash
node prototypes/ptp/simulation.mjs
```

```bash
node prototypes/ptp/simulation.mjs absences 7
```

- Premier argument : le scénario (par défaut `normal`). Deuxième : la graine (par défaut 42). Même scénario et même graine donnent le même résultat.
- `--liste` : affiche les scénarios.
- `--detail` : ajoute le tableau par élève.
- `--eleves fichier.json` : utilise de vrais élèves au lieu d'élèves fictifs (voir plus bas).

## Tests

```bash
node --test prototypes/ptp/simulation.test.mjs
```

Les tests rejouent tous les scénarios sur plusieurs graines et vérifient :

- au moins 3 exos validés entre deux échanges d'un même élève (repos) ;
- jamais d'auto-correction, jamais un correcteur dans deux échanges ;
- un élève absent ou hors session n'est jamais tiré ;
- l'échange part du premier exo éligible après le déclenchement ;
- toutes les demandes aboutissent, avec une attente bornée ;
- sur 10 séances, tout le monde corrige et reçoit des échanges, et aucune paire ne revient en boucle ;
- un élève n'est que dans une session à la fois, et deux sessions simultanées partagent le tirage ;
- un élève présent deux fois dans les données n'est compté qu'une fois.

## Scénarios

Un scénario est un fichier JSON dans `scenarios/`. Il ne contient que ce qui change par rapport aux valeurs par défaut (`PARAMETRES_DEFAUT` dans `moteur.mjs`).

| Scénario | Ce qu'il teste |
|---|---|
| `normal` | Une séance de 4 h, 30 élèves |
| `absences` | 30 % d'absents, départs anticipés fréquents |
| `petit-pool` | 6 élèves : la préférence d'année est ignorée |
| `pic-fin-de-seance` | Beaucoup de validations dans les 45 dernières minutes |
| `correcteurs-absents` | Correcteurs qui répondent mal ou ne viennent pas |
| `sessions-paralleles` | 60 élèves, deux salles ouvertes en même temps |
| `longue` | 10 séances à la suite, pour l'équité sur la durée |
| `pilote` | 12 volontaires sur 2 années, une séance de 3 h |

## Le modèle

**Temps.** 1 tick = 1 minute. Toutes les durées sont en minutes.

**Présence.** Chaque élève appartient à un groupe et peut venir aux sessions de son groupe. Pour chaque session, il vient ou non (`probaVenir`), arrive avec un retard tiré (`retardMax`) et peut partir avant la fin (`probaDepartAnticipe`). Il n'est que dans une session à la fois. Pendant sa présence, il alterne actif et inactif. Un élève en échange à la fin de sa session le termine avant de partir (délai de grâce), mais ne valide plus d'exo.

**Validation.** Un élève présent, actif et libre valide un exo avec `probaValidationParMinute`, multipliée par sa vitesse personnelle, et par `pic.facteur` en fin de séance. 15 % des exos sont `ptp: non`.

**Déclenchement.** À chaque exo validé, le compteur augmente et le déclenchement est tiré selon la table du README. Une fois déclenché, il n'y a plus de tirage : l'élève attend le premier exo éligible (celui-ci compris). L'état « déclenché » est gardé même si l'élève part.

**Tirage du correcteur.** Les demandes en attente sont traitées dans un ordre mélangé à chaque minute. Candidats : présents dans leur session, libres, pas soi-même, pas déjà tirés pour cette demande. Score = minutes depuis sa dernière correction × bonus d'autre année (ignoré sous `seuilPetitPool` présents) ÷ (1 + `penalitePaire` × échanges déjà faits par cette paire) × un léger bruit.

**Confirmation.** Le correcteur tiré doit être actif et répondre (`probaConfirmation`). Sinon un autre est tiré ; après `maxTirages` échecs, le prof est appelé.

**Déplacement et échange.** Le correcteur confirmé est bloqué sur son propre exo, se déplace, puis l'échange dure `dureeEchange`. S'il ne vient pas (`probaNeVientPas`), une alerte part au bout de `delaiAlerte` et le prof prend l'échange. Si personne n'est libre pendant `attenteMaxAvantProf`, le prof est aussi appelé.

## Ce que l'on lit

Présence, exos validés, demandes (dont en fin de séance), échanges entre élèves et par le prof, appels du prof par raison, attente d'un correcteur (moyenne, 90e centile, max), délai entre déclenchement et échange, exos entre deux échanges, compteur maximal à la demande, délai avant le premier échange, corrections par élève, paire la plus répétée, part d'échanges inter-années, élèves oubliés.

## Utiliser de vrais élèves

`--eleves` lit une liste JSON. Champs : `id` (obligatoire), `prenom`, `nom`, `annee`, `compteur` (repris de `ptp_counters`), `groupe`. Un même `id` n'est gardé qu'une fois. Exemple : `donnees/eleves.exemple.json` (l'élève 2 y est en double exprès).

```bash
node prototypes/ptp/simulation.mjs pilote --eleves prototypes/ptp/donnees/eleves.exemple.json --detail
```

Plus tard, ce fichier sera produit par une requête sur la base (voir `LOGIQUE.md`, section 8).

## Hypothèses à confirmer (issue #23)

Les valeurs par défaut sont des hypothèses : 1 tick = 1 minute, `probaVenir` 0,9, répartition des années 40/35/25 %, vitesse de 0,6 à 1,5, `probaNeVientPas` 5 %, appel du prof après 10 min sans correcteur, préférence d'autre année de +20 %. Les vraies valeurs viendront du pilote.

## Limites

- Le prof a une capacité illimitée : la file d'attente du prof n'est pas modélisée.
- Le bouton « Annuler », le plantage pendant le gel et le code à 6 chiffres ne sont pas simulés.
- L'avis du correcteur (positif ou négatif) n'est pas simulé : un échange se termine toujours.
- La salle ne joue pas sur le temps de déplacement.
