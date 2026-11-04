# Simulateur PTP : logique, problèmes et plan

Document de travail pour l'issue #23 (simulateur de tirage PTP). Il décrit ce que fait le prototype actuel (`prototypes/ptp/simulation.mjs`, commit `2f6b018`), ce qui manque, et comment le compléter. Sources : README §6 (échanges PTP), §8 (sessions et présence), §19 (pilote et simulation).

---

## 1. Ce que fait le prototype aujourd'hui

Le prototype ne détecte rien : il crée 30 élèves fictifs en mémoire et les fait évoluer tick après tick.

À chaque tick (une unité de temps sans correspondance réelle) :

1. Chaque élève est connecté ou non, tirage indépendant à chaque tick (probabilité 0,6).
2. Chaque élève connecté et libre valide un exo avec une probabilité de 0,05.
3. Un exo valide augmente le compteur. Un exo éligible (85 %) tire le déclenchement selon la table du README.
4. Si ça déclenche, on prend le correcteur le plus « ancien » parmi les connectés libres, avec un bonus pour une autre année et une pénalité pour une paire récente.
5. Échange : élève et correcteur sont occupés 3 ticks, le compteur de l'élève repart à 0.

La présence, les années et les absences sont donc tirés au hasard et sans mémoire d'un tick à l'autre.

---

## 2. Réponses à tes questions

**Comment on détecte les élèves ?**
Dans le prototype : on ne détecte rien, on simule. Dans la vraie application, un élève est « présent » s'il est connecté pendant une session ouverte (README §8). La présence se mesure par un *heartbeat* (un signal régulier envoyé par la page) et par une activité réelle (frappe, clic). Le simulateur doit reproduire cette logique : une présence qui dure, pas un tirage par tick.

**Et les absents ?**
Un élève peut être absent toute la session, ou arriver en retard, ou partir avant la fin. Le prototype ne gère pas ça : un élève « absent » n'est qu'un tick où il n'est pas connecté, ce qui est faux. À modéliser : une présence par session (arrivée, départ), et une probabilité de venir du tout.

**Et les niveaux différents ?**
Le prototype répartit les élèves sur 3 années à parts égales et ajoute un petit bonus pour une autre année. C'est tout. Il ne modélise ni la répartition réelle des promos, ni les préférences, ni le fait qu'un élève de 1re année explique parfois mal un exo de 3e (le README dit que la préférence inter-années est *légère* et ignorée si le pool est petit).

**Comment on sait que c'est le bon moment ?**
Le README dit : le déclenchement a lieu **au prochain exo éligible** après que le compteur a atteint son seuil. Le prototype tire à *chaque* exo éligible avec la probabilité du compteur, ce qui est différent : un échange déclenché peut être perdu, puis retiré au tirage suivant. Il faut un état « en attente » qui persiste jusqu'au prochain exo éligible, sans nouveau tirage.

---

## 3. Liste des problèmes

### A. Présence et détection
1. **Connexion tirée à chaque tick**, indépendante d'un tick à l'autre. Un élève connecté une heure n'existe pas dans le modèle.
2. **Pas de session** : pas de début, pas de fin, pas de session simultanée, pas de règle « un élève n'est que dans une session à la fois ».
3. **Pas d'arrivée ni de départ** en cours de session (retards, sorties, pauses).
4. **Pas de notion d'activité réelle** : un élève connecté mais inactif (il lit, il est parti manger) est traité comme disponible.
5. **Pas de gel** (README §9) : un élève dont l'écran est gelé ne peut ni valider ni être corrigé.

### B. Absences et disponibilité
6. **Pas d'absences longues** : un élève absent toute la session n'est jamais modélisé.
7. **Pas de correcteur qui ne vient pas** (README §6, cas limites) : après confirmation, il ne se déplace pas, ou met 10 min.
8. **Pas de confirmation du correcteur** : le README prévoit une vérification d'activité de 30 s avant de le valider. Non modélisé.
9. **Correcteur occupé sur son propre exo** : il doit corriger avant de reprendre (README §6.4). Non modélisé.

### C. Timing et « bon moment »
10. **Déclenchement re-tiré à chaque exo** au lieu d'un état « en attente » jusqu'au prochain exo éligible (README §6).
11. **Pas de tirage reporté** : si personne n'est libre, le prototype compte un « tirage reporté » puis re-tire au prochain exo éligible, avec la probabilité normale. Il n'y a pas d'état « en attente » : le déclenchement peut donc être perdu par un tirage raté. Le README dit « le tirage est reporté, l'élève n'attend pas », ce qui demande cet état.
12. **Pas d'unité de temps réelle** : un tick n'est relié à aucune durée. Impossible de dire « 10 min » ou « 30 s ».
13. **Durée d'échange fixe de 3 ticks**, sans lien avec la réalité (une explication dure 2 à 3 min).
14. **Ordre de traitement fixe** : à chaque tick, les élèves sont parcourus dans l'ordre de leur identifiant. L'élève 1 choisit toujours le premier, ce qui biaise les résultats. Il faut mélanger l'ordre à chaque tick.
15. **Pic de demande non modélisé** : en fin de séance, beaucoup d'élèves finissent en même temps. Le tirage doit gérer plusieurs demandes simultanées.

