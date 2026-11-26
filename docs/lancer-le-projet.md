# Lancer le projet

Le prototype est **statique** : pas de `npm install`, pas de build. Il faut seulement un petit serveur local (le navigateur refuse de charger les exos depuis `file://`).

## Récupérer le code

```bash
git clone https://github.com/zaderlyl/piscine.git
cd piscine
```

## Lancer

Option 1, avec Python :

```bash
python3 -m http.server 8000
```

URL : http://localhost:8000/src/

Option 2, avec VS Code : extension **Live Server**, clic droit sur `src/index.html`, puis « Open with Live Server ».
URL : http://127.0.0.1:5500/src/index.html

Les bibliothèques (CodeMirror, Emmet, marked) sont chargées depuis internet : il faut une connexion.

## Mode auteur

Ajoute `?auteur` à l'URL pour afficher un bouton « Charger la solution ». Il remplit les éditeurs avec la solution de l'exo, pratique pour vérifier que les tests passent.

## Structure des dossiers

```
src/        code de la plateforme (index.html, style.css, script.js)
exos/       les exercices, un fichier Markdown par exo
  html/
    vanilla/
      04.md
assets/     images, sons, polices
docs/       documentation du projet
README.md   document de cadrage (le « pourquoi » et le « quoi »)
```

Un exo est rangé dans `exos/<langage>/<famille>/<numéro>.md`. Le format est décrit dans [ecrire-un-exo.md](ecrire-un-exo.md).

## Choisir l'exo affiché

Ajoute `?exo=langage/famille/numéro` à l'URL, par exemple `?exo=php/vanilla/00`. Sans paramètre, l'exo HTML 05 est affiché. Les paramètres se combinent : `?auteur&exo=php/vanilla/00`.

## Serveur PHP et base de données

Les comptes (inscription, connexion, progression) passent par une petite API en PHP (`api/`) et une base MySQL. Le prototype statique n'en a pas besoin : cette partie ne sert que si tu travailles sur les comptes. Les fichiers `api/` et `base/schema.sql` arrivent avec la PR #160 (inscription) : avant son merge, ils ne sont pas sur `main`.

### En local

**1. Installer PHP et MySQL**

- Mac (Homebrew) :
  ```bash
  brew install php mysql
  brew services start mysql
  ```
- Windows : installe [XAMPP](https://www.apachefriends.org/), puis lance « MySQL » (et « Apache », pour phpMyAdmin) dans son panneau de contrôle.

**2. Créer la base et les tables**

- Mac, dans le terminal :
  ```bash
  mysql -u root -e "CREATE DATABASE piscine CHARACTER SET utf8mb4;"
  mysql -u root piscine < base/schema.sql
  ```
- Windows : ouvre phpMyAdmin (http://localhost/phpmyadmin), crée une base `piscine` (interclassement `utf8mb4_general_ci`), puis onglet « Importer » et choisis `base/schema.sql`.

**3. Créer la configuration**

Copie `api/config.exemple.php` en `api/config.local.php`, puis remplace les valeurs :

- `hote` : `127.0.0.1` ; `port` : `3306` ;
- `nom` : `piscine` ;
- `utilisateur` : `root` ; `mot_de_passe` : vide (`''`) avec Homebrew et XAMPP par défaut ;
- `code_inscription` : un code de test de ton choix.

`api/config.local.php` est ignoré par Git : ne le commite jamais.

**4. Lancer le serveur**

Depuis la racine du dépôt :

```bash
php -S localhost:8000
```

Sous Windows, avec XAMPP, utilise `C:\xampp\php\php.exe -S localhost:8000` si `php` n'est pas reconnu.

URL du prototype : http://localhost:8000/src/ ; URL de l'API : http://localhost:8000/api/.

### Sur le serveur de l'IUT

Le serveur de l'IUT fait tourner PHP et MySQL : c'est là que l'API est testée en vrai.

**1. Créer la base** dans phpMyAdmin. Son nom est préfixé par ton identifiant (par exemple `lilian.cornet_piscine`, et pas `piscine`). Tu n'as pas le droit de faire `CREATE DATABASE` : crée-la depuis l'interface, puis importe `base/schema.sql` dans cette base (onglet « Importer »).

**2. Envoyer les fichiers** avec FileZilla dans `public_html/piscine/` : les dossiers `api/` et `base/`.

**3. Créer `api/config.local.php`** sur le serveur, à partir de `config.exemple.php` :

- `hote` : `localhost` (vérifie la ligne « Serveur » de phpMyAdmin) ; `port` : `3306` ;
- `nom` : le nom **préfixé** de la base ;
- `utilisateur` et `mot_de_passe` : ceux de phpMyAdmin ;
- `code_inscription` : un code de test, à changer avant toute mise en ligne.

Prépare ce fichier hors du dépôt, envoie-le avec FileZilla, puis supprime la copie locale : il contient un mot de passe.

**4. Tester l'inscription** avec `curl`. `BASE` est l'URL du dossier `api/` sur le serveur :

```bash
BASE=https://<serveur>/~<identifiant>/piscine/api
curl -i -X POST $BASE/inscription.php -H 'Content-Type: application/json' \
  -d '{"email":"test1@exemple.fr","prenom":"Test","nom":"Un","mot_de_passe":"motdepasse1","code":"TON_CODE"}'
```

Réponses attendues :

| Requête | Réponse |
|---|---|
| inscription valide | `201` `{"ok":true,"id":…}` |
| même e-mail une deuxième fois | `409` |
| mot de passe trop court ou code faux | `400` avec les erreurs par champ |
| `GET` au lieu de `POST` | `405` |

Une erreur `500` « Erreur du serveur » cache la vraie cause, écrite dans `error_log` : le plus souvent le nom de la base (préfixe oublié), l'hôte MySQL ou une table manquante. Après le test, supprime la ligne de test dans la table `users`.

## En cas de problème

- Page blanche ou rien ne s'affiche : ouvre la console (F12) et lis la première erreur.
- Modification non prise en compte : recharge sans cache (Cmd+Shift+R).
- « Aperçu suspendu » : le code de l'éditeur semble boucler à l'infini. Corrige-le, puis recharge.
