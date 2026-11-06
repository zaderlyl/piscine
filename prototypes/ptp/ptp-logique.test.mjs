// Cahier de recette du §9 de programme-ptp.md (cas à 4 élèves A, B, C, D).
// Lancer : node --test prototype-ptp/
import test from "node:test";
import assert from "node:assert/strict";
import {
  nouvelEtat, rejoindre, validerExo, tick, confirmer, saisirCode, donnerAvis, annuler,
  relancer, cloreParProf, probabilite, tirerPondere, battement, scorer, plafondEchanges, malusPaire,
} from "./ptp-logique.js";

// Générateur pseudo-aléatoire déterministe (injecté, pour des tests reproductibles)
function graine(n) {
  return () => {
    n = (n * 1664525 + 1013904223) % 4294967296;
    return n / 4294967296;
  };
}

function session(prenoms = ["A", "B", "C", "D"], annees = [1, 2, 3, 1]) {
  const s = nouvelEtat();
  s.config.toujours = true; // chaque exo validé déclenche un échange
  const t0 = 1_000_000;
  prenoms.forEach((p, i) => rejoindre(s, { id: p, prenom: p, annee: annees[i], salle: "A1" }, t0));
  return { s, t0 };
}

function terminer(s, demandeur, t, rng, verdict = "bon") {
  validerExo(s, demandeur, t, rng);
  const ech = s.echanges[s.eleves[demandeur].echangeId];
  assert.equal(ech.etat, "verification");
  confirmer(s, ech.correcteur, t, rng);
  assert.ok(saisirCode(s, demandeur, ech.code, t).ok);
  donnerAvis(s, ech.correcteur, verdict, "", t);
  return ech;
}

test("table de probabilité du README", () => {
  assert.deepEqual([0, 2, 3, 4, 5, 6, 7, 9].map((n) => probabilite(n)), [0, 0, 0.1, 0.2, 0.35, 0.6, 1, 1]);
});

test("1. un des autres est tiré, jamais le demandeur", () => {
  const { s, t0 } = session();
  const rng = graine(1);
  validerExo(s, "A", t0, rng);
  const ech = s.echanges[s.eleves.A.echangeId];
  assert.notEqual(ech.correcteur, "A");
  assert.ok(["B", "C", "D"].includes(ech.correcteur));
  assert.equal(s.eleves[ech.correcteur].etat, "reserve");
});

test("2. 60 tirages : chacun des trois autres est tiré, pas toujours le même", () => {
  const compte = { B: 0, C: 0, D: 0 };
  const rng = graine(7);
  for (let i = 0; i < 60; i++) {
    const { s, t0 } = session();
    validerExo(s, "A", t0, rng);
    compte[s.echanges[s.eleves.A.echangeId].correcteur]++;
  }
  for (const k of Object.keys(compte)) assert.ok(compte[k] > 10, `${k} tiré ${compte[k]} fois sur 60`);
});

test("3. A et B en échange : C demande, seul D est candidat", () => {
  const { s, t0 } = session();
  s.config.diviseurPlafond = 1; // pas de plafond d'échanges : ce test porte sur autre chose (voir P1 à P5)
  const rng = graine(2);
  validerExo(s, "A", t0, rng);
  const e1 = s.echanges[s.eleves.A.echangeId];
  // on force B comme correcteur de A
  const pris = e1.correcteur;
  const reste = ["B", "C", "D"].filter((x) => x !== pris);
  validerExo(s, reste[0], t0, rng);
  const e2 = s.echanges[s.eleves[reste[0]].echangeId];
  assert.equal(e2.correcteur, reste[1]);
});

