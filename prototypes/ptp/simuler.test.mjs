// Vérifie que la simulation tourne et respecte les règles. Lancer : node --test simuler.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { simuler, SCENARIOS } from "./simuler.mjs";

test("même graine : même résultat ; autre graine : autre résultat", () => {
  const a = simuler({ graine: 5 }).resume;
  const b = simuler({ graine: 5 }).resume;
  const c = simuler({ graine: 6 }).resume;
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

test("tous les scénarios tournent sans erreur et font au moins un échange", () => {
  for (const [nom, surcharge] of Object.entries(SCENARIOS)) {
    const r = simuler(surcharge).resume;
    assert.ok(r.echangesTermines >= 1, `${nom} : aucun échange terminé`);
  }
});

test("invariants : personne ne se corrige, les comptes concordent, les absents ne corrigent pas", () => {
  for (const graine of [1, 2, 3, 42]) {
    const { etat: s, lignes, resume } = simuler({ graine });
    const termines = Object.values(s.echanges).filter((e) => e.etat === "termine");
    for (const e of termines) assert.notEqual(e.eleve, e.correcteur);
    assert.equal(lignes.reduce((t, l) => t + l.corrections, 0), resume.echangesTermines);
    assert.equal(lignes.reduce((t, l) => t + l.recus, 0), resume.echangesTermines);
    for (const l of lignes.filter((x) => !x.vient)) assert.equal(l.corrections + l.recus, 0);
  }
});

test("plafond d'échanges : un plafond serré reporte plus d'échanges qu'un plafond large", () => {
  const serre = simuler({ ...SCENARIOS["plafond-serre"], graine: 3, probaDeclenchement: [1] }).resume;
  const large = simuler({ ...SCENARIOS["plafond-large"], graine: 3, probaDeclenchement: [1] }).resume;
  assert.ok(serre.echangesReportes > large.echangesReportes, `${serre.echangesReportes} contre ${large.echangesReportes}`);
});

test("un échange non trouvé après la recherche est perdu, sans report", () => {
  const { etat: s } = simuler({ graine: 3, probaDeclenchement: [1], reglages: { rechercheMs: 20000, verifMs: 30000 }, probRepond: 0 });
  const perdus = Object.values(s.echanges).filter((e) => e.etat === "perdu");
  assert.ok(perdus.length > 0, "au moins un échange perdu");
  for (const e of perdus) assert.equal(e.correcteur, null);
});

test("table de probabilité modifiable : [1] déclenche bien plus d'échanges que la table du README", () => {
  const normal = simuler({ graine: 3 }).resume.echangesTermines;
  const tout = simuler({ graine: 3, probaDeclenchement: [1] }).resume.echangesTermines;
  assert.ok(tout > normal * 2, `${tout} contre ${normal}`);
});
