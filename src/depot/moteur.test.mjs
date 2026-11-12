// Tests du moteur de graphe : node src/depot/moteur.test.mjs
import assert from "node:assert/strict";
import { nouveauDepot, executer, executerScript, signature, rendre, ecarts, condition } from "./moteur.js";

// Lance une suite de commandes et renvoie le dépôt final (erreurs comprises).
function lancer(commandes, depot = nouveauDepot()) {
  for (const ligne of commandes) depot = executer(depot, ligne).depot;
  return depot;
}

// Une suite de lignes de script (edit, autre-dev, git) : même rôle que les Départ des exos.
function scripter(lignes, depot = nouveauDepot()) {
  for (const ligne of lignes) depot = executerScript(depot, ligne).depot;
  return depot;
}

// Un fichier modifié apparaît dans le travail (le moteur ne connaît que index.html et style.css au départ).
function modifier(depot, fichier) {
  return { ...depot, travail: [...depot.travail, fichier] };
}

const tests = [
  ["init sur un dépôt existant ne change rien", () => {
    const d = lancer(["git add .", 'git commit -m "A"']);
    const r = executer(d, "git init");
    assert.equal(r.erreur, false);
    assert.deepEqual(r.depot, d);
  }],
  ["status sur un dépôt neuf", () => {
    const r = executer(nouveauDepot(), "git status");
    assert.match(r.sortie, /Sur la branche main/);
    assert.match(r.sortie, /Modifications non indexées : index.html, style.css/);
  }],
  ["commit sans add refusé", () => {
    const r = executer(nouveauDepot(), 'git commit -m "A"');
    assert.equal(r.erreur, true);
    assert.equal(Object.keys(r.depot.commits).length, 0);
  }],
  ["add d'un fichier inconnu refusé", () => {
    const r = executer(nouveauDepot(), "git add autre.txt");
    assert.equal(r.erreur, true);
  }],
  ["premier commit crée main", () => {
    const d = lancer(["git add index.html", 'git commit -m "Ajoute la page"']);
    assert.equal(rendre(d), "* 1a3f01 Ajoute la page (HEAD -> main)");
    assert.deepEqual(d.travail, ["style.css"]);
  }],
  ["add . ajoute tout", () => {
    const d = lancer(["git add ."]);
    assert.deepEqual(d.index, ["index.html", "style.css"]);
    assert.deepEqual(d.travail, []);
  }],
  ["log liste les commits du plus récent", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"', "git add style.css", 'git commit -m "B"']);
    const log = executer(d, "git log").sortie;
    assert.ok(log.indexOf("    B") < log.indexOf("    A"));
  }],
  ["branch crée sans changer de branche", () => {
    const d = lancer(["git add .", 'git commit -m "A"', "git branch menu"]);
    assert.equal(d.head, "main");
    assert.equal(d.branches.menu, d.branches.main);
  }],
  ["switch -c crée et change", () => {
    const d = lancer(["git add .", 'git commit -m "A"', "git switch -c menu"]);
    assert.equal(d.head, "menu");
  }],
  ["checkout -b équivalent à switch -c", () => {
    const a = lancer(["git add .", 'git commit -m "A"', "git switch -c menu"]);
    const b = lancer(["git add .", 'git commit -m "A"', "git checkout -b menu"]);
    assert.equal(signature(a), signature(b));
  }],
  ["switch vers une branche inconnue refusé", () => {
    const r = executer(nouveauDepot(), "git switch nope");
    assert.equal(r.erreur, true);
  }],
  ["branche déjà existante refusée", () => {
    const d = lancer(["git add .", 'git commit -m "A"']);
    assert.equal(executer(d, "git branch main").erreur, true);
  }],
  ["commande hors niveau refusée proprement", () => {
    const r = executer(nouveauDepot(), "git rebase main");
    assert.equal(r.erreur, true);
    assert.match(r.sortie, /pas encore au programme/);
  }],
  ["signature ignore les identifiants et l'ordre des branches", () => {
    const a = lancer(["git add .", 'git commit -m "A"', "git switch -c menu", 'git commit -m "B"']);
    const b = lancer(["git add .", 'git commit -m "A"', "git switch -c menu", 'git commit -m "B"']);
    b.branches = { menu: b.branches.menu, main: b.branches.main };
    assert.equal(signature(a), signature(b));
  }],
  ["signature voit une différence de message", () => {
    const a = lancer(["git add .", 'git commit -m "A"']);
    const b = lancer(["git add .", 'git commit -m "X"']);
    assert.notEqual(signature(a), signature(b));
  }],
  ["signature voit une différence de HEAD", () => {
    const a = lancer(["git add .", 'git commit -m "A"', "git branch menu"]);
    const b = lancer(["git add .", 'git commit -m "A"', "git switch -c menu"]);
    assert.notEqual(signature(a), signature(b));
  }],
  ["une erreur ne change pas le dépôt", () => {
    const d = lancer(["git add .", 'git commit -m "A"']);
    const r = executer(d, "git switch nope");
    assert.deepEqual(r.depot, d);
  }],

  // Niveau 3 : fusion
  ["merge en avance rapide : main avance, pas de nouveau commit", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"', "git switch -c menu", "git add style.css", 'git commit -m "B"', "git switch main", "git merge menu"]);
    assert.equal(Object.keys(d.commits).length, 2);
    assert.equal(d.branches.main, d.branches.menu);
  }],
  ["merge à trois : un commit à deux parents", () => {
    let d = lancer(["git add index.html", 'git commit -m "A"', "git switch -c menu", "git add style.css", 'git commit -m "B"', "git switch main"]);
    d = modifier(d, "contact.html");
    d = lancer(["git add contact.html", 'git commit -m "C"'], d);
    const r = executer(d, "git merge menu");
    assert.equal(r.erreur, false);
    const fusion = r.depot.commits[r.depot.branches.main];
    assert.equal(fusion.parents.length, 2);
    assert.equal(Object.keys(r.depot.commits).length, 4);
  }],
  ["merge d'une branche déjà contenue : déjà à jour", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"', "git branch menu", "git add style.css", 'git commit -m "B"']);
    const r = executer(d, "git merge menu");
    assert.match(r.sortie, /Déjà à jour/);
    assert.deepEqual(r.depot, d);
  }],
  ["merge d'une branche inconnue refusé", () => {
    const d = lancer(["git add .", 'git commit -m "A"']);
    assert.equal(executer(d, "git merge nope").erreur, true);
  }],
  ["merge dans la même branche refusé", () => {
    const d = lancer(["git add .", 'git commit -m "A"']);
    assert.equal(executer(d, "git merge main").erreur, true);
  }],
  ["merge avec modifications prêtes refusé", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"', "git branch menu", "git add style.css"]);
    assert.equal(executer(d, "git merge menu").erreur, true);
  }],
  ["log après fusion montre les commits de la branche fusionnée", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"', "git switch -c menu", "git add style.css", 'git commit -m "B"', "git switch main", "git merge menu"]);
    const log = executer(d, "git log").sortie;
    assert.match(log, /    B/);
    assert.match(log, /    A/);
  }],
  ["ecarts : rien quand le graphe est bon", () => {
    const d = lancer(["git add .", 'git commit -m "A"']);
    assert.deepEqual(ecarts(d, d), []);
  }],
  ["ecarts : commit manquant et branche absente", () => {
    const cible = lancer(["git add .", 'git commit -m "A"', "git switch -c menu"]);
    const d = lancer(["git add .", 'git commit -m "A"']);
    const messages = ecarts(d, cible);
    assert.ok(messages.some((m) => /branche « menu » n'existe pas/.test(m)));
    assert.ok(messages.some((m) => /Tu devrais être sur la branche « menu »/.test(m)));
  }],
  ["ecarts : nombre de commits", () => {
    const cible = lancer(["git add index.html", 'git commit -m "A"', "git add style.css", 'git commit -m "B"']);
    const d = lancer(["git add index.html", 'git commit -m "A"']);
    assert.ok(ecarts(d, cible).includes("Il manque 1 commit."));
  }],

  // Niveau 4 : conflits
  ["fusion à trois sans conflit : aucun fichier touché deux fois", () => {
    const d = scripter([
      "git add index.html", 'git commit -m "Ajoute la page"',
      "git switch -c menu", "git add style.css", 'git commit -m "Ajoute le menu"',
      "git switch main", "edit index.html",
    ]);
    const r = lancer(["git add index.html", 'git commit -m "Change la page"', "git merge menu"], d);
    assert.equal(r.fusion, null);
    assert.equal(Object.keys(r.commits[r.branches.main].contenu).length, 2);
  }],
  ["conflit : même fichier modifié des deux côtés", () => {
    const d = scripter([
      "git add index.html", 'git commit -m "Ajoute la page"',
      "git switch -c menu", "git add style.css", 'git commit -m "Ajoute le menu"',
      "git switch main", "edit style.css",
    ]);
    const c = lancer(["git add style.css", 'git commit -m "Ajoute le style"'], d);
    const r = executer(c, "git merge menu");
    assert.equal(r.erreur, true);
    assert.match(r.sortie, /CONFLIT/);
    assert.deepEqual(r.depot.fusion.conflits, ["style.css"]);
    assert.equal(r.depot.branches.main, c.branches.main, "la branche ne bouge pas pendant le conflit");
  }],
  ["commit refusé tant que le conflit n'est pas résolu", () => {
    const d = scripter([
      "git add index.html", 'git commit -m "Ajoute la page"',
      "git switch -c menu", "git add style.css", 'git commit -m "Ajoute le menu"',
      "git switch main", "edit style.css",
    ]);
    let r = lancer(["git add style.css", 'git commit -m "Ajoute le style"', "git merge menu"], d);
    assert.equal(executer(r, 'git commit -m "Fusion"').erreur, true);
  }],
  ["résoudre le conflit puis commit crée le commit de fusion", () => {
    const d = scripter([
      "git add index.html", 'git commit -m "Ajoute la page"',
      "git switch -c menu", "git add style.css", 'git commit -m "Ajoute le menu"',
      "git switch main", "edit style.css",
    ]);
    let r = lancer(["git add style.css", 'git commit -m "Ajoute le style"', "git merge menu", "git add style.css"], d);
    assert.equal(r.fusion.conflits.length, 0);
    r = executer(r, 'git commit -m "Fusionne le menu"').depot;
    assert.equal(r.fusion, null);
    assert.equal(r.commits[r.branches.main].parents.length, 2);
    assert.equal(r.commits[r.branches.main].message, "Fusionne le menu");
  }],
  ["merge --abort annule la fusion en conflit", () => {
    const d = scripter([
      "git add index.html", 'git commit -m "Ajoute la page"',
      "git switch -c menu", "git add style.css", 'git commit -m "Ajoute le menu"',
      "git switch main", "edit style.css",
    ]);
    const c = lancer(["git add style.css", 'git commit -m "Ajoute le style"', "git merge menu"], d);
    const r = executer(c, "git merge --abort");
    assert.equal(r.erreur, false);
    assert.equal(r.depot.fusion, null);
  }],

  // Niveau 5 : restore, reset, revert
  ["restore annule la modification d'un fichier", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"']);
    const r = executer(d, "git restore style.css");
    assert.deepEqual(r.depot.travail, []);
  }],
  ["restore d'un fichier non modifié refusé", () => {
    const d = lancer(["git add .", 'git commit -m "A"']);
    assert.equal(executer(d, "git restore style.css").erreur, true);
  }],
  ["restore --staged sort un fichier de la zone de préparation", () => {
    const d = lancer(["git add style.css"]);
    const r = executer(d, "git restore --staged style.css");
    assert.deepEqual(r.depot.index, []);
    assert.ok(r.depot.travail.includes("style.css"));
  }],
  ["reset --soft HEAD~1 garde les modifications prêtes", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"', "git add style.css", 'git commit -m "B"']);
    const r = executer(d, "git reset --soft HEAD~1");
    assert.equal(Object.keys(r.depot.commits).length, 1);
    assert.deepEqual(r.depot.index, ["style.css"]);
    assert.deepEqual(r.depot.travail, []);
  }],
  ["reset HEAD~1 (mixte) remet les modifications en non indexées", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"', "git add style.css", 'git commit -m "B"']);
    const r = executer(d, "git reset HEAD~1");
    assert.deepEqual(r.depot.index, []);
    assert.deepEqual(r.depot.travail, ["style.css"]);
  }],
  ["reset au-delà du premier commit refusé", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"']);
    assert.equal(executer(d, "git reset --soft HEAD~3").erreur, true);
  }],
  ["revert HEAD ajoute un commit qui annule le précédent", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"', "git add style.css", 'git commit -m "B"', "git revert HEAD"]);
    assert.equal(Object.keys(d.commits).length, 3);
    const tete = d.commits[d.branches.main];
    assert.equal(tete.message, "Revert « B »");
    assert.equal(tete.parents.length, 1);
    assert.equal("style.css" in tete.contenu, false);
  }],

  // Niveau 6 : dépôt distant
  ["push sans dépôt distant refusé", () => {
    const d = lancer(["git add .", 'git commit -m "A"']);
    assert.equal(executer(d, "git push").erreur, true);
  }],
  ["push -u envoie la branche sur origin", () => {
    const d = lancer(["git add .", 'git commit -m "A"', "git remote add origin https://exemple.test/p.git", "git push -u origin main"]);
    assert.equal(d.distant.main, d.branches.main);
    assert.equal(d.branches["origin/main"], d.branches.main);
    assert.equal(d.suivi.main, true);
  }],
  ["push refusé si origin a des commits que tu n'as pas", () => {
    const d = scripter([
      "git add index.html", 'git commit -m "A"',
      "git remote add origin https://exemple.test/p.git", "git push -u origin main",
      'autre-dev push "Ajoute la doc"',
    ]);
    const local = lancer(["git add style.css", 'git commit -m "B"'], d);
    assert.equal(executer(local, "git push").erreur, true);
  }],
  ["fetch fait apparaître origin/main", () => {
    const d = scripter([
      "git add index.html", 'git commit -m "A"',
      "git remote add origin https://exemple.test/p.git", "git push -u origin main",
      'autre-dev push "Ajoute la doc"',
    ]);
    const r = executer(d, "git fetch");
    assert.equal(r.depot.branches["origin/main"], r.depot.distant.main);
    assert.equal(r.depot.branches.main !== r.depot.branches["origin/main"], true);
  }],
  ["pull fait avancer main jusqu'à origin/main", () => {
    const d = scripter([
      "git add index.html", 'git commit -m "A"',
      "git remote add origin https://exemple.test/p.git", "git push -u origin main",
      'autre-dev push "Ajoute la doc"',
    ]);
    const r = executer(d, "git pull");
    assert.equal(r.erreur, false);
    assert.equal(r.depot.branches.main, r.depot.distant.main);
  }],
  ["pull sans branche suivie refusé", () => {
    const d = scripter(["git add index.html", 'git commit -m "A"', "git remote add origin https://exemple.test/p.git"]);
    assert.equal(executer(d, "git pull").erreur, true);
  }],

  // Niveau 7 : pull request simulée
  ["gh pr create demande une branche déjà sur origin", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"']);
    assert.equal(executer(d, "gh pr create").erreur, true);
  }],
  ["pull request : ouverte, approuvée, fusionnée sur origin", () => {
    let d = scripter([
      "git add index.html", 'git commit -m "A"',
      "git remote add origin https://exemple.test/p.git", "git push -u origin main",
      "git switch -c menu", "edit style.css", "git add style.css", 'git commit -m "Ajoute le menu"',
      "git push -u origin menu",
    ]);
    d = lancer(["gh pr create"], d);
    assert.equal(d.prs.length, 1);
    assert.equal(executer(d, "gh pr merge").erreur, true, "pas de fusion sans relecture");
    d = lancer(["gh pr review --approve", "gh pr merge"], d);
    assert.equal(d.prs[0].etat, "fusionnée");
    assert.equal(d.distant.main, d.distant.menu);
  }],
  ["signature voit la copie distante", () => {
    const a = lancer(["git add index.html", 'git commit -m "A"', "git remote add origin https://exemple.test/p.git"]);
    const b = lancer(["git add index.html", 'git commit -m "A"', "git remote add origin https://exemple.test/p.git", "git push -u origin main"]);
    assert.notEqual(signature(a), signature(b));
  }],
  // Conditions d'étapes
  ["condition commit et sans", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"']);
    assert.equal(condition(d, 'commit "A"'), true);
    assert.equal(condition(d, 'sans "A"'), false);
    assert.equal(condition(d, 'sans "Z"'), true);
  }],
  ["condition meme : ff faite", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"', "git switch -c menu", "git add style.css", 'git commit -m "B"', "git switch main"]);
    assert.equal(condition(d, "meme main menu"), false);
    assert.equal(condition(lancer(["git merge menu"], d), "meme main menu"), true);
  }],
  ["condition propre après un commit", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"', "git add style.css", 'git commit -m "B"']);
    assert.equal(condition(d, "propre"), true);
  }],
  ["condition fusion : commit de fusion", () => {
    const d = scripter([
      "git add index.html", 'git commit -m "A"', "git switch -c menu", "git add style.css", 'git commit -m "B"',
      "git switch main", "edit index.html",
    ]);
    const f = lancer(["git add index.html", 'git commit -m "C"', "git merge menu"], d);
    assert.equal(condition(f, "fusion"), true);
    assert.equal(condition(d, "fusion"), false);
  }],
  ["le script ne peut pas être tapé par l'élève", () => {
    const r = executer(nouveauDepot(), "edit style.css");
    assert.equal(r.erreur, true);
  }],
  ["switch vers origin/main refusé proprement (HEAD détaché)", () => {
    const d = nouveauDepot();
    d.branches["origin/main"] = "1a3f01";
    const r = executer(d, "git switch origin/main");
    assert.equal(r.erreur, true);
    assert.match(r.sortie, /HEAD détaché/);
  }],
  ["commit avec guillemets simples accepté", () => {
    const d = executer(nouveauDepot(), "git add index.html").depot;
    const r = executer(d, "git commit -m 'Message simple'");
    assert.equal(r.erreur, false);
    assert.match(r.sortie, /Message simple/);
  }],
  ["checkout -b vers branche existante refusé", () => {
    const d = lancer(["git add .", 'git commit -m "A"']);
    const r = executer(d, "git checkout -b main");
    assert.equal(r.erreur, true);
    assert.match(r.sortie, /existe déjà/);
  }],
  ["restore sans argument refusé", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"']);
    const r = executer(d, "git restore");
    assert.equal(r.erreur, true);
    assert.match(r.sortie, /Précise le fichier/);
  }],
  ["restore --staged sans argument refusé", () => {
    const d = lancer(["git add style.css"]);
    const r = executer(d, "git restore --staged");
    assert.equal(r.erreur, true);
    assert.match(r.sortie, /Précise le fichier/);
  }],
  ["reset sans argument refusé", () => {
    const d = lancer(["git add .", 'git commit -m "A"']);
    const r = executer(d, "git reset");
    assert.equal(r.erreur, true);
    assert.match(r.sortie, /Précise le commit/);
  }],
  ["remote add autre que origin refusé", () => {
    const d = nouveauDepot();
    const r = executer(d, "git remote add upstream https://foo.git");
    assert.equal(r.erreur, true);
    assert.match(r.sortie, /ne connaît que « origin »/);
  }],
  ["gh commande inconnue refusée proprement", () => {
    const d = nouveauDepot();
    const r = executer(d, "gh repo clone");
    assert.equal(r.erreur, true);
    assert.match(r.sortie, /pas encore au programme/);
  }],
  ["gh pr review sans pr ouverte refusée", () => {
    const d = nouveauDepot();
    const r = executer(d, "gh pr review");
    assert.equal(r.erreur, true);
    assert.match(r.sortie, /Pas de pull request ouverte/);
  }],
  ["conditions head, travail et serveur", () => {
    const d = lancer(["git add index.html", 'git commit -m "A"']);
    assert.equal(condition(d, "head main"), true);
    assert.equal(condition(d, "travail style.css"), true);
    assert.equal(condition(d, "serveur main"), false);
  }],
];

let echecs = 0;
for (const [nom, test] of tests) {
  try {
    test();
    console.log(`ok   ${nom}`);
  } catch (erreur) {
    echecs++;
    console.log(`FAIL ${nom}\n     ${erreur.message}`);
  }
}
console.log(echecs ? `\n${echecs} échec(s)` : `\nTous les tests passent (${tests.length})`);
process.exitCode = echecs ? 1 : 0;
