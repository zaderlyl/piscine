# Référentiel MMI : ce que le projet couvre

Ce document relie le programme de Piscine au référentiel national du B.U.T. Métiers du multimédia et de l'internet. Il indique ce qui est retenu, ce qui est écarté et pourquoi.

**Source** : PN LP-BUT MMI 2022, annexe 19 (copie consultée sur [iuthaguenau.unistra.fr](https://iuthaguenau.unistra.fr/websites/iuthaguenau/documents/BUT/MMI.pdf)).
Les codes `R1.xx` à `R4.xx` désignent les ressources, rangées par semestre.

Le référentiel ne nomme aucun langage. Les langages du projet (HTML, CSS, JS, PHP, SQL, Bash) sont des choix pédagogiques, pas des obligations nationales.

## Programme actuel du projet

État du programme dans le [README](../README.md), section 3, au moment de la rédaction.

| Module | Ressources | État |
|---|---|---|
| HTML | vanilla | 42 exos prévus, 1 écrit (`04`) |
| Algorithmique | pseudo-code, puis JS | Non commencé. Vue juste avant JS |
| CSS | vanilla, Bootstrap | Non commencé |
| SVG | vanilla, SMIL | Position à confirmer |
| JS | vanilla, Alpine.js, Chart.js, Phaser | Non commencé |
| Bash | vanilla | Non commencé |
| PHP | vanilla | Non commencé |
| MySQL | SQL, phpMyAdmin | Non commencé |
| Git | ligne de commande | Ajouté, non commencé |

Notions ajoutées au README pour combler les écarts avec le référentiel : responsive et WCAG (CSS), DOM, événements, tris, filtres et agrégation (JS), POO, MVC et validation serveur (PHP), MCD, MPD, JSON, CSV et XML (MySQL), gestion de versions (Git).

## Notions retenues

| Ressource | Notions retenues pour le projet |
|---|---|
| R1.11 Intégration | HTML sémantique, CSS, accessibilité |
| R1.12 Développement web | Types, variables, tableaux, objets ; structures de contrôle et fonctions ; bonnes pratiques et MVC (vues) ; débogage |
| R2.13 Développement web | Programmation côté serveur, validation des données côté serveur, échanges client / serveur, MVC (modèles et accès aux données) |
| R2.14 Système d'information | Modélisation MCD puis MPD, SQL, bases relationnelles, formats CSV, XML et JSON |
| R3.12 Développement front | Responsive design, media queries, DOM, événements, conception objet, traitements de tableaux (tris, filtres, agrégation), préprocesseurs CSS, WCAG |
| R4.DWeb-DI.08 Déploiement | Configuration d'un serveur web, scripts, gestion des paquets (npm, composer), gestion de versions avec Git, déploiement |
| Sécurité (R2 et R3) | Notions de chiffrement et de certificats, validation et échappement côté serveur |
| Projet final (SAÉ 3) | Bonnes pratiques de génie logiciel (SOLID, GRASP, design patterns), DevOps, cybersécurité, accessibilité, éco-conception |

## Notions écartées

| Ressource | Raison |
|---|---|
| R3.Crea.13 Gestion de contenus avancée (CMS, back-office, WordPress, types de contenus, champs personnalisés) | Relève de la configuration d'un CMS plus que de la programmation. La partie MVC et POO de cette ressource est couverte par R1.12, R2.13 et R3.12. |
| R3.14 Déploiement de services (wiki, webmail, e-commerce, dimensionnement, noms de domaine) | Administration d'un service, hors programmation. |
| R1.13 Hébergement (architecture matérielle) | Culture générale, hors programmation. |
| Anglais, communication, économie, gestion, culture artistique, production audio et vidéo | Hors programmation. |

## Correspondance avec les modules

| Module du projet | Ressource du référentiel |
|---|---|
| HTML | R1.11 |
| CSS | R1.11 et R3.12 |
| JS | R1.12 et R3.12 |
| PHP | R2.13 |
| MySQL | R2.14 |
| Bash | R4.DWeb-DI.08 (scripts) |
| SVG | R3.12 (graphiques) |
| Git (à créer) | R4.DWeb-DI.08 (gestion de versions) |
| POO et MVC (à créer) | R1.12, R2.13, R3.12 |
| Tris, filtres et agrégation (à créer) | R3.12 |

## Hors périmètre actuel

Python n'apparaît pas dans le référentiel. S'il est enseigné, c'est un choix pédagogique local, à justifier dans le README.
