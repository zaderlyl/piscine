# Programme PTP : le vrai système de tirage des correcteurs

Document de travail, version 3 : les points du §10 sont tranchés (décisions de l'équipe après relecture de la version 2).

**La demande** : pas un simulateur, mais **le programme lui-même**, avec une page HTML, qui choisit **automatiquement** qui corrige qui, qui permet de **voir qui est avancé**, et qui évite que ce soient **toujours les mêmes personnes**. Inspiration : l'évaluation par les pairs de l'école 42.

**Convention** : tout ce qui est marqué *(proposition)* est un choix encore à valider ; *(à régler au pilote)* désigne une valeur provisoire. Les décisions sont résumées au §10.

Sources : README §6, §8, §9, §14, §16, §19 ; `docs/serveur-et-comptes.md` (PR #51).

---

## 1. L'idée en deux phrases

Quand un élève termine un exo, le programme décide s'il y a un échange. Si oui, il choisit un correcteur parmi les élèves connectés, de façon équitable et variée, et les met en relation (noms, salle, code à 6 chiffres).

Une page montre en direct **qui est connecté, qui en est où, qui est en échange, qui attend**.

## 2. Ce qu'on reprend de 42, et ce qu'on change

À 42, l'évaluation par les pairs repose sur des **points d'évaluation** : on en gagne en évaluant les autres, on en dépense pour faire évaluer son projet, et on **réserve un créneau** dans un agenda. L'évaluateur est un élève qui a déjà fait le projet. Cela crée une entraide, mais aussi des travers connus : les mêmes évaluateurs très disponibles reviennent, on évalue parfois vite pour regagner ses points, et il faut s'organiser pour trouver un créneau.

| À 42 | Ici | Pourquoi |
|---|---|---|
| L'élève demande l'évaluation et réserve un créneau | Le programme **déclenche l'échange** au bon moment, sans réservation | Pas d'attente ni de stratégie pour éviter de corriger (README §6) |
| Monnaie : points gagnés en évaluant, dépensés en se faisant évaluer | **Compteur d'équité** par élève, sans monnaie visible | Tout le monde explique à peu près autant, sans « acheter » son tour |
| L'évaluateur a déjà fait le projet | Pas obligé d'avoir fait l'exo | C'est l'explication orale qui compte (README §6) |
| Verdict validé / non validé | **Avis**, jamais un verdict | Feedback non punitif (README §6) |
| Les évaluateurs disponibles reviennent souvent | **Tirage varié** : malus de paire qui s'atténue, plafond, tirage pondéré | Objectif de la demande : pas toujours les mêmes |

## 3. Ce que le programme sait de chaque élève

| Information | Source | Sert à |
|---|---|---|
| Connecté et actif | Signal régulier de la page (heartbeat) | Ne tirer que des gens vraiment là |
| État (libre, en recherche, réservé, en échange) | Table d'état de l'élève (§7) | Ne pas tirer quelqu'un d'occupé |
| Déclenchement en attente (oui/non) | `ptp_counters` | Savoir si le prochain exo éligible donne lieu à un échange |
| Exos validés depuis le dernier PTP | `ptp_counters` | Probabilité de déclenchement (table README §6) |
| Avancement (exos validés au total, dernier exo) | `progress` | **Afficher** qui est avancé (§4.3) |
| Classe (une seule année par classe), salle | `cohorts`, `sessions_pool` | Affichage et bonus d'année (le tirage porte sur toutes les classes, §5.5) |
| Corrections faites, dernière correction, partenaires | `ptp_exchanges` | Équité et anti-répétition |

## 4. Les écrans

### 4.1 Élève
- Un exo terminé peut déclencher le tirage. Si oui : écran gelé « Recherche d'un correcteur… » avec un bouton « Annuler » (règles d'annulation au §6.3).
- Correcteur trouvé : « Marie Dupont, 3ᵉ année, salle A102 », et un **code à 6 chiffres à saisir** sur son PC.
- Après l'avis : l'exo suivant se débloque, ou il refait l'exo avec les conseils.

### 4.2 Correcteur
- Notification : « Un camarade a besoin d'un avis ». Son propre exo est bloqué tant qu'il n'a pas corrigé (brouillon conservé).
- Son écran affiche le code à 6 chiffres, l'énoncé, le code de l'élève, la grille à cocher et le champ d'avis.

### 4.3 Tableau de bord : voir qui est avancé
- Liste des élèves **connectés dans la session**, avec : avancement (nombre d'exos validés, dernier exo), état (libre, en échange, gelé, inactif), nombre de corrections faites, dernière correction.
- **Recherches en cours** et **alertes** : correcteur qui ne vient pas, échange qui traîne, échanges reportés ou perdus, échanges en cours par rapport au plafond (§6.3).
- **Équité en direct** : corrections par heure de présence. Si quelqu'un est trop sollicité, ou jamais, ça se voit.
- **Visible des profs seulement** (décidé). Pas de classement public, pour ne pas comparer les élèves (cohérent avec README §7 : ne pas surcharger les élèves de tête).

## 5. Le choix du correcteur

### 5.1 Qui est candidat
Tous ces critères à la fois :
- connecté dans une session ouverte, avec un signal de moins de **90 s** *(à régler au pilote ; 60 s est trop serré avec une interrogation de 5 à 10 s et des onglets en arrière-plan)* ;
- état d'élève **libre** (ni en recherche, ni réservé, ni en échange) ;
- pas l'élève qui demande ;
- pas un correcteur déjà libéré pour cet échange (échec de la vérification d'activité).

Un élève dont l'écran est gelé **par perte de focus** reste candidat : il sera confirmé par la vérification de 30 s. Un élève gelé parce qu'il est en échange ne l'est pas.

### 5.2 Le score
Chaque candidat reçoit un score **toujours positif**. Tous les poids vivent dans **un fichier de configuration**, jamais dans le code, pour pouvoir les régler au pilote.

`score = max(0,05 ; base × (1 + bonus) × malus)`

| Élément | Valeur proposée | Remarque |
|---|---|---|
| `base` : minutes depuis sa dernière correction | de 1 à 10 (10 = plafond, atteint après 60 min ; un correcteur jamais utilisé vaut 10) | Plafonné, sinon un arrivant récent écrase tout le monde |
| Équité : corrections **par heure de présence** sous la moyenne | bonus +0,3 | En valeur relative : un élève arrivé tard n'est pas submergé |
| Autre année que l'élève | bonus +0,2 | Préférence **légère** (README §6), ignorée si le pool est petit. **Ne joue que si plusieurs classes sont mélangées** : dans une classe, tout le monde a la même année |
| Paire déjà ensemble | malus ×0,1 juste après l'échange, **qui s'atténue avec le temps** (la moitié du malus disparaît après 1 h) | Une paire n'est jamais interdite : faible probabilité d'abord, plus forte longtemps après. Valeurs à régler au pilote |
| A déjà corrigé il y a moins de 15 min | malus ×0,3 | « Pas deux d'affilée » |
| Avancement | **ne compte pas** (§5.4) | |

Le plancher de 0,05 évite un score nul ou négatif, ce qui rendrait le tirage pondéré impossible.

### 5.3 Pas toujours les mêmes : le tirage pondéré
Prendre le meilleur score donnerait toujours les mêmes personnes, dans le même ordre. Le programme :
1. calcule le score de chaque candidat ;
2. garde les **N meilleurs**, avec N = min(6, nombre de candidats) *(à régler au pilote ; « la moitié du pool » donnerait 50 candidats à 100 connectés, donc aucune concentration)* ;
3. tire **un seul** au hasard, avec une probabilité proportionnelle à son score.

Règles complémentaires :
- **Plafond de corrections** pour un même correcteur : 3 par session pour commencer *(à régler au pilote)*.
- **Une paire peut se répéter**, avec un malus qui s'atténue dans le temps (§5.2).
- **Relâchement quand le pool est petit** (moins de 6 candidats, cf. README §19). Le malus de paire et la préférence d'année sont ignorés, et le plafond tombe si personne n'est sous le plafond.

Le tirage est **serveur uniquement** : le jet aléatoire n'est jamais fait dans le navigateur.

### 5.4 L'avancement ne compte pas *(décidé)*
Le README dit que le correcteur n'a pas besoin d'avoir fait l'exo. L'avancement est **affiché** (§4.3) mais n'entre ni dans le score ni dans le départage. Cela évite de surcharger les élèves de tête (README §7).

### 5.5 Portée du tirage : toutes les classes *(décidé)*
Comme le README §6 : le correcteur est tiré parmi **toutes les classes** de toutes les sessions ouvertes, sans préférence de classe et sans seuil de correcteurs libres. Le bonus « autre année » ne joue que si plusieurs années sont connectées.

**Nombre impair ou petite classe.** Un échange occupe deux personnes libres : avec un nombre impair, il en reste simplement une libre, sans blocage. Comme le tirage porte sur tous les connectés, une petite classe n'est plus un cas particulier.

## 6. Déroulé et états

### 6.1 Deux familles d'états
Il faut les séparer, sinon la logique se mélange.

**État de l'élève** (une valeur à la fois) : `libre`, `en_recherche`, `réservé`, `en_echange`. À part, un **indicateur** `declenche` (le déclenchement attend un exo éligible).

**État de l'échange** : `recherche`, `verification`, `confirme`, `en_cours`, `avis_donne`, `termine`, `annule`, `expire`, `appel_prof`, `clos_par_prof`.

### 6.2 Déclenchement
1. À **chaque exo validé**, le serveur fait **un seul jet** avec la probabilité de la table du README §6 (3 exos : 10 %, 4 : 20 %, 5 : 35 %, 6 : 60 %, 7 : 100 %). Le résultat est **stocké** (`declenche`) : on ne retire pas au hasard à l'exo suivant.
2. Si `declenche`, l'échange a lieu **au prochain exo éligible**.
3. Le compteur repart à 0 quand l'échange est **terminé**. Un exo en attente d'avis compte comme validé ; en cas d'avis négatif, le refaire ne rajoute rien au compteur.

### 6.3 Cas « personne de disponible » *(décidé)*
| Situation | Que fait le programme |
|---|---|
| **Aucun autre élève connecté** | On **reporte sans geler** l'élève. `declenche` reste vrai, on réessaie au prochain exo éligible. |
| **Plafond d'échanges en cours atteint** | Même chose : report sans geler. |
| **Recherche sans résultat** (aucun correcteur libre ou qui répond) | Recherche d'environ **2 min** avec écran gelé, puis l'échange est **perdu** : pas de report, le compteur repart à 0 et l'élève passe à l'exo suivant. |
| Échange **déjà confirmé** qui traîne (correcteur absent, 10 min) | Appel du prof. |

**Plafond d'échanges en cours** = connectés (tous comptes, toutes séances) ÷ 5, arrondi au supérieur. Exemple : 17 connectés, 4 échanges au maximum. Les absents (signal périmé) ne sont pas comptés. Un échange en recherche compte déjà. Le plafond évite le cas « présents mais tous occupés » : au plus 40 % des connectés sont mobilisés. La recherche de 2 min reste le filet de sécurité si, malgré cela, aucun correcteur ne répond.

### 6.4 Annulation *(proposition)*
« Annuler » ne doit pas servir à esquiver l'explication :
- le déclenchement **reste en attente** (`declenche` reste vrai) ;
- l'annulation est **journalisée** et visible des profs ;
- l'exo suivant reste bloqué tant que l'échange n'a pas eu lieu.

### 6.5 Schéma général

```
exo validé ──> jet de probabilité ──non──> rien
                    | oui : declenche = vrai
                    v
exo éligible terminé
        |
        v
   personne de connecté ou plafond atteint ──> report sans geler
        |
        v
   RECHERCHE (~2 min) ──rien de trouvé──> PERDU (pas de report, exo suivant)
        | candidat réservé (verrou)
        v
   VÉRIFICATION (30 s) ──pas de réponse──> libéré, nouveau tirage (dans les 2 min de recherche)
        |
        v
   CONFIRMÉ (code valable 5 min, régénéré s'il expire)
        | ──ne vient pas depuis 10 min──> APPEL_PROF
        v
   EN_COURS ──déconnexion de l'un des deux──> expire (l'autre est libéré)
        |
        v
   AVIS_DONNÉ ──> TERMINÉ : compteur à 0, exo suivant débloqué ou à refaire
```

La fin de session pendant un échange laisse un **délai de grâce** pour le terminer (README §6). L'appel du prof finit par `clos_par_prof` : il réassigne, prend la correction ou clôt.

---

## 7. Annexe technique : serveur

### 7.1 Les délais sans processus de fond
Un hébergement PHP standard n'a pas de démon, et le cron est parfois limité ou absent. Donc **évaluation paresseuse** : chaque appel `heartbeat` et `tableau_de_bord` appelle une fonction qui fait expirer tout échange dont `etape_deadline < NOW()`. Chaque étape stocke sa propre `deadline`.

### 7.2 Concurrence : deux demandes en même temps
- `tirage` prend un verrou MySQL (`GET_LOCK('ptp_tirage', 2)`), ce qui sérialise sans problème à 100 connectés. Le premier arrivé passe ; l'ordre est donc une file simple et il n'y a plus besoin de « mélanger l'ordre des demandes ».
- La **réservation du correcteur est atomique** : `UPDATE etat_eleve SET etat='réservé', echange_id=? WHERE user_id=? AND etat='libre'`, puis contrôle du nombre de lignes modifiées ; sinon on passe au candidat suivant. Cela empêche que A et B se tirent mutuellement.

### 7.3 Tables
Celles du README §16 : `users`, `cohorts`, `sessions_pool`, `attendance`, `progress`, `ptp_counters`, `ptp_exchanges`, `ptp_checks`. À ajouter :
- `etat_eleve` (état, échange en cours) ;
- dans `ptp_counters` : `declenche` (booléen) ;
- dans `ptp_exchanges` : état, `etape_deadline`, date de chaque étape ;
- `ptp_tirages` : candidats, scores, correcteur tiré, graine. Sert à **auditer**, régler le pilote et répondre à une plainte d'inéquité.

Index utiles : `(etat, deadline)`, `(user_id, date)`, `attendance.derniere_activite`.

### 7.4 Appels de l'API
| Appel | Qui peut l'appeler | Remarque |
|---|---|---|
| `heartbeat` | l'élève connecté | léger ; interroge aussi les notifications |
| `exo_valide` | l'élève | fait le jet de probabilité, puis lance le tirage **en interne** |
| `confirmer` | le **correcteur désigné** uniquement | |
| `saisir_code` | l'élève corrigé | 3 à 5 essais par échange |
| `avis` | le **correcteur désigné** uniquement | |
| `annuler` | l'élève | règles du §6.4 |
| `tableau_de_bord` | les profs | contrôle de rôle, filtré par session |

`tirage` n'est **pas** un appel du navigateur : seul le serveur le déclenche. Chaque appel vérifie l'authentification, le jeton CSRF et l'appartenance à l'échange.

**Limite connue** : les tests tournent dans le navigateur, donc `exo_valide` peut être falsifié et gonfler un compteur. Acceptable pour le pilote. Garde-fou minimal à prévoir : journal des gels et rejeu des tests côté serveur sur échantillon.

### 7.5 Charge
100 élèves à 5 ou 10 s font 10 à 20 requêtes par seconde en continu. Pour tenir :
- `session_write_close()` dès l'authentification (sinon les sessions PHP se bloquent entre elles) ;
- écrire la présence (`attendance`) seulement toutes les 30 s ;
- interrogation adaptative : 2 à 3 s en recherche ou en échange, 15 s au repos ;
- mettre en cache 2 à 5 s la requête d'équité du tableau de bord.

À vérifier avec une charge simulée (README §19).

### 7.6 Données personnelles
`ptp_exchanges` relie deux personnes. À la suppression d'un compte (README §14), **anonymiser** l'identifiant du partenaire au lieu de supprimer la ligne, sinon on efface l'historique de l'autre élève.

---

## 8. Plan de travail

| Étape | Contenu | Serveur ? |
|---|---|---|
| **0. Logique pure** | Choix du correcteur (§5) et états (§6). Le générateur aléatoire est **injecté**, pour tester. Des **cas de test en JSON** (états, candidats, tirage, résultat attendu) servent aussi plus tard à la version PHP, pour qu'elles ne divergent pas. | Non |
| **1. Page de démo** | Une page HTML (nom à choisir) qui lit des élèves dans un fichier JSON, affiche le tableau de bord et un bouton « cet élève termine un exo ». | Non |
| **2. Serveur** | Compte, présence, progression en base (PR #51). | Oui |
| **3. Échange réel** | Gel, code à 6 chiffres, avis, écrans élève et correcteur. | Oui |
| **4. Cas limites** | Correcteur absent, recherche de 2 min, appel du prof, fin de session. | Oui |
| **5. Pilote** | 10 à 15 volontaires (README §19) ; réglage des valeurs. | Oui |

Les étapes 0 et 1 se font sans attendre le serveur.

---

## 9. Test à 4 sessions

4 élèves (**A, B, C, D**) connectés en même temps : c'est un **petit pool**, donc le test vérifie surtout que les règles se relâchent correctement. Tu peux ouvrir 4 sessions (4 navigateurs, ou 4 profils) et suivre ce scénario. Les étapes 0 et 1 existent (dossier `prototypes/ptp/`) : ce scénario est couvert par `ptp-logique.test.mjs` (cas 1 à 12 ; `cas-de-test.json` reprend les cas communs avec la future version PHP ; le plafond du cas 13 par les tests P1 à P5) et se rejoue à la main avec la démo à onglets.

| # | Situation de départ | Action | Résultat attendu |
|---|---|---|---|
| 1 | A, B, C, D libres, connectés | A termine un exo avec `declenche` | Un des trois autres est tiré, jamais A |
| 2 | Idem, 20 tirages d'affilée (compteurs remis à zéro entre chaque) | Mesure | Chacun des trois autres est tiré environ le même nombre de fois, pas toujours le même |
| 3 | A est en échange avec B | C termine un exo avec `declenche` | Seul D est candidat |
| 4 | A est en échange avec B, C est en échange avec D (cas rare, normalement évité par le plafond) | Aucun élève libre : A termine encore un exo | Recherche de 2 min, puis échange perdu : A passe à l'exo suivant |
| 5 | Seul A est connecté | A termine un exo avec `declenche` | Aucun candidat connecté : report sans geler, `declenche` reste vrai |
| 6 | A et B se sont déjà retrouvés (récemment) | A demande encore, B et D disponibles | D est nettement préféré (malus de paire) |
| 7 | A et B sont les deux seuls libres | A demande, B a déjà corrigé A | B est tiré quand même (relâchement du pool) |
| 8 | A et B demandent **au même instant** | Les deux demandes arrivent ensemble | Deux échanges distincts, ou l'un des deux reporté ; jamais « A corrige B et B corrige A » |
| 9 | C est tiré mais ne répond pas à la vérification de 30 s | Attendre | C est libéré, D est tiré à la place |
| 10 | Correcteur confirmé qui ne vient pas | Attendre 10 min | Appel du prof |
| 11 | A annule pendant la recherche | A annule | `declenche` reste vrai, annulation journalisée, exo suivant bloqué |
| 12 | A ferme l'onglet en plein échange | Fermer | L'échange expire, B est libéré |
| 13 | 17 connectés, 4 échanges déjà en cours | Un cinquième élève termine un exo avec `declenche` | Plafond atteint : report sans geler, `declenche` reste vrai |

Avec 4 connectés, le plafond est de 1 échange (4 ÷ 5, arrondi au supérieur) : les cas 3 et 8, qui demandent deux échanges en même temps, se testent avec au moins 6 connectés ou en levant le plafond (`diviseurPlafond: 1`). Les cas 1, 9 et 12 restent les plus parlants à 4 vraies sessions. Les autres (2, 5, 6, 7, 13) se vérifient mieux avec les cas de test JSON de l'étape 0.

---

## 10. Décisions

1. **Avancement** : ne compte pas dans le choix du correcteur (§5.4).
2. **Personne de disponible** (§6.3) : si personne n'est connecté, report sans geler l'écran. Le cas « présents mais tous occupés » ne doit pas arriver, car le nombre d'échanges en cours est plafonné à connectés ÷ 5, arrondi au supérieur (17 connectés : 4 échanges). Les absents ne comptent pas. La file de 2 min est remplacée par une recherche d'environ 2 min : si aucun correcteur n'est trouvé, l'élève passe à l'exo suivant.
3. **Valeurs** (signal de 90 s, N = 6, plafond de 3 corrections, pénalités) : à régler au pilote.
4. **Paire répétée** : autorisée, avec une pénalité qui s'atténue dans le temps (§5.2).
5. **Tableau de bord** : profs seulement (§4.3).
6. **Échange non trouvé après la recherche** : perdu, pas de report (§6.3).
7. **Langage** : logique en JavaScript d'abord (démo sans serveur), puis réécriture en PHP avec des cas de test JSON communs (§8, étape 0).
8. **Portée du tirage** : toutes les classes, comme le README ; le seuil de 6 correcteurs libres disparaît (§5.5).
9. **Issue #23** : reformulée en « Prototype du tirage PTP (simulation, logique, démo) » et fermée avec cette PR.

**Encore ouvert** : l'annulation (§6.4) n'a pas été revue ; la proposition (le déclenchement reste en attente) tient jusqu'à nouvel ordre.