test("4. candidats tous occupés (cas rare, le plafond l'évite) : recherche de 2 min, puis échange perdu", () => {
  const { s, t0 } = session();
  const rng = graine(3);
  for (const id of "BCD") s.eleves[id].etat = "en_echange"; // connectés mais tous occupés
  validerExo(s, "A", t0, rng);
  const ech = s.echanges[s.eleves.A.echangeId];
  assert.equal(ech.etat, "recherche");
  assert.equal(s.eleves.A.etat, "en_recherche"); // gelé pendant la recherche
  for (const id of "ABCD") battement(s, id, t0 + 100000);
  tick(s, t0 + 100000, rng);
  assert.equal(s.echanges[ech.id].etat, "recherche");
  for (const id of "ABCD") battement(s, id, t0 + 130000);
  tick(s, t0 + 130000, rng);
  assert.equal(s.echanges[ech.id].etat, "perdu");
  assert.equal(s.eleves.A.etat, "libre");
  assert.equal(s.eleves.A.exoEnAttente, false);
  assert.equal(s.eleves.A.declenche, false, "perdu : pas de report");
  assert.equal(s.eleves.A.exoIdx, 1, "il passe à l'exo suivant");
});

test("5. seul connecté : report sans geler, le déclenchement reste", () => {
  const { s, t0 } = session(["A"]);
  s.eleves.A.declenche = true;
  s.config.toujours = false;
  validerExo(s, "A", t0, graine(4));
  assert.equal(s.eleves.A.etat, "libre");
  assert.equal(s.eleves.A.declenche, true);
  assert.equal(s.eleves.A.exoIdx, 1);
});

test("6. une paire déjà vue est évitée quand le pool est assez grand", () => {
  const prenoms = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const { s, t0 } = session(prenoms, [1, 1, 1, 1, 1, 1, 1, 1]);
  s.paires.push("A|B");
  let b = 0;
  for (let i = 0; i < 80; i++) {
    const copie = structuredClone(s);
    validerExo(copie, "A", t0, graine(100 + i));
    if (copie.echanges[copie.eleves.A.echangeId].correcteur === "B") b++;
  }
  assert.ok(b < 10, `B tiré ${b} fois sur 80 (attendu : bien moins que 80/7)`);
});

test("7. pool de 2 : B est tiré même si la paire s'est déjà vue", () => {
  const { s, t0 } = session(["A", "B"], [1, 2]);
  s.paires.push("A|B");
  validerExo(s, "A", t0, graine(5));
  assert.equal(s.echanges[s.eleves.A.echangeId].correcteur, "B");
});

test("8. deux demandes simultanées : jamais A corrige B et B corrige A", () => {
  for (let i = 0; i < 100; i++) {
    const { s, t0 } = session();
    s.config.diviseurPlafond = 1; // pas de plafond d'échanges : ce test porte sur autre chose (voir P1 à P5)
    const rng = graine(200 + i);
    validerExo(s, "A", t0, rng);
    validerExo(s, "B", t0, rng);
    const ea = s.echanges[s.eleves.A.echangeId];
    const eb = s.eleves.B.echangeId ? s.echanges[s.eleves.B.echangeId] : null;
    if (ea && eb) assert.ok(!(ea.correcteur === "B" && eb.correcteur === "A"));
    const reserves = Object.values(s.eleves).filter((x) => x.etat === "reserve").map((x) => x.id);
    assert.equal(new Set(reserves).size, reserves.length);
  }
});

test("9. correcteur qui ne répond pas en 30 s : libéré, un autre est tiré", () => {
  const { s, t0 } = session();
  const rng = graine(6);
  validerExo(s, "A", t0, rng);
  const ech = s.echanges[s.eleves.A.echangeId];
  const premier = ech.correcteur;
  for (const id of "ABCD") battement(s, id, t0 + 31000);
  tick(s, t0 + 31000, rng);
  assert.equal(s.eleves[premier].etat, "libre");
  assert.notEqual(ech.correcteur, premier);
  assert.equal(ech.etat, "verification");
});

test("10. correcteur confirmé qui ne vient pas depuis 10 min : appel du prof", () => {
  const { s, t0 } = session();
  const rng = graine(8);
  validerExo(s, "A", t0, rng);
  const ech = s.echanges[s.eleves.A.echangeId];
  confirmer(s, ech.correcteur, t0, rng);
  const t = t0 + 601000;
  for (const id of "ABCD") battement(s, id, t);
  tick(s, t, rng);
  assert.equal(ech.etat, "appel_prof");
  assert.ok(cloreParProf(s, ech.id, t).ok);
  assert.equal(s.eleves.A.etat, "libre");
});

