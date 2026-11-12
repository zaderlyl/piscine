import test from "node:test";
import assert from "node:assert/strict";
import { normaliserRequete, verifierRequete } from "./verification.js";

const SOLUTIONS = ["SELECT nom FROM eleves;", "SELECT eleves.nom FROM eleves WHERE nom = 'Alice'"];

test("normaliserRequete ignore casse, espaces, commentaires et ; final", () => {
  assert.equal(
    normaliserRequete("select  nom\n  from eleves -- liste\n ;"),
    "select nom from eleves",
  );
  assert.equal(normaliserRequete("SELECT a , b FROM t"), "select a,b from t");
});

test("normaliserRequete garde la casse du texte entre guillemets", () => {
  assert.equal(normaliserRequete("SELECT * FROM t WHERE n = 'Alice'"), "select * from t where n = 'Alice'");
  assert.notEqual(normaliserRequete("WHERE n = 'Alice'"), normaliserRequete("WHERE n = 'alice'"));
});

test("verifierRequete accepte une écriture différente d'une solution", () => {
  assert.equal(verifierRequete("select   NOM from ELEVES", SOLUTIONS).reussi, true);
  assert.equal(
    verifierRequete("select eleves.nom\nfrom eleves where nom = 'Alice';", SOLUTIONS).reussi,
    true,
  );
});

test("verifierRequete refuse une requête différente ou vide", () => {
  assert.equal(verifierRequete("SELECT id FROM eleves", SOLUTIONS).reussi, false);
  assert.equal(verifierRequete("SELECT * FROM eleves WHERE nom = 'alice'", SOLUTIONS).reussi, false);
  assert.match(verifierRequete("  ", SOLUTIONS).message, /Écris/);
});
