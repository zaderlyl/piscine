# Idées d'amélioration de l'interface PTP

Liste d'idées pour la démo (`index.html`) et ses règles. **Rien de tout cela n'est fait** : c'est un réservoir pour une prochaine étape, classé de la plus utile à la moins urgente.

## Les 5 plus utiles

1. **Prévenir le correcteur qu'il est tiré.** Aujourd'hui il n'a que 30 secondes pour cliquer « Je suis là ». S'il est dans un autre onglet ou une autre fenêtre, il ne voit rien. Un son, un titre d'onglet qui clignote (« ⚠ On a besoin de toi ») ou une notification du navigateur règleraient ça. C'est sans doute le point le plus important pour un vrai usage en salle.
2. **Mesurer l'activité réelle, pas seulement la présence.** Aujourd'hui, un onglet ouvert compte comme « présent », même si l'élève est parti manger. Le document de conception prévoit de regarder la frappe et les clics. Sans ça, des correcteurs absents sont tirés, attendent 30 secondes, puis sont libérés : c'est lent et frustrant pour l'élève.
3. **Un bouton « Je ne peux pas » pour le correcteur.** Pour l'instant, refuser veut dire ne rien faire pendant 30 secondes. Un refus explicite relancerait le tirage tout de suite. Il faudrait le limiter (par exemple 2 refus par session) pour que ça ne devienne pas une façon d'éviter de corriger.
4. **Des élèves simulés dans la démo.** Un bouton « ajouter 10 élèves qui jouent seuls » permettrait de voir l'équité sur 100 échanges en une minute, sans ouvrir 10 onglets. La simulation en ligne de commande (`simuler.mjs`) existe déjà : il s'agirait de la brancher sur la page.
5. **Une page de réglages** pour les poids (bonus de classe, pénalité de paire, plafond, délais), avec export en fichier. Aujourd'hui il faut modifier le code.

## Côté expérience

- **Message « pourquoi personne n'est proposé »** affiché directement dans la page (aucun connecté, tous occupés, autre classe, présence trop ancienne).
- **Gel réel de l'écran** de l'élève pendant la recherche (README du projet §9). Pour l'instant, il peut encore utiliser le reste de la page.
- **Compte à rebours en barre** plutôt qu'en secondes, et un historique « mes échanges » par élève.
- **Affichage téléphone** (utile si des élèves consultent leur code sur mobile).

## Côté règles du tirage

- **Avancement en départage seulement** (option 2 de CONCEPTION.md §5.4) : activable par un réglage.
- **Exos marqués `ptp: non`, `simple` ou `riche`** : la logique sait déjà ignorer un exo non éligible (paramètre `eligible` de `validerExo`), mais la démo considère tous les exos éligibles et ne lit pas encore cet en-tête.
- **Distance entre salles** : préférer une salle proche (le README du projet en parle comme piste ultérieure).
- **Plafond par heure de présence** plutôt que par session : un élève qui reste 4 heures peut corriger plus. La simulation montre aussi que le plafond actuel tombe dès que plus personne n'est dessous, donc il agit très peu (voir README.md).
- **Compteur qui survit à la session** (redoublement, absence) : prévu côté base, absent de la démo.

## Côté suite du projet

- **Relier aux vrais exos et à leurs vrais tests** : le bouton « J'ai terminé l'exo » simule la réussite. Il faudra appeler le même mécanisme que la progression (`marquerReussi`, PR #49).
- **Passer au serveur PHP et MySQL**, avec les mêmes cas de test dans les deux langages pour que la logique ne diverge pas.
- **Une vérification automatique** (action GitHub) qui lance les tests du dossier à chaque PR.
