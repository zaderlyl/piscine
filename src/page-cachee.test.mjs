import test from "node:test";
import assert from "node:assert/strict";
import { lirePage, problemesPage, contenusPageCachee } from "./page-cachee.js";

const PAGE = '<html><body><button id="a">Ok</button><script src="script.js"></script></body></html>';

test("lirePage : renvoie le HTML de la section « Page », ou rien", () => {
  assert.equal(lirePage({ Page: "```html\n" + PAGE + "\n```\n" }), PAGE + "\n");
  assert.equal(lirePage({ Énoncé: "x" }), "");
});

test("problemesPage : accepte une page avec la balise script, signale une page vide ou sans script", () => {
  assert.deepEqual(problemesPage(PAGE), []);
  assert.deepEqual(problemesPage("<script src='script.js'></script>"), []);
  assert.match(problemesPage("")[0], /pas de bloc/);
  assert.match(problemesPage("<html><body></body></html>")[0], /script\.js/);
  assert.match(problemesPage('<script src="autre.js"></script>')[0], /script\.js/);
});

test("contenusPageCachee : la page devient index.html et le script de l'élève script.js", () => {
  assert.deepEqual(contenusPageCachee(PAGE, "let a = 1;"), { "index.html": PAGE, "script.js": "let a = 1;" });
});
