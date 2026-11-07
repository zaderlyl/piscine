// Tests d'intégration du panneau Git dans le DOM : node src/depot/panneau.test.mjs
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { lireExo, lirePanneaux } from "../exo.js";
import { monterPanneauDepot, ORDRE } from "../depot.js";

const RACINE = fileURLToPath(new URL("../..", import.meta.url));

// 1. Ordre des exercices
assert.equal(ORDRE.length, 11, "ORDRE doit contenir 11 exercices");
assert.equal(ORDRE[0], "git/visuel/01");
assert.equal(ORDRE[10], "git/visuel/11");

// 2. Test sur l'exercice 01 (Premier commit)
const chemin01 = join(RACINE, "exos/git/visuel/01.md");
const texte01 = readFileSync(chemin01, "utf8");
const exo01 = lireExo(texte01);
Object.defineProperty(exo01, "texteBrut", { value: texte01 });
Object.defineProperty(exo01, "panneaux", { value: lirePanneaux(texte01) });

assert.deepEqual(exo01.panneaux, ["enonce", "depot"]);

const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div id="editeur"><div id="depot-gauche"></div></div>
  <div id="droite"><div id="depot-droite"></div></div>
</body></html>`);

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;

let succesAppele = false;
const gauche = dom.window.document.getElementById("depot-gauche");
const droite = dom.window.document.getElementById("depot-droite");

monterPanneauDepot({
  conteneurGauche: gauche,
  conteneurDroite: droite,
  exo: exo01,
  nomExo: "git/visuel/01",
  auteur: true,
  onSucces: () => {
    succesAppele = true;
  },
});

const cmdInput = gauche.querySelector("#depot-commande");
const form = gauche.querySelector("#depot-formulaire");
const sortie = gauche.querySelector("#depot-sortie");
const statut = droite.querySelector("#depot-statut");
const graphe = droite.querySelector("#depot-graphe");
const cible = droite.querySelector("#depot-cible");
const btnSolution = gauche.querySelector("#depot-solution");
const btnRecommencer = gauche.querySelector("#depot-recommencer");

assert.ok(cmdInput, "Champ commande présent");
assert.ok(form, "Formulaire présent");
assert.ok(sortie, "Zone sortie présente");
assert.ok(statut, "Zone statut présente");
assert.ok(graphe, "Graphe élève présent");
assert.ok(cible, "Graphe cible présent");
assert.ok(btnSolution, "Bouton solution présent en mode auteur");

// Avant git init : pas de dépôt
cmdInput.value = "git status";
form.dispatchEvent(new dom.window.Event("submit"));
assert.match(sortie.textContent, /pas de dépôt Git/);
assert.equal(succesAppele, false);

// git init
cmdInput.value = "git init";
form.dispatchEvent(new dom.window.Event("submit"));
assert.match(sortie.textContent, /Dépôt Git vide initialisé/);
assert.match(statut.textContent, /Branche : main/);

// Recommencer
btnRecommencer.dispatchEvent(new dom.window.Event("click"));
assert.match(graphe.innerHTML, /Pas de dépôt Git/);

// Solution
btnSolution.dispatchEvent(new dom.window.Event("click"));
assert.equal(succesAppele, true, "onSucces doit être déclenché");
assert.match(graphe.innerHTML, /Ajoute la page/);

// 3. Test sur les 11 exercices Git : chaque solution mène au succès
const dossierGit = join(RACINE, "exos/git/visuel");
const fichiersGit = readdirSync(dossierGit).filter((f) => f.endsWith(".md")).sort();
assert.equal(fichiersGit.length, 11);

for (const f of fichiersGit) {
  const contenu = readFileSync(join(dossierGit, f), "utf8");
  const exoObj = lireExo(contenu);
  Object.defineProperty(exoObj, "texteBrut", { value: contenu });
  Object.defineProperty(exoObj, "panneaux", { value: lirePanneaux(contenu) });

  let valide = false;
  const miniDom = new JSDOM(`<!DOCTYPE html><html><body><div id="cg"></div><div id="cd"></div></body></html>`);
  global.window = miniDom.window;
  global.document = miniDom.window.document;

  monterPanneauDepot({
    conteneurGauche: miniDom.window.document.getElementById("cg"),
    conteneurDroite: miniDom.window.document.getElementById("cd"),
    exo: exoObj,
    nomExo: "git/visuel/" + f.replace(".md", ""),
    auteur: true,
    onSucces: () => {
      valide = true;
    },
  });

  const sol = miniDom.window.document.getElementById("depot-solution");
  sol.dispatchEvent(new miniDom.window.Event("click"));
  assert.equal(valide, true, `L'exo ${f} doit être validé avec sa solution`);
}

console.log("ok   Panneau Git : 11 exos validés en conditions réelles");
