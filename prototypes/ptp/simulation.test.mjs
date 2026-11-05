// Tests du simulateur PTP. Lancer : node --test prototypes/ptp/
import { test } from "node:test";
import assert from "node:assert/strict";
import { simuler, mesurer, dedoublonner, intervalleA } from "./moteur.mjs";
import { chargerScenario, listerScenarios } from "./simulation.mjs";

const GRAINES = [1, 2, 3, 42];
const parametresDe = (nom) => {
  const { description, ...p } = chargerScenario(nom);
  return p;
};
const toutes = listerScenarios().flatMap((nom) =>
  GRAINES.map((g) => ({ nom, graine: g, r: simuler(parametresDe(nom), g) })),
);
const parType = (r, type) => r.evenements.filter((e) => e.type === type);

test("même graine, même résultat", () => {
  const a = mesurer(simuler(parametresDe("normal"), 7));
  const b = mesurer(simuler(parametresDe("normal"), 7));
  assert.deepEqual(a, b);
});

test("repos : au moins 3 exos validés entre deux demandes d'un même élève", () => {
  for (const { nom, graine, r } of toutes) {
    for (const d of r.demandes) {
      if (d.exosDepuisDerniere !== null)
        assert.ok(d.exosDepuisDerniere >= 3, `${nom}/${graine} : demande ${d.id}`);
    }
  }
});

test("jamais d'auto-correction", () => {
  for (const { r } of toutes) for (const d of r.demandes) assert.notEqual(d.correcteur?.id, d.eleve.id);
});

test("un correcteur confirmé est présent dans sa session et n'est pas absent", () => {
  for (const { nom, r } of toutes) {
    for (const ev of parType(r, "correcteur-confirme")) {
      const c = r.parId.get(ev.correcteur);
      assert.ok(intervalleA(c, ev.tick), `${nom} : correcteur ${c.id} hors session au tick ${ev.tick}`);
    }
  }
});

test("un élève qui ne vient pas n'est jamais tiré", () => {
  const r = simuler({ ...parametresDe("absences"), probaVenir: 0.5 }, 5);
  const absents = new Set(r.eleves.filter((e) => e.intervalles.length === 0).map((e) => e.id));
  assert.ok(absents.size > 0);
  for (const ev of r.evenements) {
    assert.ok(!absents.has(ev.eleve) && !absents.has(ev.correcteur), `${ev.type} au tick ${ev.tick}`);
  }
});

test("un correcteur n'est jamais dans deux échanges à la fois", () => {
  for (const { nom, r } of toutes) {
    const occupe = new Map();
    for (const ev of r.evenements) {
      if (ev.type === "correcteur-confirme") {
        assert.ok(!occupe.has(ev.correcteur), `${nom} : ${ev.correcteur} déjà occupé`);
        assert.ok(!occupe.has(ev.eleve) || occupe.get(ev.eleve) === "eleve");
        occupe.set(ev.correcteur, "correcteur");
      }
      if (ev.type === "alerte-correcteur-absent") occupe.delete(ev.correcteur);
      if (ev.type === "fin-echange" && ev.correcteur !== null) occupe.delete(ev.correcteur);
    }
  }
});

test("l'échange part du premier exo éligible après le déclenchement", () => {
  for (const { nom, r } of toutes) {
    const enAttente = new Map();
    for (const ev of r.evenements) {
      if (ev.type === "declenchement") enAttente.set(ev.eleve, true);
      if (ev.type === "validation" && enAttente.get(ev.eleve) && ev.eligible) {
        enAttente.set(ev.eleve, "doit-demander");
      } else if (ev.type === "demande") {
        assert.equal(enAttente.get(ev.eleve), "doit-demander", `${nom} : demande sans exo éligible`);
        enAttente.delete(ev.eleve);
      } else if (ev.type === "validation") {
        assert.notEqual(enAttente.get(ev.eleve), "doit-demander", `${nom} : demande oubliée`);
      }
    }
  }
});

test("toutes les demandes aboutissent, et l'attente reste bornée", () => {
  for (const { nom, graine, r } of toutes) {
    const m = mesurer(r);
    const p = r.parametres;
    assert.equal(m.demandesNonTerminees, 0, `${nom}/${graine}`);
    const borne = Math.max(p.attenteMaxAvantProf, p.delaiAlerte, p.deplacement[1]);
    assert.ok(m.attenteCorrecteur.max <= borne, `${nom}/${graine} : attente ${m.attenteCorrecteur.max}`);
  }
});

test("personne n'est oublié sur une longue simulation", () => {
  for (const g of GRAINES) {
    const r = simuler(parametresDe("longue"), g);
    const m = mesurer(r);
    assert.equal(m.elevesOublies, 0);
    for (const e of r.eleves.filter((e) => e.premiereArrivee !== null)) {
      assert.ok(e.corrections > 0, `graine ${g} : élève ${e.id} n'a jamais corrigé`);
    }
  }
});

test("une même paire ne revient pas en boucle", () => {
  for (const g of GRAINES) {
    const m = mesurer(simuler(parametresDe("longue"), g));
    assert.ok(m.paireMax <= 4, `graine ${g} : paire répétée ${m.paireMax} fois`);
  }
});

test("un élève n'est que dans une session à la fois", () => {
  for (const { r } of toutes) {
    for (const e of r.eleves) {
      for (let i = 1; i < e.intervalles.length; i++)
        assert.ok(e.intervalles[i].debut >= e.intervalles[i - 1].fin);
    }
  }
});

test("les sessions simultanées partagent le tirage", () => {
  const r = simuler(parametresDe("sessions-paralleles"), 42);
  const groupe = (id) => r.parId.get(id).groupe;
  const croises = parType(r, "correcteur-confirme").filter((ev) => groupe(ev.eleve) !== groupe(ev.correcteur));
  assert.ok(croises.length > 0);
});

test("dédoublonnage : un élève ouvert deux fois n'est compté qu'une fois", () => {
  const donnees = [{ id: 1, annee: 1 }, { id: 2, annee: 2 }, { id: 1, annee: 1 }];
  assert.equal(dedoublonner(donnees).length, 2);
  assert.equal(simuler(parametresDe("normal"), 1, donnees).eleves.length, 2);
});

test("le compteur initial venu des données est repris", () => {
  const donnees = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, annee: 1 + (i % 2), compteur: 6 }));
  const r = simuler({ probaVenir: 1, retardMax: 0, probaDepartAnticipe: 0 }, 3, donnees);
  const premieres = new Map();
  for (const d of r.demandes) if (!premieres.has(d.eleve.id)) premieres.set(d.eleve.id, d.compteur);
  // Avec un compteur à 6, la première demande arrive très vite (compteur ≥ 7 dès le 1er exo)
  for (const c of premieres.values()) assert.ok(c >= 7);
});
