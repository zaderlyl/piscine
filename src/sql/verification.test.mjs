import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  normaliserRequete,
  verifierRequete,
  comparerResultats,
  verifierResultat,
  comparerEtats,
  verifierEtat,
  comparerStructures,
  verifierStructure,
} from "./verification.js";

const SOLUTIONS = ["SELECT nom FROM eleves;", "SELECT eleves.nom FROM eleves WHERE nom = 'Alice'"];

test("normaliserRequete ignore casse, espaces, commentaires et ; final", () => {
  assert.equal(
    normaliserRequete("select  nom\n  from eleves -- liste\n ;"),
    "select nom from eleves",
  );
  assert.equal(normaliserRequete("SELECT a , b FROM t"), "select a,b from t");
});

test("normaliserRequete ignore les espaces autour des opérateurs de comparaison", () => {
  const ref = normaliserRequete("SELECT nom FROM eleves WHERE age >= 18 AND classe = 'MMI1'");
  assert.equal(normaliserRequete("select nom from eleves where age>=18 and classe='MMI1'"), ref);
  assert.equal(normaliserRequete("SELECT nom FROM eleves WHERE age   >=   18 AND classe =\n'MMI1'"), ref);
  assert.equal(normaliserRequete("WHERE a<>1"), normaliserRequete("WHERE a <> 1"));
  assert.notEqual(normaliserRequete("WHERE a<1"), normaliserRequete("WHERE a<=1"));
});

test("normaliserRequete ne touche pas aux espaces dans le texte entre guillemets", () => {
  assert.notEqual(normaliserRequete("WHERE n = 'a=b'"), normaliserRequete("WHERE n = 'a = b'"));
});

