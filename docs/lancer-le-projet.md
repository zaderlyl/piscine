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

## En cas de problème

- Page blanche ou rien ne s'affiche : ouvre la console (F12) et lis la première erreur.
- Modification non prise en compte : recharge sans cache (Cmd+Shift+R).
- « Aperçu suspendu » : le code de l'éditeur semble boucler à l'infini. Corrige-le, puis recharge.
