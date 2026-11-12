import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  injecterStockage,
  lireStockageApercu,
  ecrireStockageApercu,
} from "./stockage-apercu.js";

// Faux stockage pour les fonctions côté app
function stockageMemoire() {
  const d = new Map();
  return { getItem: (c) => (d.has(c) ? d.get(c) : null), setItem: (c, v) => d.set(c, String(v)) };
}

// Charge une page avec le script injecté ; renvoie la fenêtre et les messages envoyés au parent
async function charger(code, donnees) {
  const dom = new JSDOM(injecterStockage(code, donnees), { runScripts: "dangerously" });
  const messages = [];
  dom.window.addEventListener("message", (e) => messages.push(e.data));
  return { fenetre: dom.window, messages };
}

test("le doctype reste en premier (pas de mode quirks)", () => {
  const code = injecterStockage("<!DOCTYPE html><html><body></body></html>", {});
  assert.match(code, /^<!DOCTYPE html><script>/);
  assert.equal(new JSDOM(code).window.document.compatMode, "CSS1Compat");
});

test("les données de départ sont lisibles par le script de l'élève", async () => {
  const { fenetre } = await charger(
    "<p id='r'></p><script>document.getElementById('r').textContent = localStorage.getItem('score');</script>",
    { score: "7" },
  );
  assert.equal(fenetre.document.getElementById("r").textContent, "7");
  assert.equal(fenetre.localStorage.length, 1);
  assert.equal(fenetre.localStorage.getItem("absent"), null);
});

test("chaque écriture est envoyée au parent avec toutes les données", async () => {
  const { fenetre, messages } = await charger(
    "<script>localStorage.setItem('score', 3); localStorage.setItem('nom', 'Ada'); localStorage.removeItem('nom');</script>",
    {},
  );
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(fenetre.localStorage.getItem("score"), "3"); // converti en chaîne
  // JSON : les objets viennent d'un autre « monde » (la fenêtre jsdom)
  assert.deepEqual(JSON.parse(JSON.stringify(messages.at(-1))), { type: "stockage", donnees: { score: "3" } });
});

test("sessionStorage fonctionne mais n'est pas envoyé au parent", async () => {
  const { fenetre, messages } = await charger("<script>sessionStorage.setItem('a', '1');</script>", {});
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(fenetre.sessionStorage.getItem("a"), "1");
  assert.equal(messages.length, 0);
});

test("un </script> dans les données ne casse pas la page", async () => {
  const { fenetre } = await charger("<p>ok</p>", { piege: "</script><p id='x'>" });
  assert.equal(fenetre.localStorage.getItem("piege"), "</script><p id='x'>");
  assert.equal(fenetre.document.getElementById("x"), null);
});

test("côté app : les données sont rangées par exo et seules les chaînes sont gardées", () => {
  const s = stockageMemoire();
  ecrireStockageApercu("js/vanilla/18", { score: "6", objet: { a: 1 } }, s);
  assert.deepEqual(lireStockageApercu("js/vanilla/18", s), { score: "6" });
  assert.deepEqual(lireStockageApercu("js/vanilla/19", s), {});
});

test("côté app : un contenu abîmé donne un stockage vide", () => {
  const s = stockageMemoire();
  s.setItem("piscine-apercu-stockage:x", "{pas du json");
  assert.deepEqual(lireStockageApercu("x", s), {});
  s.setItem("piscine-apercu-stockage:x", "[1,2]");
  assert.deepEqual(lireStockageApercu("x", s), {});
});
