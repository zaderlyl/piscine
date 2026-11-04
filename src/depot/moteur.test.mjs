// Tests du moteur de graphe : node src/depot/moteur.test.mjs
import assert from "node:assert/strict";
import { nouveauDepot, executer, signature, rendre } from "./moteur.js";

// Lance une suite de commandes et renvoie le dépôt final (erreurs comprises).
function lancer(commandes, depot = nouveauDepot()) {
  for (const ligne of commandes) depot = executer(depot, ligne).depot;
  return depot;
}

const tests = [
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
    const r = executer(nouveauDepot(), "git merge menu");
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