### D. Niveaux et diversité
16. **Années réparties à parts égales** : à remplacer par une répartition réelle ou paramétrable.
17. **Pas de promo** (README §2) : le tirage inter-promos n'est pas représenté.
18. **Bonus inter-années exprimé en ticks** : mélange deux notions. Il faut un score lisible, par exemple un coefficient sans unité.
19. **Vitesse des élèves identique** : un élève rapide valide plus d'exos. Le prototype ne le reproduit pas.

### E. Équité et métriques
20. **Équité mesurée sur le seul nombre de corrections** : il manque le délai avant le premier échange, et l'écart entre échanges.
21. **Paire répétée non mesurée** : seul le nombre de paires distinctes est affiché. Il faut le nombre maximal de fois qu'une même paire se retrouve.
22. **Plafond garanti non tenu** : à 7 exos, le déclenchement est certain, mais le prototype ne le garantit pas s'il n'y a personne de libre. Le README le prévoit : la file d'attente, puis l'appel du prof.
23. **Pas de mesure de délai** : temps entre déclenchement et échange, temps d'attente d'un correcteur.

### F. Qualité du prototype
24. **Pas de tests automatiques** : les invariants s'affichent, rien ne plante si on casse le code.
25. **Texte du bilan en dur** : « repos : 0 % en dessous de 3 » est écrit à la main, il ne vient pas de `PARAMETRES`.
26. **Pas de scénarios nommés** : impossible de relancer « 30 élèves dont 10 absents » ou « pic en fin de séance » sans éditer le code.

### G. Doublons et données réelles
27. **La même paire revient plusieurs fois** : en 3000 ticks, la paire la plus répétée apparaît 4 à 5 fois (graines 1, 2, 3 et 42). Le README demande « pas les mêmes paires en boucle », mais la pénalité ne dure que 300 ticks (`fenetrePaire`) et rien n'interdit la répétition après.
28. **Un même élève peut être compté deux fois** : ouvert dans deux onglets ou sur deux appareils, il apparaîtrait deux fois parmi les connectés. Le README ne précise pas ce cas. À régler par un dédoublonnage sur l'identifiant de l'élève (voir section 8).
29. **Pas de données réelles** : les élèves sont créés au hasard en mémoire. Dans la vraie app, ils viennent de la base (voir section 8).
30. **Compteur initial toujours à zéro** : un élève qui arrive avec un compteur déjà avancé (session précédente, redoublement) n'est pas modélisé. Son compteur est stocké en base (`ptp_counters`).
31. **Pas de notion de session réelle** : le pool est un seul ensemble, alors qu'il peut y avoir plusieurs sessions ouvertes en parallèle, dans des salles différentes (README §8).

---

## 4. Logique cible (ce qu'il faut construire)

### 4.1 Présence
- Chaque élève a une **probabilité de venir** à la session (ex. 0,9), un **créneau d'arrivée** et un **créneau de départ**.
- Pendant sa présence, il alterne **actif** (valide, tape) et **inactif** (pause, lecture). Les durées suivent des lois simples (ex. exponentielles, réglables).
- Un élève n'est dans **une session à la fois**. Plusieurs sessions peuvent tourner en parallèle, dans des « salles ».

### 4.2 Déclenchement
- Quand le compteur atteint le seuil, l'élève passe en état **« en attente d'un exo éligible »**.
- Au prochain exo éligible, on tire le correcteur.
- Si personne n'est libre : on **garde l'état**, on réessaie à chaque tick, et on compte le retard.
- Si le plafond est atteint sans correcteur : file d'attente et compteur d'« appels prof ».

### 4.3 Choix du correcteur
Candidats : connectés, actifs, non en échange, non bloqués sur leur propre exo, pas soi-même, pas en attente de confirmation.
Score : ancienneté de la dernière correction, bonus inter-années (coefficient), pénalité de paire récente, léger bruit.
Ordre des demandes : **mélangé à chaque tick**.

### 4.4 Confirmation et exécution
- Le correcteur est **confirmé** après un délai de vérification d'activité. Sans activité, il est libéré et un autre est tiré (un nombre maximal de tirages avant appel du prof).
- Il peut **ne pas venir** : avec une probabilité, l'échange part en alerte au bout de N ticks, puis le prof est appelé.
- L'échange dure une durée tirée (ex. 2 à 3 min), pendant laquelle les deux sont occupés.

### 4.5 Unité de temps
**1 tick = 1 minute** (à confirmer). Toutes les durées du modèle s'expriment alors en minutes : vérification 0,5 min, alerte 10 min, échange 2 à 3 min.

---

## 5. Plan de travail

