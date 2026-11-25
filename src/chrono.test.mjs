import { test } from "node:test";
import assert from "node:assert/strict";
import { creerChrono, lireTempsActif, INACTIVITE_MAX_MS } from "./chrono.js";

// Faux stockage en mémoire
function stockageMemoire() {
  const d = new Map();
  return { getItem: (c) => (d.has(c) ? d.get(c) : null), setItem: (c, v) => d.set(c, String(v)) };
}

// Fausse horloge qu'on avance à la main
function horloge(depart = 1_000_000) {
  let t = depart;
  const f = () => t;
  f.avancer = (ms) => (t += ms);
  return f;
}

const SEC = 1000;
const MIN = 60 * SEC;

test("compte le temps quand l'élève est actif", () => {
  const h = horloge();
  const c = creerChrono({ exo: "html/vanilla/04", stockage: stockageMemoire(), maintenant: h });
  h.avancer(30 * SEC);
  c.activite();
  h.avancer(20 * SEC);
  assert.equal(c.temps(), 50 * SEC);
});

test("ne compte pas quand la page est cachée, et repart au retour", () => {
  const h = horloge();
  const c = creerChrono({ exo: "e", stockage: stockageMemoire(), maintenant: h });
  h.avancer(10 * SEC);
  c.definirEtat({ visible: false, focus: true });
  h.avancer(5 * MIN);
  c.definirEtat({ visible: true, focus: true });
  h.avancer(10 * SEC);
  assert.equal(c.temps(), 20 * SEC);
});

test("ne compte pas quand la page perd le focus", () => {
  const h = horloge();
  const c = creerChrono({ exo: "e", stockage: stockageMemoire(), maintenant: h });
  c.definirEtat({ visible: true, focus: false });
  h.avancer(MIN);
  assert.equal(c.temps(), 0);
  c.definirEtat({ visible: true, focus: true });
  h.avancer(SEC);
  assert.equal(c.temps(), SEC);
});

test("s'arrête après deux minutes sans action et repart à la prochaine", () => {
  const h = horloge();
  const c = creerChrono({ exo: "e", stockage: stockageMemoire(), maintenant: h });
  h.avancer(10 * MIN); // aucune action : seules les 2 premières minutes comptent
  assert.equal(c.temps(), INACTIVITE_MAX_MS);
  c.activite(); // l'élève revient
  h.avancer(15 * SEC);
  assert.equal(c.temps(), INACTIVITE_MAX_MS + 15 * SEC);
});

test("une action repousse la fin de la période d'inactivité", () => {
  const h = horloge();
  const c = creerChrono({ exo: "e", stockage: stockageMemoire(), maintenant: h });
  h.avancer(90 * SEC);
  c.activite();
  h.avancer(90 * SEC);
  assert.equal(c.temps(), 180 * SEC);
});

test("le retour de la page compte comme une action", () => {
  const h = horloge();
  const c = creerChrono({ exo: "e", stockage: stockageMemoire(), maintenant: h });
  c.definirEtat({ visible: false, focus: true });
  h.avancer(10 * MIN);
  c.definirEtat({ visible: true, focus: true });
  h.avancer(30 * SEC);
  assert.equal(c.temps(), 30 * SEC);
});

test("cumule par exo dans le stockage, d'un chargement à l'autre", () => {
  const s = stockageMemoire();
  const h = horloge();
  const a = creerChrono({ exo: "html/vanilla/04", stockage: s, maintenant: h });
  h.avancer(40 * SEC);
  a.sauvegarder();
  assert.equal(lireTempsActif("html/vanilla/04", s), 40 * SEC);

  const b = creerChrono({ exo: "html/vanilla/04", stockage: s, maintenant: h });
  h.avancer(20 * SEC);
  b.sauvegarder();
  assert.equal(lireTempsActif("html/vanilla/04", s), 60 * SEC);
  assert.equal(lireTempsActif("html/vanilla/05", s), 0, "chaque exo a son propre temps");
});

test("deux onglets sur le même exo additionnent leurs temps", () => {
  const s = stockageMemoire();
  const h = horloge();
  const a = creerChrono({ exo: "e", stockage: s, maintenant: h });
  const b = creerChrono({ exo: "e", stockage: s, maintenant: h });
  h.avancer(10 * SEC);
  a.sauvegarder();
  b.sauvegarder();
  assert.equal(lireTempsActif("e", s), 20 * SEC);
});

test("sauvegarder deux fois de suite n'ajoute rien de plus", () => {
  const s = stockageMemoire();
  const h = horloge();
  const c = creerChrono({ exo: "e", stockage: s, maintenant: h });
  h.avancer(10 * SEC);
  c.sauvegarder();
  c.sauvegarder();
  assert.equal(lireTempsActif("e", s), 10 * SEC);
});

test("un stockage illisible ne fait pas planter", () => {
  const abime = { getItem: () => "pas du json{", setItem: () => {} };
  assert.equal(lireTempsActif("e", abime), 0);
  const h = horloge();
  const c = creerChrono({ exo: "e", stockage: abime, maintenant: h });
  h.avancer(SEC);
  assert.doesNotThrow(() => c.sauvegarder());
});
