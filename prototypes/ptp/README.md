# Prototype PTP : tirage du correcteur

Prototype du tirage équitable des correcteurs (README du projet §6 et §19, issue zaderlyl/piscine#23). La conception est dans [CONCEPTION.md](CONCEPTION.md).

Le dossier contient trois choses qui partagent **la même logique** (`ptp-logique.js`) :

| Quoi | Fichier | Pour faire quoi |
|---|---|---|
| **Simulation** de séances avec des élèves fictifs | `simuler.mjs` | Régler les probabilités, le repos et le plafond, mesurer l'équité |
| **Démo à onglets** : un onglet = un élève | `index.html` | Voir le tirage, les écrans élève et correcteur, la vue prof |
| **Logique** (score, tirage pondéré, états, délais) | `ptp-logique.js` | Aucun accès au navigateur : testable |

Aucun fichier existant du dépôt n'est touché. Aucune dépendance.

## 1. Lancer la simulation

Depuis la racine du dépôt :

```bash
node prototypes/ptp/simuler.mjs
```

Par défaut : 30 élèves répartis en 4 classes, une séance de 180 minutes. Le programme affiche un tableau par élève (présence, exos validés, échanges reçus, corrections faites, attente moyenne) puis un bilan : échanges terminés, reportés (personne de connecté ou plafond atteint), perdus (aucun correcteur trouvé en 2 min), expirés, appels du prof, écart entre élèves, paires répétées, délai d'attente.

Options :

```bash
node prototypes/ptp/simuler.mjs --liste                       # liste des scénarios
node prototypes/ptp/simuler.mjs --scenario petit-pool         # un scénario nommé
node prototypes/ptp/simuler.mjs --eleves 50 --graine 7 --seance 240
```

La même graine donne le même résultat : on peut comparer deux réglages sur la même séance.

### Où changer les réglages
- **En tête de `simuler.mjs`** (objet `PARAMS`) : nombre d'élèves, classes, durée, présence, vitesse de travail, **table de probabilité de déclenchement** (`probaDeclenchement`), comportement des correcteurs, avis. La clé `reglages` surcharge ceux de la logique, par exemple `{ plafondSession: 2, diviseurPlafond: 4, rechercheMs: 60000 }`.
- **En tête de `ptp-logique.js`** (objet `CONFIG_DEFAUT`) : plafond de corrections, plafond d'échanges en cours (`diviseurPlafond` : connectés ÷ 5, arrondi au supérieur), durée de la recherche (`rechercheMs`, 2 min), délais, bonus et malus du score (dont l'atténuation du malus de paire, `demiViePaireMs`), taille du groupe de tirage. Le tirage porte toujours sur toutes les classes.

### Scénarios
`normal`, `absences`, `petit-pool`, `classe-impaire`, `plafond-large`, `plafond-serre`, `correcteurs-absents`, `tout-declenche`, `sans-plafond`. Chacun surcharge quelques réglages (voir `SCENARIOS` dans `simuler.mjs`).

