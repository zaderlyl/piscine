# Serveur et comptes

Ce document consigne la réflexion sur la partie serveur (comptes, progression en base). C'est une **proposition à discuter** : tout ce qui est marqué « à trancher » reste ouvert. Le cadrage de départ est dans le [README](../README.md), sections 14 et 15.

## Pourquoi

Aujourd'hui, tout est dans le navigateur d'un seul poste : la progression et le brouillon vivent dans le `localStorage`. Pour que l'élève retrouve son travail ailleurs, et pour tout ce qui suit (échanges PTP, tableau de bord des profs, chrono), il faut un serveur et des comptes.

## Décisions prises

- **Premier morceau** : compte + progression en base. La progression de l'issue #30 devient la première donnée stockée côté serveur.
- **Pile** : PHP, MySQL, sessions PHP (README section 15). Le serveur de l'IUT héberge la vraie application.
- **Un seul serveur pour le front et l'API** : le HTML et le JS sont servis par le même serveur PHP que l'API. Pas de CORS, les cookies de session fonctionnent normalement. GitHub Pages ne sert plus qu'à la vitrine et aux prototypes.
- **Inscription de test** : l'élève saisit son mail, son prénom, son nom, un mot de passe et un **code d'inscription universel**. La confirmation par mail et le code de promo viendront plus tard.
- **Le code universel n'est pas dans le code versionné** : il est dans un fichier de configuration local, `config.local.php`, ignoré par Git, avec un fichier d'exemple `config.exemple.php` versionné dans le dépôt
- **Hébergement confirmé** : le serveur de l'IUT, avec phpMyAdmin pour administrer la base. Les versions de PHP et MySQL sont des versions standard récentes. Les fichiers sont déposés avec FileZilla (SFTP), sans `git pull` sur le serveur.
- **Développement en local** : PHP et MySQL sur chaque poste, une base créée par un script SQL versionné. Le serveur de l'IUT sert pour la mise en ligne, pas pour développer.
- **Filet local** : le `localStorage` reste en secours. Quand l'élève est connecté, la base fait foi ; sans serveur, l'app continue de marcher en local. Au premier login, la progression locale est envoyée au serveur.
- **Comptes profs** : le code d'inscription ne crée que des comptes `eleve`. Un compte `prof` est créé à la main en base (phpMyAdmin).

## À trancher

- **Format de l'API** : fichiers PHP simples qui reçoivent et renvoient du JSON, ou un framework. À discuter en équipe.
- **Répartition du travail** : après la réflexion.
- **Réponses de l'IUT restantes** : envoi de mails depuis le serveur, règles sur les données d'élèves, maintenance.

## Schéma de base (première proposition)

```
users
  id, email (unique), prenom, nom, mot_de_passe_hash,
  role ('eleve' ou 'prof'), actif, cree_le, derniere_connexion

progression
  user_id, exo (par exemple « html/vanilla/04 »), reussi, date_reussite
  clé primaire : (user_id, exo)
```

Les promos, les brouillons et le chrono viendront dans leurs propres tables, quand on les développera. La durée de vie des données (README §14 : suppression des comptes après 3 ans, prolongation d'un an, suppression anticipée) demandera aussi une date d'expiration et un lien avec la promo.

## Parcours à construire

1. **Inscription** : mail, prénom, nom, mot de passe, code d'inscription. Le mot de passe est enregistré avec `password_hash`.
2. **Connexion** : session PHP dans un cookie `HttpOnly`.
3. **Progression** : récupérer ce qui est réussi, et enregistrer la réussite d'un exo.
4. **Migration** : au premier login, envoyer la progression du `localStorage` au serveur.

## Sécurité, dès le départ

- Protection CSRF : cookie `SameSite=Lax` au minimum ; un jeton CSRF sur les requêtes qui modifient des données reste à décider.
- Requêtes préparées (PDO) partout, jamais de requête construite à la main avec les données de l'utilisateur.
- `password_hash` et `password_verify`, jamais de mot de passe en clair.
- Cookie de session `HttpOnly` et `SameSite`, HTTPS en ligne.
- Limiter les essais de connexion.
- Aucun secret (code d'inscription, mot de passe de base) dans le dépôt.

**Limite à connaître** : les tests tournent dans le navigateur de l'élève, donc la réussite envoyée au serveur peut être falsifiée. C'est accepté pour cette première version ; la double vérification (README, section 6) viendra avec les échanges PTP.

## Développement en local

Chaque membre a besoin de PHP et de MySQL (Homebrew, XAMPP ou Laragon). Le détail des commandes sera ajouté à [lancer-le-projet.md](lancer-le-projet.md) quand le socle existera : création de la base avec le script SQL, copie du fichier de configuration d'exemple, lancement du serveur.

## Découpage proposé en issues

Une fois ce document validé, un découpage possible (à ajuster) :

1. Base et configuration : script SQL, `config.exemple.php`, ajout de `config.local.php` au `.gitignore`, connexion à MySQL.
2. Inscription avec le code universel.
3. Connexion, déconnexion et session.
4. API de la progression.
5. Écrans de connexion et d'inscription dans l'interface.
6. Migration de la progression locale au premier login.
7. Documentation de l'installation locale.
