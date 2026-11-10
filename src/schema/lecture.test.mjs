import test from "node:test";
import assert from "node:assert/strict";
import { lireSchema } from "./lecture.js";

const SCHEMA = `
table: eleves
colonnes: ?[id|nom|age|classe]  ?[id|nom|age|classe]  age
lignes:
- 1 | Alice | 17
- 2 | Bruno | 18
reponses: id, nom
`;

test("lireSchema lit la table, les trous et les lignes", () => {
  const s = lireSchema(SCHEMA);
  assert.equal(s.table, "eleves");
  assert.equal(s.trous, 2);
  assert.deepEqual(s.lignes, [
    ["1", "Alice", "17"],
    ["2", "Bruno", "18"],
  ]);
  const colonnes = s.entetes[0];
  assert.equal(colonnes.nom, "colonnes");
  assert.equal(colonnes.cases.length, 3);
  assert.deepEqual(colonnes.cases[0], {
    type: "trou",
    choix: ["id", "nom", "age", "classe"],
    reponse: "id",
  });
  assert.equal(colonnes.cases[1].reponse, "nom");
  assert.deepEqual(colonnes.cases[2], { type: "fixe", texte: "age" });
});

test("lireSchema accepte plusieurs rangées d'en-tête", () => {
  const s = lireSchema(`
table: produits
colonnes: nom prix
types: ?[texte|nombre|date] ?[texte|nombre|date]
lignes:
- Stylo | 2
reponses: texte, nombre
`);
  assert.equal(s.entetes.length, 2);
  assert.equal(s.entetes[1].nom, "types");
  assert.equal(s.trous, 2);
});

test("lireSchema refuse un nombre de réponses différent du nombre de trous", () => {
  assert.throws(
    () => lireSchema(SCHEMA.replace("reponses: id, nom", "reponses: id")),
    /2 trou\(s\) mais 1 réponse/,
  );
});

test("lireSchema refuse une réponse absente des choix", () => {
  assert.throws(
    () => lireSchema(SCHEMA.replace("reponses: id, nom", "reponses: id, prix")),
    /« prix » du trou 2 n'est pas dans ses choix/,
  );
});

test("lireSchema refuse un schéma sans table, sans en-tête ou sans réponses", () => {
  assert.throws(() => lireSchema("colonnes: a b\nreponses: "), /table/);
  assert.throws(() => lireSchema("table: t\nreponses: "), /rangée d'en-tête/);
  assert.throws(() => lireSchema("table: t\ncolonnes: a b"), /reponses/);
});

test("lireSchema refuse une ligne illisible", () => {
  assert.throws(() => lireSchema("table: t\n???"), /illisible/);
});