1. **Trancher les hypothèses** (voir section 6) avec le mainteneur, dans l'issue #23.
2. **Modèle de présence** : sessions, arrivées et départs, activité alternée. Tests : un élève absent n'est jamais tiré.
3. **Déclenchement en attente** et tirage reporté. Tests : l'échange a lieu au premier exo éligible après déclenchement.
4. **Ordre mélangé** et **pic de demande** en fin de séance.
5. **Confirmation, alerte et appel prof** (cas limites du README §6).
6. **Métriques** : délai de déclenchement → échange, écart entre échanges, paire maximale, file d'attente, appels prof.
7. **Scénarios nommés** : `normal`, `absences` (30 %), `petit-pool`, `pic-fin-de-seance`, `correcteurs-absents`. Chacun dans un fichier de paramètres.
8. **Tests automatiques** (`node --test`) : invariants (repos ≥ 3, pas d'auto-correction, personne oublié sur une longue simulation, délai borné).
9. **Mettre à jour le README** du dossier et la feuille de route.

---

## 6. Points à trancher (avec toi ou le mainteneur)

- **Unité de temps** : 1 tick = 1 minute ?
- **Présence** : probabilité de venir à la session ? Taille typique d'une séance ? Combien de sessions en parallèle ?
- **Vitesse** : tous les élèves valident à la même vitesse, ou on distingue rapides et lents ?
- **Inter-années** : préférence légère comme dans le README, ou obligatoire quand le pool est grand ?
- **Correcteur qui ne vient pas** : probabilité, et délai avant alerte (le README dit ~10 min, à ajuster).
- **Plafond** : que se passe-t-il quand personne n'est libre au plafond : file d'attente, appel prof, ou rien ?
- **Scénarios de référence** pour le pilote : quelles valeurs sont les plus réalistes ? Ce sont les vraies données du pilote qui trancheront.

---

## 7. Ce qui reste juste

Le prototype actuel vérifie déjà une chose utile : la règle de repos (3 exos minimum entre deux échanges reçus) et l'absence d'auto-correction. Il ne prouve rien d'autre. Il sert de base, mais la logique ci-dessus doit le remplacer en grande partie.

---

## 8. D'où viennent les élèves

Dans la version finale, les élèves viennent de la base de données décrite dans le README (§16). Le simulateur doit pouvoir lire la même structure, sinon on simule un monde qui n'existe pas.

### Tables utiles (README §16)

| Table | Ce qu'on y prend pour le simulateur |
|---|---|
| `users` | Identifiant, prénom, nom, rôle (élève ou prof), promo, date de suppression |
| `cohorts` | Promo et niveau courant (l'année de l'élève) |
| `sessions_pool` | Sessions ouvertes, salle, statut |
| `attendance` | Qui est connecté, dans quelle session, dernière activité (heartbeat) |
| `ptp_counters` | Compteur d'équité de chaque élève (exos validés depuis le dernier PTP) |
| `ptp_exchanges` | Historique des échanges : sert à l'équité et à la règle des paires |

### Requête type : qui est disponible maintenant

Exemple à aligner sur le schéma réel, qui n'existe pas encore dans le dépôt :

```sql
SELECT DISTINCT
  u.id,
  u.prenom,
  u.nom,
  c.niveau_courant AS annee,
  COALESCE(pc.compteur, 0) AS compteur
FROM users u
JOIN cohorts c            ON c.id = u.cohort_id
JOIN attendance a         ON a.user_id = u.id
JOIN sessions_pool s      ON s.id = a.session_id
LEFT JOIN ptp_counters pc ON pc.user_id = u.id
WHERE s.statut = 'ouverte'
  AND u.role = 'eleve'
  AND u.date_suppression IS NULL
  AND a.derniere_activite >= (NOW() - INTERVAL 60 SECOND);  -- heartbeat récent
```

- `DISTINCT` sur `u.id` règle le cas des deux onglets (point 28) : un élève n'apparaît qu'une fois.
- Le filtre sur `derniere_activite` détermine qui est vraiment présent (un heartbeat récent), pas seulement qui a une ligne dans `attendance`.
- Un élève ne doit être que dans une session à la fois : si la base le permet, la contrainte vient de là, sinon le `DISTINCT` tranche.

### Étapes

1. **Aujourd'hui** : pas de base dans le dépôt (le prototype est statique, la base est l'étape 2 de la roadmap). Le simulateur lit un fichier JSON `prototypes/ptp/donnees/eleves.json` qui reprend ces champs, généré à la main ou depuis un export.
2. **Ensuite** : le même fichier est produit par la requête ci-dessus sur la base réelle, pour que la simulation parte de vraies données.
3. **Enfin** : le simulateur peut lire une base SQLite de test, pour rejouer une vraie séance.

### Pourquoi c'est important

Sans cette source, on ne peut pas tester les cas du pilote : un élève absent est une ligne qui n'a pas de heartbeat récent, pas un tirage au hasard. Le simulateur doit donc partir de la même définition de « présent » que l'application.
