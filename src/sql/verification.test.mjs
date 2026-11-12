import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { normaliserRequete, verifierRequete, comparerResultats, verifierResultat } from "./verification.js";

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
