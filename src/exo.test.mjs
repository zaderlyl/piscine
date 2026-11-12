import test from "node:test";
import assert from "node:assert/strict";
import { lireType } from "./exo.js";

test("lireType : lit le type de l'en-tête, « classique » par défaut", () => {
  assert.equal(lireType("---\ntype: cours\ntitre: Les conflits\n---\n"), "cours");
  assert.equal(lireType("---\ntype: palier\n---\n"), "palier");
  assert.equal(lireType("# Sans en-tête"), "classique");
});

test("lireExo : un sous-titre ### reste dans sa section", async () => {
  const { lireExo } = await import("./exo.js");
  const sections = lireExo("## Cours\nIntro\n### Partie\nSuite\n## Énoncé\nTexte\n");
  assert.deepEqual(Object.keys(sections), ["Cours", "Énoncé"]);
  assert.match(sections["Cours"], /### Partie/);
});