test("11. annulation : déclenchement conservé, exo suivant bloqué", () => {
  const { s, t0 } = session();
  const rng = graine(9);
  validerExo(s, "A", t0, rng);
  const ech = s.echanges[s.eleves.A.echangeId];
  const corr = ech.correcteur;
  assert.ok(annuler(s, "A", t0).ok);
  assert.equal(s.eleves[corr].etat, "libre");
  assert.equal(s.eleves.A.exoEnAttente, true);
  assert.equal(validerExo(s, "A", t0, rng).ok, false);
  assert.ok(relancer(s, "A", t0, rng).ok);
});

test("12. onglet fermé en plein échange : l'échange expire, l'autre est libéré", () => {
  const { s, t0 } = session();
  const rng = graine(10);
  validerExo(s, "A", t0, rng);
  const ech = s.echanges[s.eleves.A.echangeId];
  const corr = ech.correcteur;
  confirmer(s, corr, t0, rng);
  const t = t0 + 200000; // A ne bat plus
  for (const id of "BCD") battement(s, id, t);
  tick(s, t, rng);
  assert.equal(ech.etat, "expire");
  assert.equal(s.eleves[corr].etat, "libre");
});

test("parcours complet : avis positif débloque l'exo suivant, négatif non", () => {
  const { s, t0 } = session();
  const rng = graine(11);
  terminer(s, "A", t0, rng, "bon");
  assert.equal(s.eleves.A.exoIdx, 1);
  terminer(s, "A", t0 + 1000, rng, "erreur");
  assert.equal(s.eleves.A.exoIdx, 1);
  assert.equal(s.eleves.A.depuisPtp, 0);
});

test("le tirage pondéré ne dépasse jamais le top N", () => {
  const scores = Array.from({ length: 20 }, (_, i) => ({ id: "x" + i, score: 20 - i }));
  const rng = graine(12);
  for (let i = 0; i < 500; i++) {
    const id = tirerPondere(scores, 6, rng);
    assert.ok(Number(id.slice(1)) < 6);
  }
});

// ---------- Classes : une classe = une seule année ----------

function classes(def) {
  // def : { "MMI1-A": [annee, ["A", "B", "C"]], ... }
  const s = nouvelEtat();
  s.config.toujours = true;
  const t0 = 1_000_000;
  for (const [classe, [annee, noms]] of Object.entries(def))
    for (const n of noms) rejoindre(s, { id: n, prenom: n, annee, classe }, t0);
  return { s, t0 };
}

function corrigeur(s, demandeur, t0, rng) {
  const copie = structuredClone(s);
  validerExo(copie, demandeur, t0, rng);
  const ech = copie.echanges[copie.eleves[demandeur].echangeId];
  return ech.correcteur ? copie.eleves[ech.correcteur] : null;
}

test("C1. classe de 5 (nombre impair) : jamais soi-même, tous les autres sont tirés", () => {
  const { s, t0 } = classes({ "MMI1-A": [1, ["A", "B", "C", "D", "E"]] });
  const vus = new Set();
  const rng = graine(300);
  for (let i = 0; i < 80; i++) {
    const c = corrigeur(s, "A", t0, rng);
    assert.notEqual(c.id, "A");
    vus.add(c.id);
  }
  assert.deepEqual([...vus].sort(), ["B", "C", "D", "E"]);
});

test("C2. classe de 5 : deux échanges en même temps laissent un élève libre, sans blocage", () => {
  const { s, t0 } = classes({ "MMI1-A": [1, ["A", "B", "C", "D", "E"]] });
  s.config.diviseurPlafond = 1; // pas de plafond d'échanges : ce test porte sur autre chose (voir P1 à P5)
  const rng = graine(301);
  validerExo(s, "A", t0, rng);
  validerExo(s, "B", t0, rng);
  const enCours = Object.values(s.echanges).filter((e) => e.etat === "verification");
  assert.equal(enCours.length, 2);
  const corr = enCours.map((e) => e.correcteur);
  assert.equal(new Set(corr).size, 2, "pas le même correcteur deux fois");
  const libres = Object.values(s.eleves).filter((e) => e.etat === "libre");
  assert.equal(libres.length, 1);
});

