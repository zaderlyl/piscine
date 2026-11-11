import test from "node:test";
import assert from "node:assert/strict";
import { lirePtp } from "./exo.js";
import {
  chargerEtat,
  sauverEtat,
  notifierValidationExo,
  ptpBloqueSuivant,
  avecEtat,
} from "./ptp.js";
import * as P from "../prototypes/ptp/ptp-logique.js";

function creerStockageMock(initial = {}) {
  const table = new Map(
    Object.entries(initial).map(([k, v]) => [
      k,
      typeof v === "string" ? v : JSON.stringify(v),
    ]),
  );
  return {
    getItem: (k) => (table.has(k) ? table.get(k) : null),
    setItem: (k, v) => table.set(k, String(v)),
    removeItem: (k) => table.delete(k),
    clear: () => table.clear(),
    key: (i) => Array.from(table.keys())[i] ?? null,
    get length() {
      return table.size;
    },
  };
}

test("lirePtp : extrait la configuration PTP de l'en-tête de l'exo", () => {
  assert.equal(lirePtp("# Titre\nÉnoncé sans PTP"), "oui");
  assert.equal(lirePtp("ptp: non\n# Titre"), "non");
  assert.equal(lirePtp("ptp: simple\n# Titre"), "simple");
  assert.equal(lirePtp("ptp: riche\n# Titre"), "riche");
  assert.equal(lirePtp("ptp: oui\n# Titre"), "oui");
});

test("ptp : chargerEtat et sauverEtat", () => {
  const stockage = creerStockageMock();
  const etatInitial = chargerEtat(stockage);
  assert.ok(etatInitial.eleves);
  assert.ok(etatInitial.echanges);

  etatInitial.eleves["test-1"] = { id: "test-1", prenom: "Alice", etat: "libre" };
  sauverEtat(etatInitial, stockage);

  const etatRecharge = chargerEtat(stockage);
  assert.equal(etatRecharge.eleves["test-1"].prenom, "Alice");
});

test("ptpBloqueSuivant : retourne vrai si l'élève est en échange ou attente", () => {
  const stockage = creerStockageMock();
  // Pas d'élève dans l'état => false
  assert.equal(ptpBloqueSuivant(stockage), false);

  // Avec un état libre sans exo en attente
  const s = P.nouvelEtat();
  s.eleves["eleve-test"] = {
    id: "eleve-test",
    prenom: "Test",
    etat: "libre",
    exoEnAttente: false,
  };
  sauverEtat(s, stockage);
  assert.equal(ptpBloqueSuivant(stockage), false);

  // Avec un exo en attente
  s.eleves["eleve-test"].exoEnAttente = true;
  sauverEtat(s, stockage);
  assert.equal(ptpBloqueSuivant(stockage), true);

  // En cours de recherche
  s.eleves["eleve-test"].exoEnAttente = false;
  s.eleves["eleve-test"].etat = "en_recherche";
  sauverEtat(s, stockage);
  assert.equal(ptpBloqueSuivant(stockage), true);
});

test("notifierValidationExo : intègre la validation dans la logique PTP", async () => {
  const stockage = creerStockageMock();
  await notifierValidationExo("html/vanilla/01", true, stockage);

  const etat = chargerEtat(stockage);
  assert.ok(etat.eleves["eleve-test"]);
  assert.equal(etat.eleves["eleve-test"].id, "eleve-test");
});
