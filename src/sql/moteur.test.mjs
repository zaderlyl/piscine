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

test("executerRequete renvoie la structure des tables : types, clé primaire, clé étrangère", options, () => {
  const base = "CREATE TABLE eleves (id integer PRIMARY KEY, nom TEXT NOT NULL);";
  const r = executerRequete(SQL, base, "CREATE TABLE notes (id INTEGER PRIMARY KEY, eleve_id INTEGER, note INTEGER, FOREIGN KEY (eleve_id) REFERENCES eleves(id))");
  assert.equal(r.structureModifiee, true);
  assert.equal(r.ecriture, false);
  assert.deepEqual(r.structure, [
    {
      nom: "eleves",
      colonnes: [
        { nom: "id", type: "INTEGER", cle: 1, nonNul: false },
        { nom: "nom", type: "TEXT", cle: 0, nonNul: true },
      ],
      etrangeres: [],
    },
    {
      nom: "notes",
      colonnes: [
        { nom: "id", type: "INTEGER", cle: 1, nonNul: false },
        { nom: "eleve_id", type: "INTEGER", cle: 0, nonNul: false },
        { nom: "note", type: "INTEGER", cle: 0, nonNul: false },
      ],
      etrangeres: [{ de: "eleve_id", table: "eleves", vers: "id" }],
    },
  ]);
});

test("executerRequete : une clé étrangère sans colonne visée pointe vers la clé primaire", options, () => {
  const base = "CREATE TABLE eleves (id INTEGER PRIMARY KEY, nom TEXT);";
  const r = executerRequete(SQL, base, "CREATE TABLE notes (id INTEGER, eleve_id INTEGER REFERENCES eleves)");
  assert.deepEqual(r.structure[1].etrangeres, [{ de: "eleve_id", table: "eleves", vers: "id" }]);
  assert.equal(executerRequete(SQL, base, "SELECT * FROM eleves").structureModifiee, false);
  assert.equal(executerRequete(SQL, base, "-- DROP TABLE eleves\nSELECT 1").structureModifiee, false);
});