test("C3. classe de 3 : A et B sont pris, C demande : recherche de 2 min, puis perdu (rare : le plafond l'évite)", () => {
  const { s, t0 } = classes({ "MMI1-A": [1, ["A", "B", "C"]] });
  const rng = graine(302);
  s.eleves.A.etat = "en_echange";
  s.eleves.B.etat = "en_echange";
  validerExo(s, "C", t0, rng);
  const ech = s.echanges[s.eleves.C.echangeId];
  assert.equal(ech.etat, "recherche");
  for (const id of "ABC") battement(s, id, t0 + 130000);
  tick(s, t0 + 130000, rng);
  assert.equal(ech.etat, "perdu");
  assert.equal(s.eleves.C.etat, "libre");
});

test("C4. toutes les classes : les autres classes sont tirées même quand la classe est grande", () => {
  const { s, t0 } = classes({
    "MMI1-A": [1, ["A", "B", "C", "D", "E", "F", "G", "H"]],
    "MMI2-A": [2, ["P", "Q", "R", "S", "T", "U", "V", "W"]],
  });
  const rng = graine(306);
  let autres = 0;
  for (let i = 0; i < 200; i++) if (corrigeur(s, "A", t0, rng).classe !== "MMI1-A") autres++;
  assert.ok(autres > 20, `autres classes tirées ${autres} fois sur 200`);
});

test("C5. classe de 2 : le correcteur vient d'une autre classe, sans seuil de correcteurs libres", () => {
  const { s, t0 } = classes({ "MMI1-A": [1, ["A", "B"]], "MMI2-A": [2, ["P", "Q", "R", "S", "T", "U"]] });
  const rng = graine(305);
  let autres = 0;
  for (let i = 0; i < 100; i++) if (corrigeur(s, "A", t0, rng).classe === "MMI2-A") autres++;
  assert.ok(autres > 50, `autre classe tirée ${autres} fois sur 100`);
});

test("C8. dans une classe d'une seule année, le bonus d'année ne joue pas", () => {
  const { s, t0 } = classes({ "MMI1-A": [1, ["A", "B", "C", "D", "E", "F", "G", "H"]] });
  const cands = Object.values(s.eleves).filter((e) => e.id !== "A");
  const scores = scorer(s, cands, s.eleves.A, t0);
  assert.equal(new Set(scores.map((x) => x.score.toFixed(3))).size, 1, "tous les candidats ont le même score");
});

// ---------- Réglages et éligibilité ----------

test("R1. la table de probabilité est modifiable : table à 100 % dès le 1er exo", () => {
  const { s, t0 } = session(["A", "B"], [1, 1]);
  s.config.toujours = false;
  s.config.probas = [1];
  validerExo(s, "A", t0, graine(20));
  assert.equal(s.eleves.A.declenche, true);
});

test("R2. exo non éligible : validé, avancement, mais pas d'échange", () => {
  const { s, t0 } = session(["A", "B", "C"], [1, 1, 1]);
  validerExo(s, "A", t0, graine(21), false);
  assert.equal(s.eleves.A.etat, "libre");
  assert.equal(s.eleves.A.exoIdx, 1);
  assert.equal(s.eleves.A.valides, 1);
  assert.equal(Object.keys(s.echanges).length, 0);
});

test("R3. déclenchement en attente : l'échange a lieu au prochain exo éligible, pas à un exo non éligible", () => {
  const { s, t0 } = session(["A", "B", "C"], [1, 1, 1]);
  s.config.toujours = false;
  s.eleves.A.declenche = true;
  validerExo(s, "A", t0, graine(22), false);
  assert.equal(s.eleves.A.declenche, true, "le déclenchement reste en attente");
  assert.equal(Object.keys(s.echanges).length, 0);
  validerExo(s, "A", t0 + 1000, graine(22), true);
  assert.equal(Object.keys(s.echanges).length, 1);
});

// ---------- Plafond d'échanges en cours, recherche de 2 min, paires ----------

function connectes(n, annee = 1) {
  const s = nouvelEtat();
  s.config.toujours = true;
  const t0 = 1_000_000;
  for (let i = 0; i < n; i++) rejoindre(s, { id: "P" + i, prenom: "P" + i, annee, classe: "MMI1-A" }, t0);
  return { s, t0 };
}

