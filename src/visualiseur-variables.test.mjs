import test from "node:test";
import assert from "node:assert/strict";
import { determinerType } from "./type-donnees.js";

test("determinerType identifie correctement les types JavaScript", () => {
  assert.equal(determinerType(20), "number");
  assert.equal(determinerType(NaN), "number");
  assert.equal(determinerType(Infinity), "number");
  assert.equal(determinerType("Alice"), "string");
  assert.equal(determinerType(""), "string");
  assert.equal(determinerType(true), "boolean");
  assert.equal(determinerType([]), "array");
  assert.equal(determinerType([1, 2, 3]), "array");
  assert.equal(determinerType({}), "object");
  assert.equal(determinerType(null), "null");
  assert.equal(determinerType(undefined), "undefined");
  assert.equal(determinerType(() => {}), "function");
  assert.equal(determinerType(10n), "bigint");
  assert.equal(determinerType(Symbol("test")), "symbol");
});

test("la version injectée dans l'aperçu (toString) se comporte pareil", () => {
  const source = determinerType.toString().replace(/^function\s+\w+/, "function");
  const injectee = new Function(`return ${source};`)();
  for (const valeur of [1, "a", true, [], {}, null, undefined, () => {}]) {
    assert.equal(injectee(valeur), determinerType(valeur));
  }
});
