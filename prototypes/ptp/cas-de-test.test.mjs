// Rejoue cas-de-test.json (cas communs avec la future version PHP). Lancer : node --test cas-de-test.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nouvelEtat, rejoindre, validerExo, tick, battement, plafondEchanges, malusPaire } from "./ptp-logique.js";

const { cas } = JSON.parse(readFileSync(new URL("./cas-de-test.json", import.meta.url), "utf8"));
const T0 = 1_000_000;
const rng = () => 0.5; // les cas ne dépendent pas du tirage

function monter(c) {
  const s = nouvelEtat();
  Object.assign(s.config, c.config || {});
  const ids = typeof c.eleves === "number" ? Array.from({ length: c.eleves }, (_, i) => "P" + i) : c.eleves;
  for (const id of ids) rejoindre(s, { id, prenom: id, annee: 1, classe: "MMI1-A" }, T0);
  for (const id of c.absentsDepuis || []) s.eleves[id].dernierSignal = T0 - 10 * 60000;
  for (const [id, etat] of Object.entries(c.etatInitial || {})) {
    const { echangeActif, ...champs } = etat;
    Object.assign(s.eleves[id], champs);
    if (echangeActif) s.echanges["X" + id] = { id: "X" + id, eleve: id, correcteur: null, etat: "en_cours" };
  }
  for (const [k, v] of Object.entries(c.pairesDernier || {})) s.pairesDernier[k] = T0 + v;
  Object.keys(c.pairesDernier || {}).forEach((k) => s.paires.push(k));
  return { s, ids, absents: c.absentsDepuis || [] };
}

for (const c of cas) {
  test(`cas JSON : ${c.nom}`, () => {
    const { s, ids, absents } = monter(c);
    for (const a of c.actions || []) {
      const now = T0 + a.t;
      for (const id of ids) if (!absents.includes(id)) battement(s, id, now);
      if (a.valider) validerExo(s, a.valider, now, rng);
      if (a.tick) tick(s, now, rng);
    }
    const att = c.attendu;
    if (att.plafond != null) assert.equal(plafondEchanges(s, T0), att.plafond);
    for (const [id, champs] of Object.entries(att.eleves || {}))
      for (const [k, v] of Object.entries(champs)) assert.equal(s.eleves[id][k], v, `${id}.${k}`);
    if (att.echanges) {
      const reels = Object.values(s.echanges).filter((e) => !e.id.startsWith("X"));
      assert.equal(reels.length, att.echanges.length, "nombre d'échanges");
      att.echanges.forEach((e, i) => { for (const [k, v] of Object.entries(e)) assert.equal(reels[i][k], v, `échange ${i}.${k}`); });
    }
    for (const m of att.malusPaire || []) assert.ok(Math.abs(malusPaire(s, m.a, m.b, T0 + m.t) - m.valeur) < 1e-9, `malus ${m.a}|${m.b} à ${m.t}`);
  });
}
