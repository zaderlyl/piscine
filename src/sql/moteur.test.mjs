import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { executerRequete } from "./moteur.js";

// Ce test a besoin du paquet « sql.js » : il est ignoré s'il n'est pas installé.
let SQL = null;
try {
  const initSqlJs = createRequire(import.meta.url)("sql.js");
  SQL = await initSqlJs();
} catch {
  // sql.js absent
}
const options = { skip: SQL ? false : "sql.js non installé" };

const BASE = "CREATE TABLE eleves (id INTEGER, nom TEXT); INSERT INTO eleves VALUES (1, 'Alice'), (2, 'Bruno');";

test("executerRequete renvoie les colonnes et les lignes", options, () => {
  const r = executerRequete(SQL, BASE, "SELECT nom FROM eleves ORDER BY id");
  assert.deepEqual(r.colonnes, ["nom"]);
  assert.deepEqual(r.lignes, [["Alice"], ["Bruno"]]);
});

test("executerRequete signale une erreur SQL", options, () => {
  const r = executerRequete(SQL, BASE, "SELECT nom FROM profs");
  assert.match(r.erreur, /no such table/);
});

test("executerRequete part d'une base neuve à chaque fois", options, () => {
  executerRequete(SQL, BASE, "DELETE FROM eleves");
  assert.equal(executerRequete(SQL, BASE, "SELECT * FROM eleves").lignes.length, 2);
});

test("executerRequete renvoie l'état des tables après la requête", options, () => {
  const r = executerRequete(SQL, BASE, "UPDATE eleves SET nom = 'Zoé' WHERE id = 1");
  assert.equal(r.ecriture, true);
  assert.deepEqual(r.colonnes, []);
  assert.deepEqual(r.tables, [{ nom: "eleves", colonnes: ["id", "nom"], lignes: [[1, "Zoé"], [2, "Bruno"]] }]);
});

test("executerRequete garde les colonnes d'une table vidée et repère les lectures", options, () => {
  const vide = executerRequete(SQL, BASE, "DELETE FROM eleves");
  assert.deepEqual(vide.tables, [{ nom: "eleves", colonnes: ["id", "nom"], lignes: [] }]);
  assert.equal(executerRequete(SQL, BASE, "SELECT * FROM eleves").ecriture, false);
  assert.equal(executerRequete(SQL, BASE, "-- DELETE FROM eleves\nSELECT 1").ecriture, false);
});
