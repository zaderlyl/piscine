import test from "node:test";
import assert from "node:assert/strict";
import { lireSquelette, problemesSquelette, FICHIERS_PROJET } from "./projet.js";

const SQUELETTE = [
  "```html index.html",
  '<link rel="stylesheet" href="style.css">',
  '<script src="script.js"></script>',
  "```",
  "```css style.css",
  "```",
  "```js script.js",
  "// à toi",
  "```",
  "",
].join("\n");

test("lireSquelette : un fichier par bloc, même vide", () => {
  const fichiers = lireSquelette(SQUELETTE);
  assert.deepEqual(Object.keys(fichiers), ["index.html", "style.css", "script.js"]);
  assert.match(fichiers["index.html"], /href="style\.css"/);
  assert.equal(fichiers["style.css"], "");
  assert.equal(fichiers["script.js"], "// à toi\n");
});

test("lireSquelette : section absente ou sans bloc nommé, aucun fichier", () => {
  assert.deepEqual(lireSquelette(undefined), {});
  assert.deepEqual(lireSquelette("```html\n<p></p>\n```\n"), {});
});

test("problemesSquelette : une section absente est permise, un bon squelette aussi", () => {
  assert.deepEqual(problemesSquelette(undefined), []);
  assert.deepEqual(problemesSquelette(SQUELETTE), []);
  assert.deepEqual(problemesSquelette("```js script.js\n```\n"), []);
});

test("problemesSquelette : signale une section sans bloc nommé, un fichier inconnu et un doublon", () => {
  assert.match(problemesSquelette("du texte")[0], /aucun bloc/);
  assert.match(problemesSquelette("```html\n<p></p>\n```\n")[0], /aucun bloc/);
  assert.match(problemesSquelette("```html page.html\n<p></p>\n```\n")[0], /page\.html/);
  assert.match(problemesSquelette("```js script.js\n```\n```js script.js\n```\n")[0], /plusieurs fois/);
});

test("FICHIERS_PROJET : les trois onglets de l'éditeur", () => {
  assert.deepEqual(FICHIERS_PROJET, ["index.html", "style.css", "script.js"]);
});
