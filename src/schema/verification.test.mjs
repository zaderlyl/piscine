import test from "node:test";
import assert from "node:assert/strict";
import { lireSchema } from "./lecture.js";
import { verifierSchema } from "./verification.js";

const schema = lireSchema(`
table: eleves
colonnes: ?[id|nom|age] ?[id|nom|age]
types: ?[texte|nombre] ?[texte|nombre]
lignes:
- 1 | Alice
reponses: id, nom, nombre, texte
`);

test("verifierSchema réussit quand toutes les réponses sont justes", () => {
  const r = verifierSchema(schema, ["id", "nom", "nombre", "texte"]);
  assert.equal(r.reussi, true);
  assert.equal(r.resultats.length, 4);
  assert.ok(r.resultats.every((x) => x.ok));
});

test("verifierSchema signale chaque case fausse avec un conseil adapté à la rangée", () => {
  const r = verifierSchema(schema, ["nom", "nom", "texte", "texte"]);
  assert.equal(r.reussi, false);
  assert.deepEqual(r.resultats.map((x) => x.ok), [false, true, false, true]);
  assert.match(r.resultats[0].message, /nom/); // conseil des colonnes
  assert.match(r.resultats[2].message, /nombres, du texte ou des dates/); // conseil des types
});

test("verifierSchema demande de choisir quand une case est vide ou manquante", () => {
  const r = verifierSchema(schema, ["id", "", "nombre"]);
  assert.equal(r.reussi, false);
  assert.equal(r.resultats[1].message, "Choisis une réponse.");
  assert.equal(r.resultats[3].message, "Choisis une réponse.");
});