test("P1. plafond = connectés ÷ 5, arrondi au supérieur (17 connectés : 4 échanges)", () => {
  const { s, t0 } = connectes(17);
  assert.equal(plafondEchanges(s, t0), 4);
  assert.equal(plafondEchanges(connectes(15).s, 1_000_000), 3);
  assert.equal(plafondEchanges(connectes(16).s, 1_000_000), 4);
  assert.equal(plafondEchanges(connectes(1).s, 1_000_000), 1);
});

test("P2. les absents ne comptent pas dans le plafond", () => {
  const { s, t0 } = connectes(17);
  for (let i = 0; i < 7; i++) s.eleves["P" + i].dernierSignal = t0 - 10 * 60000; // 7 absents : 10 connectés
  assert.equal(plafondEchanges(s, t0), 2);
});

test("P3. au plafond : l'échange est reporté sans geler, le déclenchement reste", () => {
  const { s, t0 } = connectes(10); // plafond 2
  const rng = graine(40);
  validerExo(s, "P0", t0, rng);
  validerExo(s, "P1", t0, rng);
  assert.equal(s.eleves.P0.etat, "en_recherche");
  const libre = Object.values(s.eleves).find((x) => x.etat === "libre").id;
  validerExo(s, libre, t0, rng);
  assert.equal(s.eleves[libre].etat, "libre", "pas gelé");
  assert.equal(s.eleves[libre].exoIdx, 1);
  assert.equal(Object.values(s.echanges).filter((x) => x.etat === "reporte").length, 1);
  s.config.toujours = false;
  const autre = Object.values(s.eleves).find((x) => x.etat === "libre" && x.id !== libre);
  autre.declenche = true;
  validerExo(s, autre.id, t0, rng);
  assert.equal(autre.declenche, true, "report : le déclenchement reste");
});

test("P4. le nombre d'échanges en cours ne dépasse jamais le plafond", () => {
  const { s, t0 } = connectes(17);
  const rng = graine(41);
  for (let i = 0; i < 17; i++) validerExo(s, "P" + i, t0, rng);
  const actifs = Object.values(s.echanges).filter((e) => ["recherche", "verification", "confirme", "en_cours"].includes(e.etat));
  assert.equal(actifs.length, 4);
});

test("P5. correcteur qui ne répond pas : la recherche continue jusqu'à 2 min, puis perdu", () => {
  const { s, t0 } = session(["A", "B"], [1, 1]);
  const rng = graine(42);
  validerExo(s, "A", t0, rng); // B est tiré, ne répond jamais
  const ech = s.echanges[s.eleves.A.echangeId];
  assert.equal(ech.etat, "verification");
  for (const id of "AB") battement(s, id, t0 + 31000);
  tick(s, t0 + 31000, rng);
  assert.equal(ech.etat, "recherche", "plus personne à tirer : on attend");
  for (const id of "AB") battement(s, id, t0 + 121000);
  tick(s, t0 + 121000, rng);
  assert.equal(ech.etat, "perdu");
  assert.equal(s.eleves.B.etat, "libre");
});

test("P6. paire répétée : permise, malus fort juste après, de plus en plus faible ensuite", () => {
  const { s, t0 } = session(["A", "B"], [1, 1]);
  s.paires.push("A|B");
  s.pairesDernier["A|B"] = t0;
  const m = (dt) => malusPaire(s, "A", "B", t0 + dt);
  assert.ok(Math.abs(m(0) - s.config.malusPaire) < 1e-9);
  assert.ok(m(0) < m(30 * 60000) && m(30 * 60000) < m(3 * 3600000));
  assert.ok(m(6 * 3600000) > 0.95, "longtemps après, la pénalité a presque disparu");
  assert.equal(malusPaire(s, "A", "C", t0), 1, "une autre paire n'a aucun malus");
});

test("P7. un échange terminé enregistre la date de la paire", () => {
  const { s, t0 } = session(["A", "B"], [1, 1]);
  terminer(s, "A", t0 + 5000, graine(43));
  assert.equal(s.pairesDernier["A|B"], t0 + 5000);
});