### Ce que la simulation a montré (graine 42, scénario normal)
- **23 échanges** pour 27 élèves venus : environ un échange par élève et par séance de 3 heures avec la table du README. Avec si peu d'échanges, **8 élèves sur 27 n'ont jamais corrigé**, même présents plus d'une heure. Ce n'est pas un défaut du tirage : il n'y a pas assez d'échanges pour que chacun corrige. Si on veut que chacun corrige au moins une fois par séance, il faut augmenter les probabilités (essayer `tout-declenche`, qui donne 91 échanges et 0 élève sans correction ; le plafond d'échanges en cours y reporte alors 6 échanges).
- **Le plafond de 3 corrections n'a presque aucun effet** : il tombe dès que plus personne n'est sous le plafond, et avec peu d'échanges il n'est presque jamais atteint (`sans-plafond` donne exactement le même résultat). Même avec un plafond de 1 et un échange à chaque exo, le maximum reste à 5 ou 6 corrections. Un vrai plafond demanderait une autre règle (par exemple par heure de présence, ou sans relâchement).
- **Plafond d'échanges en cours** : avec la table du README, il ne joue presque jamais (0 report en scénario `normal`) ; il se voit surtout quand tout le monde déclenche (`tout-declenche`) ou avec un plafond serré (`plafond-serre`, connectés ÷ 10 : 6 échanges reportés).
- **Attente d'un correcteur** : environ 20 secondes en moyenne. Avec des correcteurs qui répondent mal (`correcteurs-absents`), elle monte à 48 secondes, 4 échanges sont perdus après les 2 minutes de recherche et 1 est reporté.
- **Petite classe** : les mêmes paires peuvent revenir, mais le malus de paire s'atténue avec le temps au lieu d'interdire.

Ce sont des résultats de simulation avec des hypothèses de présence et de vitesse inventées : ils servent à comparer des réglages entre eux, pas à prévoir le pilote.

## 2. Lancer la démo à onglets

Depuis la racine du dépôt :

```bash
python3 -m http.server 8000
```

Ouvre ensuite http://localhost:8000/prototypes/ptp/ dans **plusieurs onglets du même navigateur**, tous avec exactement la même adresse (`localhost` et `127.0.0.1` ne partagent pas leurs données). Dans chaque onglet, choisis un prénom et une classe (MMI1-A et MMI1-B en année 1, MMI2-A en année 2, MMI3-A en année 3).

Pas de serveur : l'état est partagé entre les onglets par `localStorage`, avec un verrou (`navigator.locks`) pour que deux clics simultanés ne se marchent pas dessus. Il faut passer par `http://localhost`, pas par un double-clic sur le fichier.

Le tirage porte sur **toutes les classes**, comme le README du projet. La vue prof affiche le nombre d'échanges en cours par rapport au plafond.

### Scénario de test
1. Coche « chaque exo déclenche un échange » (sinon l'échange arrive après plusieurs exos, selon la table du README).
2. Dans un onglet, clique « J'ai terminé l'exo » : un autre élève est tiré et voit « Un camarade a besoin d'un avis ».
3. Chez le correcteur : « Je suis là », il voit un code à 6 chiffres.
4. Chez l'élève : saisis le code, puis chez le correcteur : donne un avis.
5. Bouton « Vue prof » : avancement, états, corrections par heure, paires, journal des tirages avec les scores.

Si personne n'est proposé : la case de l'étape 1 n'est pas cochée, un seul onglet est connecté, les onglets n'ont pas la même adresse, les autres élèves sont occupés, le plafond d'échanges en cours est atteint, ou un onglet laissé longtemps en arrière-plan est vu comme déconnecté. La vue prof montre l'état et la présence de chacun.

Avec peu d'onglets, le plafond est bas (4 connectés : 1 échange à la fois), et un deuxième élève qui valide est reporté sans geler. À tester aussi : ne pas répondre 30 s (le correcteur est libéré, la recherche continue 2 min puis l'échange est perdu), « Annuler » (l'exo suivant reste bloqué), fermer un onglet en plein échange (il expire après 2 min sans signal), deux onglets qui valident en même temps.

Le bouton « J'ai terminé l'exo » simule la réussite des tests : la démo n'est pas reliée aux vrais exos.

## 3. Tests

```bash
node --test "prototypes/ptp/*.test.mjs"
```

47 tests : les 12 cas du §9 de CONCEPTION.md, le plafond d'échanges en cours, la recherche de 2 min et l'échange perdu, le malus de paire qui s'atténue, la table de probabilité (et sa modification), l'éligibilité des exos, les classes (nombre impair, petite classe, toutes les classes), et la simulation (même graine, mêmes résultats ; personne ne se corrige ; les comptes concordent ; les absents ne corrigent pas), plus les cas communs de `cas-de-test.json` (rejoués par `cas-de-test.test.mjs`, réutilisables pour la version PHP).

## Ce qui n'est pas fait
Voir [AMELIORATIONS-INTERFACE.md](AMELIORATIONS-INTERFACE.md) pour les idées d'interface, et CONCEPTION.md §10 pour les points à trancher. Pas de serveur (PHP et MySQL), pas de gel réel de l'écran, pas de lien avec les vrais exos.
