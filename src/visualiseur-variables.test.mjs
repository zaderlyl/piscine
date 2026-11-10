import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  determinerType,
  afficherVariables,
  ecouterValeurs,
} from "./visualiseur-variables.js";

test("determinerType identifie correctement les types JavaScript", () => {
  // Nombres
  assert.equal(determinerType(20), "number");
  assert.equal(determinerType(0), "number");
  assert.equal(determinerType(-3.14), "number");
  assert.equal(determinerType(NaN), "number");
  assert.equal(determinerType(Infinity), "number");

  // Chaînes
  assert.equal(determinerType("Alice"), "string");
  assert.equal(determinerType(""), "string");

  // Booléens
  assert.equal(determinerType(true), "boolean");
  assert.equal(determinerType(false), "boolean");

  // Tableaux (cas particulier Array.isArray)
  assert.equal(determinerType([]), "array");
  assert.equal(determinerType([1, 2, 3]), "array");

  // Objets
  assert.equal(determinerType({}), "object");
  assert.equal(determinerType({ nom: "Alice", age: 20 }), "object");

  // Null et undefined
  assert.equal(determinerType(null), "null");
  assert.equal(determinerType(undefined), "undefined");

  // Fonctions
  assert.equal(
    determinerType(() => {}),
    "function",
  );
  assert.equal(
    determinerType(function () {}),
    "function",
  );

  // BigInt et Symbol
  assert.equal(determinerType(10n), "bigint");
  assert.equal(determinerType(Symbol("test")), "symbol");
});

test("afficherVariables ajoute l'élément de type dans chaque carte", () => {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><body><section id="variables"></section></body></html>`,
  );
  const conteneur = dom.window.document.getElementById("variables");

  const analyse = {
    variables: [
      { nom: "age", ligne: 1, connectee: true },
      { nom: "nom", ligne: 2, connectee: false },
    ],
    erreur: null,
  };

  afficherVariables(analyse, true, conteneur);

  const cartes = conteneur.querySelectorAll(".variable");
  assert.equal(cartes.length, 2);

  const carteAge = conteneur.querySelector('[data-nom="age"]');
  assert.ok(carteAge);
  const badgeTypeAge = carteAge.querySelector(".type");
  assert.ok(badgeTypeAge, "Badge .type présent");
  assert.equal(badgeTypeAge.textContent, "", "Badge vide avant exécution");

  const carteNom = conteneur.querySelector('[data-nom="nom"]');
  assert.ok(carteNom);
  assert.ok(carteNom.querySelector(".type"));
});

test("ecouterValeurs met à jour la valeur et le badge de type", () => {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><body>
      <section id="variables"></section>
      <iframe id="apercu"></iframe>
    </body></html>`,
  );

  global.window = dom.window;
  global.document = dom.window.document;

  const conteneur = dom.window.document.getElementById("variables");
  const apercu = dom.window.document.getElementById("apercu");

  const analyse = {
    variables: [
      { nom: "age", ligne: 1, connectee: true },
      { nom: "prenom", ligne: 2, connectee: true },
      { nom: "notes", ligne: 3, connectee: true },
    ],
    erreur: null,
  };

  afficherVariables(analyse, true, conteneur);
  ecouterValeurs(apercu, conteneur);

  // Simulation des messages envoyés depuis l'iframe d'aperçu
  dom.window.dispatchEvent(
    new dom.window.MessageEvent("message", {
      source: apercu.contentWindow,
      data: {
        type: "variable",
        nom: "age",
        valeur: "20",
        typeDonnees: "number",
      },
    }),
  );

  dom.window.dispatchEvent(
    new dom.window.MessageEvent("message", {
      source: apercu.contentWindow,
      data: {
        type: "variable",
        nom: "prenom",
        valeur: '"Alice"',
        typeDonnees: "string",
      },
    }),
  );

  dom.window.dispatchEvent(
    new dom.window.MessageEvent("message", {
      source: apercu.contentWindow,
      data: {
        type: "variable",
        nom: "notes",
        valeur: "[15, 18]",
        typeDonnees: "array",
      },
    }),
  );

  const badgeAge = conteneur.querySelector('[data-nom="age"] .type');
  assert.equal(badgeAge.textContent, "number");
  assert.equal(badgeAge.dataset.type, "number");

  const badgePrenom = conteneur.querySelector('[data-nom="prenom"] .type');
  assert.equal(badgePrenom.textContent, "string");
  assert.equal(badgePrenom.dataset.type, "string");

  const badgeNotes = conteneur.querySelector('[data-nom="notes"] .type');
  assert.equal(badgeNotes.textContent, "array");
  assert.equal(badgeNotes.dataset.type, "array");
});