test("normaliserRequete garde la casse du texte entre guillemets", () => {
  assert.equal(normaliserRequete("SELECT * FROM t WHERE n = 'Alice'"), "select * from t where n='Alice'");
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

const T = (colonnes, lignes) => ({ colonnes, lignes });

test("comparerResultats accepte un résultat identique, sans tenir compte de la casse des colonnes", () => {
  assert.equal(comparerResultats(T(["nom"], [["Alice"], ["Bruno"]]), T(["NOM"], [["Alice"], ["Bruno"]])).reussi, true);
});

test("comparerResultats ignore l'ordre des lignes sauf si on l'exige", () => {
  const attendu = T(["nom"], [["Alice"], ["Bruno"]]);
  const inverse = T(["nom"], [["Bruno"], ["Alice"]]);
  assert.equal(comparerResultats(attendu, inverse).reussi, true);
  const r = comparerResultats(attendu, inverse, true);
  assert.equal(r.reussi, false);
  assert.match(r.message, /ordre/);
});

test("comparerResultats refuse de mauvaises colonnes, un mauvais nombre de lignes ou de mauvaises lignes", () => {
  const attendu = T(["nom"], [["Alice"], ["Bruno"]]);
  assert.match(comparerResultats(attendu, T(["id"], [[1], [2]])).message, /colonnes/);
  assert.match(comparerResultats(attendu, T(["nom"], [["Alice"]])).message, /1 ligne\(s\), il en faut 2/);
  assert.match(comparerResultats(attendu, T(["nom"], [["Alice"], ["Chloé"]])).message, /lignes/);
});

// Les tests suivants ont besoin du paquet « sql.js » : ils sont ignorés s'il n'est pas installé.
let SQL = null;
try {
  SQL = await createRequire(import.meta.url)("sql.js")();
} catch {
  // sql.js absent
}
const options = { skip: SQL ? false : "sql.js non installé" };

const BASE = "CREATE TABLE eleves (id INTEGER, nom TEXT, age INTEGER); INSERT INTO eleves VALUES (1,'Alice',20),(2,'Bruno',17),(3,'Chloé',19);";

test("verifierResultat accepte deux écritures qui donnent le même tableau", options, () => {
  const solutions = ["SELECT nom FROM eleves WHERE age >= 18"];
  assert.equal(verifierResultat({ SQL, base: BASE, requete: "select nom from eleves where age > 17", solutions }).reussi, true);
});

test("verifierResultat exige l'ordre seulement si la solution a un ORDER BY", options, () => {
  const sansOrdre = ["SELECT nom FROM eleves"];
  assert.equal(verifierResultat({ SQL, base: BASE, requete: "SELECT nom FROM eleves ORDER BY nom DESC", solutions: sansOrdre }).reussi, true);
  const avecOrdre = ["SELECT nom FROM eleves ORDER BY nom"];
  assert.equal(verifierResultat({ SQL, base: BASE, requete: "SELECT nom FROM eleves ORDER BY nom DESC", solutions: avecOrdre }).reussi, false);
});

test("verifierResultat signale une erreur SQL ou une requête vide", options, () => {
  const solutions = ["SELECT nom FROM eleves"];
  assert.match(verifierResultat({ SQL, base: BASE, requete: "SELECT nom FROM profs", solutions }).message, /erreur/);
  assert.match(verifierResultat({ SQL, base: BASE, requete: " ", solutions }).message, /Écris/);
});

const TABLE = (lignes, nom = "eleves") => [{ nom, colonnes: ["id", "nom"], lignes }];

test("comparerEtats accepte le même contenu, dans n'importe quel ordre de lignes", () => {
  const attendu = TABLE([[1, "Alice"], [2, "Bruno"]]);
  assert.equal(comparerEtats(attendu, TABLE([[2, "Bruno"], [1, "Alice"]])).reussi, true);
});

test("comparerEtats refuse un mauvais nombre de lignes, un mauvais contenu ou d'autres tables", () => {
  const attendu = TABLE([[1, "Alice"], [2, "Bruno"]]);
  assert.match(comparerEtats(attendu, TABLE([[1, "Alice"]])).message, /1 ligne\(s\), il en faut 2/);
  assert.match(comparerEtats(attendu, TABLE([[1, "Alice"], [2, "Zoé"]])).message, /contenu de la table eleves/);
  assert.match(comparerEtats(attendu, TABLE([[1, "Alice"], [2, "Bruno"]], "profs")).message, /tables/);
});

test("verifierEtat accepte deux écritures qui laissent les tables dans le même état", options, () => {
  const solutions = ["UPDATE eleves SET age = 18 WHERE nom = 'Bruno'"];
  assert.equal(verifierEtat({ SQL, base: BASE, requete: "update eleves set age=18 where id = 2;", solutions }).reussi, true);
});

test("verifierEtat refuse une requête qui oublie le WHERE, une lecture seule, une erreur ou une requête vide", options, () => {
  const solutions = ["DELETE FROM eleves WHERE age < 18"];
  assert.match(verifierEtat({ SQL, base: BASE, requete: "DELETE FROM eleves", solutions }).message, /ligne\(s\)/);
  assert.equal(verifierEtat({ SQL, base: BASE, requete: "SELECT * FROM eleves", solutions }).reussi, false);
  assert.match(verifierEtat({ SQL, base: BASE, requete: "DELETE FROM profs", solutions }).message, /erreur/);
  assert.match(verifierEtat({ SQL, base: BASE, requete: " ", solutions }).message, /Écris/);
});

const COL = (nom, type, cle = 0) => ({ nom, type, cle, nonNul: false });
const STRUCT = (nom, colonnes, etrangeres = []) => ({ nom, colonnes, etrangeres });

test("comparerStructures accepte la même structure, sans tenir compte de la casse", () => {
  const a = [STRUCT("eleves", [COL("id", "INTEGER", 1), COL("nom", "TEXT")])];
  const o = [STRUCT("ELEVES", [COL("ID", "integer", 1), COL("Nom", "text")])];
  assert.equal(comparerStructures(a, o).reussi, true);
});

test("comparerStructures refuse une table, une colonne, un type, une clé primaire ou une clé étrangère différents", () => {
  const a = [STRUCT("notes", [COL("id", "INTEGER", 1), COL("eleve_id", "INTEGER")], [{ de: "eleve_id", table: "eleves", vers: "id" }])];
  const colonnes = a[0].colonnes;
  assert.match(comparerStructures(a, []).message, /Il manque la table notes/);
  assert.match(comparerStructures(a, [...a, STRUCT("profs", [])]).message, /profs n'est pas demandée/);
  assert.match(comparerStructures(a, [STRUCT("notes", [COL("id", "INTEGER", 1)])]).message, /colonnes/);
  assert.match(comparerStructures(a, [STRUCT("notes", [colonnes[0], COL("eleve_id", "TEXT")], a[0].etrangeres)]).message, /bon type/);
  assert.match(comparerStructures(a, [STRUCT("notes", [COL("id", "INTEGER"), colonnes[1]], a[0].etrangeres)]).message, /clé primaire/);
  assert.match(comparerStructures(a, [STRUCT("notes", colonnes)]).message, /clés étrangères/);
});

test("verifierStructure accepte deux écritures qui créent la même table", options, () => {
  const solutions = ["CREATE TABLE eleves (id INTEGER PRIMARY KEY, nom TEXT)"];
  const requete = "create table eleves(\n  id integer primary key,\n  nom text\n);";
  assert.equal(verifierStructure({ SQL, base: "", requete, solutions }).reussi, true);
});

test("verifierStructure refuse une table oubliée, un mauvais type, une erreur ou une requête vide", options, () => {
  const solutions = ["CREATE TABLE eleves (id INTEGER PRIMARY KEY, nom TEXT)"];
  assert.match(verifierStructure({ SQL, base: "", requete: "SELECT 1", solutions }).message, /Il manque la table/);
  assert.match(verifierStructure({ SQL, base: "", requete: "CREATE TABLE eleves (id TEXT PRIMARY KEY, nom TEXT)", solutions }).message, /bon type/);
  assert.match(verifierStructure({ SQL, base: "", requete: "CREATE TABLE eleves (id", solutions }).message, /erreur/);
  assert.match(verifierStructure({ SQL, base: "", requete: " ", solutions }).message, /Écris/);
});
