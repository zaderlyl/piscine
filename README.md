# Piscine MMI : plateforme d'apprentissage par exercices

> Document de cadrage issu du brainstorming. Rien n'est encore codé : ce fichier sert de référence pour reprendre le projet sans rien perdre.
> Les valeurs chiffrées (probabilités, seuils, délais) sont des points de départ, à régler lors d'un pilote.

---

## 1. Concept

Une plateforme web d'**exercices appliqués** pour le programme MMI, inspirée de la piscine de l'école 42 (autonomie, entraide, progression), mais **sans sélection** : l'objectif est un apprentissage doux et autonome.

- **Contenu** : Bash, HTML, CSS, SVG, JS, PHP, MySQL, avec des frameworks et bibliothèques (Bootstrap, Alpine.js, Chart.js, Phaser).
- **Pédagogie** : chaque exo a un cours et un énoncé. La difficulté monte **en profondeur, pas en dureté**. Des paliers et des projets remobilisent les notions précédentes.
- **Entraide** : échanges entre pairs (PTP, *peer-to-peer*) **en présentiel**, où l'élève doit expliquer son travail à l'oral.
- **Public** : les étudiants MMI sur les **3 années** du cursus (le contenu diffère selon l'année). Premier public : ma promo ou celle d'avant.
- **La piscine est l'outil permanent** : il tourne toute l'année et d'une promo à l'autre.

---

## 2. Vocabulaire et structure

```
Piscine (l'outil)
  └─ Promo (un groupe d'élèves inscrits ensemble)
Piscine → Module → Ressource → Exo
          (HTML, JS…) (vanilla, Alpine…) (HTML 01, JS 11…)
```

- **Piscine** : l'outil, toujours ouvert. Elle contient tous les modules, ressources et exos.
- **Promo** : un groupe d'élèves (ex : « MMI 1A 2026-2027 »). Une nouvelle promo = de nouveaux comptes, une progression vierge, les mêmes exos.
- **Session** : une période pendant laquelle l'accès pour travailler est ouvert (voir §8).
- **Module** : un langage ou une grande étape.
- **Ressource** : une déclinaison d'un module (vanilla, framework, bibliothèque).
- **Exo** : un exercice numéroté.
- **Année (niveau)** : chaque module/ressource appartient à une année (A1, A2, A3). Un élève ne voit que le contenu de son niveau.

### Nommage et numérotation

La numérotation est **propre à chaque ressource**. En interne, la ressource de base s'appelle `vanilla`, masquée à l'affichage.

| Ressource | Affichage |
|---|---|
| JS vanilla | `JS 04` |
| JS Alpine | `JS ALPINE 12` |
| JS Phaser | `JS PHASER 03` |

- **Exo 00** : introduction (utilité du langage ou de l'outil + cours). Pas de code. Se valide en le lisant, sans correction par un pair.
- **Exo 01 et suivants** : mini-cours ciblé, puis exo bref. Exemple en JS : « Déclare une variable chaîne qui contient ton prénom ».

---

## 3. Programme (ébauche, 1ʳᵉ année)

| # | Module | Ressources | Remarque |
|---|---|---|---|
| 1 | **HTML** | vanilla | Structure, balises, formulaires |
| 2 | **CSS** | vanilla, Bootstrap | |
| 3 | **SVG** | vanilla, SMIL | Position à confirmer (module à part ou ressource de HTML) |
| 4 | **JS** | vanilla, Alpine.js, Chart.js, Phaser | Le plus gros module |
| 5 | **Bash** | vanilla | Léger, bases uniquement, après JS |
| 6 | **PHP** | vanilla | WordPress reporté |
| 7 | **MySQL** | SQL + phpMyAdmin | Sur SQLite en simulation |

- Le nombre d'exos varie selon la ressource (pas 20 partout).
- Le contenu des années 2 et 3 reste à définir ; il s'écrit au fil de l'eau.
- Ordre des ressources dans un module : vanilla d'abord, puis les autres ; chacune se termine par son palier et son projet.

### Principes d'écriture des exos
- **Toujours du code à produire**, depuis un éditeur vide : pas de page cassée à corriger, pas de code à prédire. Seules exceptions : un fichier imposé par l'exo (ex : `page2.html`), créé vide ; des jeux de données (MySQL) ; des fichiers d'exemple (images, audio, vidéo) fournis par l'app.
- Trois types d'exos : **base** (une notion), **imbriquer** (combiner deux notions, par exemple mettre un `h3` en gras), **reproduire** (un résultat est montré sans le code, à construire de zéro).
- **Tour complet du langage**, y compris les éléments niche ou historiques, signalés comme « historique » dans les cours pour ne pas les présenter comme de bonnes pratiques.
- **Le nombre d'exos vient du contenu, jamais du besoin d'échanges PTP.** Les sujets trop minces sont fusionnés avec un voisin.

### Module HTML : 42 exos (`00` à `41`)
| N° | Exo | PTP | Emmet débloqué |
|---|---|---|---|
| 00 | Intro : à quoi sert HTML | non | |
| 01 | Squelette à la main (avec commentaires et indentation) | non | |
| 02 | `head` : `title`, `meta charset`, `meta description` | non | |
| 03 | Le squelette en un raccourci | non | `!` |
| 04 | Titres `h1` à `h6` | | |
| 05 | Paragraphes, sauts de ligne, ligne horizontale `hr` | | `lorem` |
| 06 | Gras et italique (`strong`, `em`, `b`, `i`) | | |
| 07 | **Titre en gras ou en italique** : qui contient qui ? | | |
| 08 | Autres balises de texte (`u`, `s`, `del`, `ins`, `mark`, `small`, `sub`, `sup`) | | |
| 09 | Balises de sens (`abbr`, `cite`, `q`, `blockquote`, `code`, `pre`, `kbd`, `address`) | | |
| 10 | **Reproduire un modèle** de texte | | |
| 11 | Couleurs : noms, hexadécimal, `rgb` | | |
| 12 | HTML à l'ancienne (`font`, `center`, `marquee`, `bgcolor`, `text`) | | |
| 13 | Listes à puces et numérotées | | `ul>li*3` |
| 14 | Options des listes (`type`, `start`, `reversed`) et listes de définitions | | |
| 15 | **Listes imbriquées** | | |
| 16 | Liens externes (`href`, `target`, `rel`) | | |
| 17 | Ancres dans la page (`id` + `#`) | | |
| 18 | **Liens vers un 2ᵉ espace** (piège sur le nom) | | |
| 19 | `mailto`, `tel`, `download` | non | |
| 20 | Images (`src`, `alt`, tailles) | | |
| 21 | `figure`, `figcaption`, `picture`, `source` | | |
| 22 | **Image cliquable** | | |
| 23 | **Image à zones cliquables** (`map`, `area`) | | |
| 24 | Tableau simple | | `table>tr*3>td*3` |
| 25 | Tableau complet (`caption`, `thead`, `tbody`, `tfoot`, `colgroup`) | | |
| 26 | **Cellules fusionnées** (`colspan`, `rowspan`) | | |
| 27 | `div` et `span` : quand utiliser lequel ? | | |
| 28 | **Structurer la page** (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`) | | |
| 29 | Cadres : `iframe` vers le 2ᵉ espace, et `frameset` (historique) | | |
| 30 | Formulaire (1) : `form`, `input`, `label` | | |
| 31 | Types d'`input` (`number`, `email`, `password`, `date`, `color`, `range`, `checkbox`, `radio`, `file`) | | |
| 32 | `select`, `option`, `optgroup`, `datalist` | | |
| 33 | `textarea`, `button`, `fieldset`, `legend` | | |
| 34 | Validation (`required`, `pattern`, `min`, `max`) | | |
| 35 | **Formulaire complet** | | |
| 36 | Éléments interactifs (`details`, `summary`, `dialog`, `progress`, `meter`) | | |
| 37 | Médias : `audio`, `video`, `canvas` | | |
| 38 | Caractères spéciaux (`&amp;`, `&lt;`, `&copy;`, `&nbsp;`) | non | |
| 39 | Attributs globaux (`id`, `class`, `title`, `lang`, `hidden`, `contenteditable`) | | |
| 40 | **Palier** : une page complète à cahier des charges | non | |
| 41 | **Projet** : page personnelle | non | |

- 34 exos sur 42 sont éligibles au PTP ; le rythme réel est fixé par le compteur d'équité (§6).
- **À tester avant d'écrire** les exos 12 et 29 : les éléments obsolètes (`font`, `center`, `marquee`, `frameset`) peuvent ne plus s'afficher dans l'aperçu ou les navigateurs récents. Si l'un a disparu, l'exo se limite à l'écrire et à expliquer pourquoi, sans test de rendu.
- **Exemples déjà rédigés** : exos `00` à `05` (fichiers `html-vanilla-00.md` à `html-vanilla-05.md`, à ranger dans `html/vanilla/NN.md`). Le code des tests et des solutions y est dans des blocs de code (le script d'import devra lire leur contenu). L'API de test utilisée dans ces fichiers est supposée et non encore construite.

---

## 4. Parcours de l'élève

- **Fil linéaire** : un seul exo courant, un gros bouton **« Continuer »**. À la fin d'un module on passe automatiquement au suivant. HTML doit être fini avant JS, etc.
- La **carte du chemin** (fait / en cours / à venir) est visible, sans saut possible.
- **Pas de limite de vitesse** : chacun avance à son rythme. Un élève qui rattrape le contenu écrit voit un écran « Suite en préparation » (et le prof est prévenu).
- **Onglet Historique** : chronologie des exos validés, qu'on peut **refaire en révision** sans impact sur la progression.
- **Hors session** : consultation seule (progression, cours), pas de code.
- **Passage à l'année suivante** : le prof fait passer la promo au niveau supérieur, d'un clic.

### États d'un exo
Verrouillé · Disponible · En cours · Gelé / en échange PTP · Validé · À refaire (avec les conseils reçus).

### Vue « où j'ai eu juste ou faux » (en réflexion)
À stocker dès maintenant, à afficher plus tard : cases cochées par le correcteur, tentatives et avis négatifs par exo, **tags de notions** sur chaque exo.

---

## 5. Les types d'évaluation

| Type | Qui évalue | Quand | Sur quoi |
|---|---|---|---|
| **Exo** | Tests auto, avec parfois un échange PTP | Immédiat | Utiliser une notion précise |
| **Palier** (partie A) | Tests automatiques | Immédiat | Le résultat, peu importe la méthode |
| **Projet** (partie B) | Les profs | Différé | Code, fonctionnalités, pertinence |

### Exo
- Impose un outil ou une notion (« utilise une boucle `for` ») : les tests peuvent vérifier la **méthode** en plus du résultat.
- **Éligible à un échange PTP par défaut** (voir §6), sauf ceux marqués `ptp: non` (intro, tout premiers exos de squelette, palier, projet, et quelques sujets où il n'y a presque rien à expliquer).

### Palier et projet : « palier en deux temps »
À la fin d'une ressource ou d'un module :
- **Partie A, palier** : cahier des charges précis, testé automatiquement, **essais illimités**. Seul le **résultat** compte ; les tests ne regardent jamais le code source. L'énoncé impose des repères (ex : « le bouton a l'id `valider` »). Messages d'échec **comportementaux** (« après le clic, le compteur devrait afficher 1 »). Un critère non testable automatiquement va dans le projet.
- **Partie B, projet** : énoncé plus libre, production personnelle. L'élève clique sur **« Rendre mon projet »**.
  - **Le rendu est obligatoire pour avancer** ; il débloque la suite **immédiatement**.
  - Un **minimum automatique** au rendu (tests de la partie A passés, fichiers réellement modifiés) évite le clic à vide.
  - Tous les fichiers de l'éditeur sont **figés au clic**. Les profs les voient avec l'aperçu.
  - L'évaluation est **différée** et **sans effet sur la progression** : trois axes (code, fonctionnalités, pertinence) avec un commentaire par axe. Le format de la note (chiffres ou niveaux) est laissé aux profs.
  - Plusieurs profs : file commune où chacun prend un projet (marqué « en cours »).
  - Pas de détection automatique de copie.

---

## 6. Échanges PTP (peer-to-peer) en présentiel

Un échange PTP n'est **pas demandé** par l'élève : c'est l'app qui le déclenche, de façon **aléatoire mais équitable**, quand l'élève termine un exo éligible. Le correcteur donne un **avis extérieur**, pas un verdict : le but est l'entraide.

### Déclenchement équitable
Un compteur par élève (**exos validés** depuis son dernier échange, éligibles ou non) pilote la probabilité. Valeurs **indicatives**, à régler au pilote (visée : un échange garanti tous les 6 à 8 exos validés) :

| Exos validés depuis le dernier PTP | Chance d'échange |
|---|---|
| 0 à 2 | 0 % (repos : jamais 3 échanges d'affilée) |
| 3 | 10 % |
| 4 | 20 % |
| 5 | 35 % |
| 6 | 60 % |
| 7 | 100 % (plafond garanti) |

- Le compteur est lié à **l'élève**, pas à l'exo : tout le monde explique à peu près autant, quel que soit son niveau.
- Quand le compteur « déclenche », l'échange a lieu **au prochain exo éligible** : le rythme ne dépend donc pas du nombre d'exos éligibles, qui n'a aucune raison d'être gonflé.
- **Éligibilité inversée** : tout exo est éligible par défaut ; seuls ceux marqués `ptp: non` ne le sont pas. Le champ peut aussi valoir `simple` (explication de 2 à 3 minutes, grille allégée) ou `riche` (échange plus long) ; à défaut, `simple`.
- L'élève ne sait pas à l'avance si l'exo sera corrigé : il se prépare à expliquer chaque exo éligible.
- Pas de tirage s'il n'y a personne de disponible (le tirage est reporté, l'élève n'attend pas).
- Chaque échange occupe deux personnes quelques minutes : un rythme trop élevé rendrait la piscine pénible, d'où le réglage au pilote.
- Piste ultérieure : léger bonus de rattrapage pour les élèves ayant eu moins d'échanges que la moyenne.

### Tirage du correcteur
- Parmi **tous les élèves connectés dans une session ouverte, toutes sessions et toutes promos confondues** (PTP **inter-promos** : un 3ᵉ année peut corriger un 1ʳᵉ année, et inversement).
- Le correcteur **n'a pas besoin d'avoir fait l'exo** : c'est l'explication orale qui compte.
- Critère principal : équité (celui qui a corrigé le moins récemment, jamais quelqu'un en échange ou en attente, pas les mêmes paires en boucle).
- **Préférence légère** pour un correcteur d'une **autre année**, à équité comparable ; ignorée si le pool est petit.
- Piste ultérieure : léger coup de pouce pour un correcteur de la même salle.

### Déroulé
1. L'élève termine l'exo, le tirage décide qu'il y a échange : son **écran est gelé** (code figé, copie enregistrée) avec « Recherche d'un correcteur… », un pense-bête pour préparer son explication et un bouton « Annuler ».
2. Un correcteur est tiré et **confirmé par une vérification d'activité de 30 s**. Sans activité, il est libéré sans conséquence et un autre est tiré.
3. Chacun voit **le nom, le prénom, la salle et l'année** de l'autre (« Marie Dupont, 3ᵉ année, salle A102 »). Si la salle n'est pas renseignée : « salle non précisée ».
4. Le correcteur est **bloqué sur son propre exo** tant qu'il n'a pas corrigé. Son brouillon est conservé.
5. Un **code à 6 chiffres** s'affiche chez le correcteur et se saisit sur le PC de l'élève corrigé (valable 5 min, usage unique, 3 à 5 essais, lié à cet échange).
6. L'élève **explique à l'oral** ; le correcteur lit l'énoncé et le code, coche la grille (générée à partir des consignes) et donne son **avis**. Le résultat des tests auto est affiché quand il existe.
7. Avis positif : l'exo suivant se débloque. Avis négatif : l'élève refait l'exo avec les conseils reçus.

### Avis possibles
« Ça me paraît bon » · « Je pense qu'il y a une erreur » · « Je ne suis pas sûr » (droit au doute), avec un commentaire libre. L'écran rappelle au correcteur : « Ton rôle est de comprendre, pas de juger ». Le vocabulaire exact sera revu plus tard.

### Cas limites
- Correcteur confirmé mais qui ne se déplace pas : au bout de ~10 min (à ajuster selon la distance entre salles), alerte au prof.
- Personne de disponible ou aucun correcteur confirmé après 2 ou 3 tirages : file d'attente, puis appel du prof.
- Fin de session pendant un échange : délai de grâce pour le terminer.
- Plantage pendant le gel : l'élève retrouve l'écran gelé sur la copie enregistrée.

### Double vérification
Tests automatiques en arrière-plan, second correcteur ou prof sur échantillon. En cas d'erreur de validation, **feedback explicite aux deux élèves** (erreur localisée, concept en cause, piste), jamais comme une sanction. Pas de score de fiabilité des correcteurs.

---

## 7. Signalement d'une correction

1. L'élève signale la correction avec un court motif.
2. **2 à 3 pairs ayant déjà validé l'exo** reçoivent une **notification volontaire** (aucune obligation ni blocage, pour ne pas surcharger les élèves de tête). Le premier qui accepte prend la discussion.
3. Le tirage évite les pairs sollicités récemment.
4. Si personne n'accepte (~5 min) ou si personne n'a fait l'exo : **le prof est appelé**.
5. Le prof explique à l'élève et **corrige l'exo si besoin**.

- Le signalement n'annule rien tout seul : l'avis reste en attente, l'issue décide.
- Une modification d'exo **ne rétroagit pas** sur ceux qui ont déjà validé. Si l'erreur venait de l'énoncé ou des tests, l'élève lésé est validé manuellement (seul cas où un prof touche à la progression).
- Les exos sont **versionnés** ; chaque tentative garde la version sur laquelle elle a été faite.
- Les profs voient les signalements par élève pour repérer d'éventuels abus.

### Aide ordinaire (sans lien avec les échanges PTP)
- **Un seul indice** par exo, écrit dans le fichier (`## Indice`), vague et sans solution.
- Au-delà, **pas de bouton dans l'app** : l'élève demande à ses voisins, à l'oral.
- Le cours, la documentation et les messages d'échec des tests restent disponibles.

---

## 8. Sessions, présence et rôle des profs

### Sessions
- Une **session** est une période pendant laquelle l'accès pour travailler est ouvert (début, fin, prolongeable ou closable plus tôt). Elle porte une **salle** (champ informatif).
- **Plusieurs sessions peuvent être ouvertes en même temps**, dans des salles différentes ; le tirage des correcteurs puise dans toutes.
- Un élève n'est présent que dans **une session à la fois**.
- La progression est liée à l'**élève**, pas à la session.
- Présence = être connecté pendant une session ouverte (+ option de restriction par IP du réseau de l'école). Dates stockées en UTC, affichées en Europe/Paris.
- Salle ou poste : le numéro de poste est optionnel ; à défaut, le correcteur cherche à l'oral.

### Les profs
- **Gèrent** : les sessions, les promos, les comptes, la publication des exos (écrits par moi au début), le passage d'année, la prolongation d'un compte (redoublement).
- **Suivent** (tableau de bord sur toutes les sessions, avec filtre) : connectés, échanges en cours et ceux qui traînent, file d'attente, élèves bloqués depuis longtemps sur un exo, élèves très en retard, projets en attente d'évaluation.
- **Interviennent** (blocages techniques uniquement) : libérer ou réassigner un correcteur, prendre la correction eux-mêmes, répondre aux signalements.
- **Relisent** des corrections (double vérification) et **évaluent** les projets.
- **Consultent** les statistiques par élève et par exo (taux de réussite, tentatives, temps actif).
- **Ne voient pas** les brouillons en direct et **ne valident pas** à la place de l'élève.
- La motivation (jalons, badges, compteurs) est **laissée aux profs** : rien de décidé ici.

---

## 9. Comportement de l'écran : gel, chrono, brouillon

### Gel de l'écran
L'écran se **gèle** (code non modifiable, message explicatif) quand le comportement ne semble pas celui d'un humain qui travaille :
- la page perd le focus (changement d'onglet, alt-tab, fenêtre réduite) ;
- la souris sort de la page et n'y revient pas ;
- un gros bloc de code apparaît d'un coup (collage ou saisie automatique) ;
- de la saisie sans événements souris/clavier réels.

Le gel n'est **pas une sanction** : l'élève clique sur **« Je suis là »** (un vrai clic) pour le lever. Le gel s'applique aussi pendant l'attente et la durée d'un échange PTP.

Limites assumées : une page web ne peut **pas** détecter une IA lancée sur un autre appareil ou une autre application ; elle ne fait que repérer une sortie de la page. La vraie garantie reste l'**explication orale**. Prévoir la tolérance pour l'accessibilité (dictée vocale, lecteur d'écran, clavier seul) et régler les seuils au pilote.

### Chrono
- Il n'y a **aucune limite de temps** pour l'élève.
- Un chrono mesure le **temps actif** par exo (pause pendant le gel) ; c'est une statistique pour les profs (`duree_estimee`, temps passé, nombre de gels).

### Brouillon
- **Une seule version**, enregistrée en continu quelques secondes après la dernière frappe, en base (copie locale `localStorage` en filet).
- Retrouvable sur n'importe quel poste ; un **seul appareil actif** à la fois (le dernier connecté prend la main, l'ancien passe en lecture seule).
- **Pas d'historique de versions** ni de bouton « Revenir au départ » : seul le Ctrl/Cmd+Z de l'éditeur, tant que la page reste ouverte.
- Des **copies figées** existent en interne (échange PTP, rendu de projet, tentatives de palier), sans accès pour l'élève.

---

## 10. Tests automatiques

- **JavaScript libre**, exécutés **dans le navigateur** sur l'aperçu en `iframe sandbox`.
- Petite **API de test** : `click`, `type`, `$`, `$$`, `style`, `wait`, `assert(condition, message)` ; le message de l'`assert` est montré à l'élève.
- `source(fichier)` (lecture du code) est **réservé aux exos**, refusé sur les paliers.
- **Timeout** de quelques secondes contre les boucles infinies (Worker ou iframe séparé).
- Chaque exo a une **solution de référence** qui doit passer ses tests avant publication.
- Les tests n'ont accès qu'aux panneaux déclarés par l'exo, et pas au reste de l'app.
- Le navigateur envoie au serveur le résultat des tests ; les rejouer côté serveur reste possible plus tard.
- **Phaser** : on ne teste pas les pixels, on expose l'état du jeu (score, position).
- **Bash** : faux terminal avec système de fichiers virtuel ; les tests lisent l'état de ce système.
- Limite assumée : un élève motivé pourrait contourner les tests côté navigateur ; risque faible ici.

---

## 11. Écriture des exos

**Un fichier Markdown par exo**, rangé selon la hiérarchie :

```
piscine/
  js/
    vanilla/
      00.md
      01.md
      04.md
    alpine/
      12.md
  html/
    vanilla/
      ...
```

### Modèle d'un exo

```markdown
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
assert(...)

## Solution: script.js
const age = 20;
if (age >= 18) console.log("majeur");
```

- **Méthode** : contraintes d'outil (exos seulement). **Résultat** : ce qui doit être obtenu (exos et paliers).
- **Pas de section `## Départ`** : l'élève part toujours d'un éditeur vide (un fichier imposé par l'exo existe, mais vide). L'exo 00 contient seulement le cours.
- `## Solution` n'est **jamais envoyée** aux élèves.
- **À l'import** : validation de la structure, versionnage par hash, vérification que les tests passent sur la solution (sinon refus).
- Écrire au fil de l'eau, à partir d'un modèle vide ; **calibrer l'API de test avant la rédaction en masse**.

---

## 12. Éditeur, exécution et documentation

### Éditeur multi-fichiers virtuel
- Tout vit **dans l'app** (base de données), sans vrai système de fichiers.
- L'exo définit ses « espaces » (`index.html`, `style.css`, `script.js`, `index.php`, `db.php`…) ; l'élève peut en créer d'autres si l'exo l'autorise.
- Les liens fonctionnent comme dans un vrai projet (`<link href="style.css">`, `include 'db.php'`) ; l'app les résout vers les espaces virtuels.
- Pistes : CodeMirror 6 ou Monaco, `iframe sandbox` + Blob URLs pour l'aperçu.

### Emmet (raccourcis de saisie)
- Emmet (`!`, `lorem`, `ul>li*3`…) fait partie de l'éditeur de l'app, pour que l'élève s'en serve dans **tous** les exos suivants (y compris en CSS).
- **Activation progressive, raccourci par raccourci**, selon la progression : désactivé au départ, chaque raccourci se débloque à la validation de l'exo qui l'enseigne (`!` en `HTML 03`, `lorem` en `HTML 05`, `ul>li*3` en `HTML 13`, `table>tr*3>td*3` en `HTML 24`). L'état se déduit de la progression ; un exo peut forcer `emmet: false`.
- Pendant une révision d'un ancien exo, Emmet reste actif s'il a déjà été débloqué.
- Le raccourci s'enseigne **après** que l'élève a écrit la chose à la main, pour qu'il retienne la structure.
- **À valider par prototype** : un module Emmet pour l'éditeur choisi (CodeMirror 6 ou Monaco), et la possibilité de le limiter à une liste d'abréviations (sinon liste maison). Repli : Emmet activé en entier après `HTML 03`, et les raccourcis suivants présentés dans les cours pour VS Code.

### PHP
- **php-wasm** (PHP en WebAssembly) dans le navigateur : aucun risque pour le serveur. **À valider par prototype.**
- Limites : plus lent, quelques Mo au premier chargement, simulation de la couche HTTP (`$_SESSION`, `POST`, redirections).

### MySQL
- Le cours utilise déjà **SQLite** et **phpMyAdmin** : on s'appuie dessus.
- **SQLite** en base propre à l'élève, partagée entre son code PHP (PDO) et l'interface.
- Un **phpMyAdmin simplifié** (simulation de l'interface, pas du langage) : tables, Structure, Afficher, SQL, Insérer, création de table. Le SQL et le PHP restent du vrai code.
- Une base de départ peut être fournie par l'exo. Les tests JS peuvent lire l'état de la base.
- Signaler dans les cours les différences SQLite/MySQL. Chantier tardif dans la roadmap.

### WordPress
**Reporté** (éventuelle ressource séparée plus tard).

### Documentation externe
- **Autorisée** pendant un exo (MDN, docs officielles).
- Beaucoup de sites refusent d'être affichés dans un panneau d'une autre page : **à tester site par site**. Secours : fiches maison courtes (réutilisant les `## Cours`), ou un bouton « J'ouvre la doc » qui suspend la détection de gel quelques minutes.

---

## 13. Affichage par panneaux

L'écran change selon l'exo ; les panneaux sont déclarés dans l'en-tête (`panneaux: [...]`), avec une disposition par défaut selon le module.

| Type d'exo | Panneaux |
|---|---|
| HTML / CSS / JS / SVG | Énoncé, éditeur, aperçu |
| PHP | Énoncé, éditeur, aperçu |
| PHP + base | Énoncé, éditeur, aperçu, tables |
| MySQL pur | Énoncé, tables (grand), onglet SQL |
| Bash | Énoncé, terminal |
| Phaser | Énoncé, éditeur, canvas |
| Chart.js | Énoncé, éditeur, aperçu du graphique |
| Exo 00 | Cours seul, pleine page |

Panneaux redimensionnables et repliables ; documentation dans un panneau si possible. Pendant un échange PTP, l'écran du corrigé affiche la grille et le code ; chez le correcteur, l'écran de blocage.

---

## 14. Comptes, promos et données

### Inscription (« version C »)
1. L'élève saisit son **adresse mail universitaire**, son **prénom**, son **nom** et un **mot de passe**.
2. L'app vérifie le **suffixe** (à confirmer : le domaine étudiant de l'Université de Montpellier est peut-être `etu.umontpellier.fr`, à vérifier sur une vraie adresse) et envoie un **lien de confirmation**.
3. L'élève clique sur le lien et saisit le **code de promo** donné en salle.
4. Son compte est actif, rattaché à la promo.

- Mot de passe oublié : lien envoyé par mail, durée de validité courte.
- Les profs peuvent **désactiver un compte** et changer un code de promo.
- Pas de date de naissance ni de donnée inutile.
- Il faut un service d'envoi de mails (critère d'hébergement).

### Durée de vie des données
- Un compte vit **3 ans** (la durée du cursus), puis est supprimé automatiquement.
- **Redoublement** : le prof **prolonge le compte d'un an** en un clic ; la progression est conservée. Pas de sauvegarde annuelle.
- À la fin : suppression des comptes, historiques, brouillons, avis, corrections et notes de projets. **Un message de prévenance** part quelques semaines avant, avec la possibilité de **télécharger ses projets**.
- **Conservé** : uniquement des **statistiques anonymes par promo et par exo** (totaux et moyennes : taille de la promo, taux de réussite, tentatives, temps actif, exos les plus signalés), sans donnée nominative ni individuelle ; éviter toute statistique permettant de retrouver une personne.
- Un élève peut demander la **suppression anticipée** de son compte (abandon, réorientation).
- Informer clairement les élèves à l'inscription (noms visibles par leurs correcteurs, durée de conservation, droit de suppression).

---

## 15. Outils et méthodes

### Interface
| Outil | Usage |
|---|---|
| HTML / CSS / JS | Base de l'application |
| Bootstrap | Mise en page et composants |
| Alpine.js | Interactivité légère (heartbeat, panneaux, notifications) |
| CodeMirror 6 (ou Monaco) | Éditeur de code multi-onglets |
| `iframe sandbox` + Blob URLs | Aperçu isolé du code de l'élève |
| Web Workers | Exécuter les tests sans figer la page, avec timeout |
| Un parseur Markdown | Afficher cours et énoncés |
| Chart.js | Statistiques des profs |

### Serveur
| Outil | Usage |
|---|---|
| PHP + PDO, MySQL | Back-end et base de données |
| `password_hash` / sessions PHP | Authentification et rôles |
| Envoi de mails (SMTP ou service dédié) | Confirmation d'inscription, mot de passe oublié, prévenance |
| Parseur d'en-tête YAML + parseur Markdown | Script d'import des exos |
| Polling, puis WebSocket ou SSE si besoin | Notifications (correcteur tiré, signalements) |

### Exécution du code des élèves
| Outil | Usage | Statut |
|---|---|---|
| php-wasm | PHP dans le navigateur | **À valider par prototype** |
| SQLite en WebAssembly (ex : sql.js) | Base SQLite côté navigateur | **À valider par prototype** |
| Faux terminal Bash (système de fichiers virtuel) | Exos Bash | À construire ou trouver ; à valider |
| phpMyAdmin simplifié (maison) | Gestion de tables | À construire, tard |

### Travail
Git (app et exos), VS Code, environnement local PHP/MySQL (XAMPP, Laragon ou Docker).

### Hébergement et déploiement
| Outil | Rôle |
|---|---|
| **Dépôt GitHub** | Code de l'app et exos en Markdown, avec historique Git |
| **GitHub Pages** | Travail et construction : vitrine et **prototypes qui tournent dans le navigateur** (php-wasm, SQLite côté navigateur, faux terminal Bash, éditeur + aperçu, tests JS). Fichiers statiques uniquement : ni PHP ni MySQL |
| **Serveur de l'IUT** | Hébergement de la **vraie application** : PHP, MySQL (administré via phpMyAdmin), comptes, tirage PTP, mails |
| **Environnement local** | Développement de la partie PHP/MySQL, puis déploiement sur le serveur de l'IUT (SFTP ou `git pull`, selon ce qu'il autorise) |

- Le serveur de l'IUT est accessible **de n'importe où** (pas seulement depuis le réseau de l'école).
- Les pages GitHub Pages sont publiques par défaut : ne pas y publier les `## Solution` des exos (dépôt privé, ou solutions exclues du dépôt public).
- **À vérifier auprès de l'IUT** : envoi de mails depuis le serveur (indispensable pour la confirmation d'inscription ; sinon prévoir une validation par un prof), accord de l'établissement pour héberger l'outil et ses règles sur les données d'élèves, durée de l'hébergement après mes études et responsable de la maintenance (« on verra »).

### Méthodes
- **Pédagogiques** : peer-learning et explication orale ; difficulté en profondeur ; exo = notion imposée, palier = résultat libre, projet = production personnelle ; feedback explicite et non punitif ; messages d'échec comportementaux.
- **Fonctionnelles** : déclenchement PTP équitable (repos, probabilité croissante, plafond) ; détection d'activité avant de bloquer un correcteur ; code à usage unique ; notifications volontaires pour les recours ; sessions simultanées et PTP inter-promos ; versionnage des exos par hash.
- **Techniques** : sandbox pour tout code d'élève ; tests JS libres avec timeout ; solution de référence à l'import ; heartbeat de présence + activité réelle ; dates en UTC ; éditeur virtuel.
- **De travail** : prototypes techniques d'abord ; développement incrémental (un module complet avant la suite) ; écriture des exos au fil de l'eau.

---

## 16. Données principales (pistes)

| Table | Rôle |
|---|---|
| `users` | Comptes (prénom, nom, mail, rôle, promo, date de suppression) |
| `cohorts` | Promos (nom, année de départ, code de promo, niveau courant) |
| `sessions_pool` | Sessions (début, fin, salle, statut) |
| `attendance` | Présence (connexion, dernière activité) |
| `modules`, `resources`, `exercises` | Hiérarchie ; un exo = (module, ressource, numéro), plus année, version et hash |
| `progress` | Exo courant et exos validés |
| `drafts` | Brouillon courant (une seule version par exo et par élève) |
| `submissions` | Tentatives de palier et copies figées (échange PTP, rendu de projet) |
| `ptp_counters` | Compteur d'équité par élève |
| `ptp_exchanges`, `ptp_checks` | Échanges, avis, cases cochées |
| `reports` | Signalements |
| `project_reviews` | Évaluations des projets par les profs |
| `notions` | Tags de notions par exo |
| `stats_cohort_exo` | Statistiques anonymes par promo et par exo |

---

## 17. Reste à trancher

- Position de **SVG** (module à part ou ressource de HTML).
- Contenu des **années 2 et 3**.
- Vrai **suffixe** des adresses étudiantes.
- Vocabulaire exact des **avis** du correcteur.
- Format de la **note de projet** (laissé aux profs) et motivation (jalons, badges : laissés aux profs).
- **Retours d'expérience** : moyen de signaler un bug ou une idée.
- **Hébergement** : choix fait (GitHub pour le travail, serveur de l'IUT pour l'app). Reste à confirmer : envoi de mails, accord de l'IUT, durée et maintenance, sauvegardes de la base.
- **Nom du projet** et identité visuelle. Pistes évoquées : Plongeoir, Nage libre, Bassin, Crawl, Plouf (disponibilité à vérifier).
- **Emmet** : liste d'abréviations limitable ou non (à prototyper).
- **Éléments HTML obsolètes** : lesquels s'affichent encore dans l'aperçu.
- Vue « où j'ai eu juste ou faux ».
- **Pilote** : valeurs des probabilités, seuils du gel, préférence inter-années.

---

## 18. Roadmap suggérée (à affiner)

1. **Prototypes techniques** (sur GitHub Pages, tout tourne dans le navigateur) : éditeur multi-fichiers + aperçu + tests JS, Emmet limité, éléments HTML obsolètes, php-wasm, SQLite côté navigateur, doc dans un panneau, faux terminal Bash.
1. bis. **Simulateur de tirage PTP** (sans interface, avec des élèves fictifs) pour régler probabilités, repos et plafond.
2. Connexion, inscription (mail + code de promo), rôles, promos, sessions.
3. Import des exos Markdown, hiérarchie et fil linéaire.
4. Éditeur multi-fichiers + aperçu, brouillon automatique, avec le **module HTML complet** (exo 00 à palier et projet).
5. API de tests JS et validation automatique.
6. Gel de l'écran, « Je suis là », chrono en temps actif.
7. Échanges PTP (déclenchement équitable, tirage, activité, code à 6 chiffres, avis).
8. Signalements, double vérification, tableau de bord des profs.
9. Modules CSS, SVG, puis JS et ses ressources.
10. Bash, PHP, puis MySQL (SQLite + phpMyAdmin simplifié).
11. Projets (rendu, évaluation), années 2 et 3, suppression automatique des comptes.
12. **Pilote** avec des volontaires pour régler les valeurs (voir §19).

---

## 19. Pilote et simulation

### Deux outils complémentaires
- **Simulation (élèves fictifs)** : tirage équitable (jamais trois échanges d'affilée, personne oublié, effet de la préférence inter-années, petit pool, sessions simultanées), cas limites (correcteur qui ne répond pas, deux demandes en même temps, fermeture de session, plantage), charge (présence, notifications pour 30 à 100 connectés), statistiques anonymes. Peut vivre dans un simple fichier JavaScript.
- **Vrais volontaires** : seuls eux révèlent les faux gels, la clarté des énoncés et des tests, le ressenti de l'explication orale (surtout entre années), les temps d'attente réels et les usages inattendus.

### Pilote réel
- **10 à 15 volontaires** de plusieurs promos (il faut au moins deux années différentes pour tester le PTP inter-années, et au moins 6 à 8 personnes pour que le tirage ait du choix).
- **Un seul module complet** (HTML), assez long pour déclencher plusieurs échanges par personne.
- **Une ou deux sessions en salle**, avec au moins une où presque tout le monde est connecté en même temps.
- Mêmes règles que la vraie version (mail universitaire, code de promo, noms visibles) ; prévenir les volontaires de ce qui est visible.
- **Retours** : court questionnaire après la session et une dizaine de minutes à l'oral.
- **À observer** : attente avant l'arrivée d'un correcteur, gels et faux positifs, échanges qui se passent mal ou traînent, énoncés ou tests qui ont posé problème, bugs.
- **À régler ensuite** : probabilités et plafond, seuils du gel, délais, préférence inter-années.
- Prévoir une aide pendant la session (ou une seule salle) pour ne pas être à la fois développeur, prof et observateur.
- Faire le pilote **avant** d'écrire tous les exos : il peut montrer que le format ne tient pas.

### Ordre
1. Simulateur de tirage. 2. Module HTML et éditeur. 3. Volontaires, avec des valeurs déjà pré-réglées.
