// Simulation d'une séance PTP avec des élèves fictifs (issue #23).
// Elle rejoue la vraie logique de ptp-logique.js (même tirage, mêmes règles) sur une séance entière,
// pour régler les probabilités, le repos et le plafond, et mesurer l'équité.
//
// Lancer :  node simuler.mjs                      (30 élèves, scénario « normal »)
//           node simuler.mjs --scenario petit-pool
//           node simuler.mjs --eleves 50 --graine 7 --seance 240
//           node simuler.mjs --liste              (liste les scénarios)
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import {
  nouvelEtat, rejoindre, battement, validerExo, relancer, tick, confirmer, saisirCode,
  donnerAvis, cloreParProf, CONFIG_DEFAUT, PROBAS_DEFAUT,
} from "./ptp-logique.js";

// =====================================================================================
// RÉGLAGES (à modifier ici). Les durées « S » sont en secondes, « Min » en minutes.
// =====================================================================================
export const PARAMS = {
  graine: 42,                 // même graine = même résultat (pour comparer deux réglages)
  nbEleves: 30,
  classes: [                  // une classe = une seule année ; `part` = proportion des élèves
    { nom: "MMI1-A", annee: 1, part: 0.4 },
    { nom: "MMI1-B", annee: 1, part: 0.3 },
    { nom: "MMI2-A", annee: 2, part: 0.2 },
    { nom: "MMI3-A", annee: 3, part: 0.1 },
  ],
  seanceMin: 180,             // durée de la séance
  pasS: 10,                   // pas de la simulation (10 s : assez fin pour la vérification de 30 s)

  // Présence
  probVenir: 0.9,             // probabilité qu'un élève vienne à la séance
  retardMaxMin: 30,           // il arrive entre le début et ce retard
  departAnticipeProb: 0.15,   // part des élèves qui partent avant la fin

  // Travail
  vitesseExoMin: 12,          // minutes moyennes par exo
  vitesseFacteur: [0.5, 2],   // chaque élève a sa vitesse : moyenne × un facteur tiré dans cet intervalle
  probEligible: 0.85,         // part des exos qui peuvent déclencher un échange (les autres : `ptp: non`)

  // Tirage : table de probabilité de déclenchement (README §6), modifiable ici
  probaDeclenchement: PROBAS_DEFAUT, // [exos 0, 1, 2, 3, ... depuis le dernier échange]

  // Correcteur
  probRepond: 0.9,            // répond à la vérification d'activité (sinon libéré au bout de 30 s)
  delaiReponseS: [3, 25],
  probAbsentApresConfirmation: 0.05, // confirme mais ne vient pas (appel du prof après 10 min)
  deplacementS: [30, 120],
  explicationS: [120, 240],
  probAvis: { bon: 0.85, erreur: 0.10, doute: 0.05 },
  delaiProfS: 300,            // le prof clôt un échange en alerte au bout de 5 min

  // Surcharges de CONFIG_DEFAUT (ptp-logique.js) : plafond, repos, bonus, portée…
  reglages: {},               // exemple : { plafondSession: 2, portee: "classe_seule", topN: 4 }
};

// Scénarios nommés : chacun surcharge quelques réglages.
export const SCENARIOS = {
  normal: {},
  absences: { probVenir: 0.7, departAnticipeProb: 0.3 },
  "petit-pool": { nbEleves: 6, classes: [{ nom: "MMI1-A", annee: 1, part: 1 }] },
  "classe-impaire": { nbEleves: 5, classes: [{ nom: "MMI1-A", annee: 1, part: 1 }] },
  "classe-seule": { reglages: { portee: "classe_seule" } },
  "toutes-les-classes": { reglages: { portee: "toutes" } },
  "correcteurs-absents": { probRepond: 0.5, probAbsentApresConfirmation: 0.2 },
  "tout-declenche": { probaDeclenchement: [1] },
  "sans-plafond": { reglages: { plafondSession: 999 } },
};

// =====================================================================================

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fusionner(base, surcharge = {}) {
  return { ...base, ...surcharge, reglages: { ...base.reglages, ...surcharge.reglages } };
}

export function simuler(surcharge = {}) {
  const P = fusionner(PARAMS, surcharge);
  const rng = mulberry32(P.graine);
  const entre = ([a, b]) => a + rng() * (b - a);
  const t0 = 1_000_000;
  const fin = t0 + P.seanceMin * 60000;

  const s = nouvelEtat();
  s.config = { ...CONFIG_DEFAUT, probas: P.probaDeclenchement, ...P.reglages };

  // --- Élèves fictifs ---
  const total = P.classes.reduce((t, c) => t + c.part, 0);
  const eleves = [];
  P.classes.forEach((c, i) => {
    const n = i === P.classes.length - 1 ? P.nbEleves - eleves.length : Math.round((c.part / total) * P.nbEleves);
    for (let k = 0; k < n && eleves.length < P.nbEleves; k++) {
      const id = "E" + String(eleves.length + 1).padStart(2, "0");
      const vient = rng() < P.probVenir;
      const arrivee = t0 + rng() * P.retardMaxMin * 60000;
      const part = vient && rng() < P.departAnticipeProb;
      const depart = part ? arrivee + 30 * 60000 + rng() * Math.max(0, fin - arrivee - 30 * 60000) : fin;
      const minParExo = P.vitesseExoMin * entre(P.vitesseFacteur);
      eleves.push({
        id, classe: c.nom, annee: c.annee, vient, arrivee, depart,
        pValider: P.pasS / (minParExo * 60), rejoint: false, recus: 0, attentes: [],
      });
    }
  });
  const parId = Object.fromEntries(eleves.map((e) => [e.id, e]));
  const connecte = (e, now) => e.vient && e.rejoint && now < e.depart;

  const plans = {};
  const plan = (cle, creer) => (plans[cle] ??= creer());
  const verdict = () => {
    let r = rng();
    for (const [v, p] of Object.entries(P.probAvis)) { if ((r -= p) <= 0) return v; }
    return "bon";
  };

  // --- Séance ---
  for (let now = t0; now < fin; now += P.pasS * 1000) {
    // Ordre mélangé à chaque pas : personne n'est toujours servi le premier
    const ordre = [...eleves];
    for (let i = ordre.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
    }
    for (const e of ordre) {
      if (e.vient && !e.rejoint && now >= e.arrivee) {
        rejoindre(s, { id: e.id, prenom: e.id, annee: e.annee, classe: e.classe }, now);
        e.rejoint = true;
      }
      if (!connecte(e, now)) continue;
      battement(s, e.id, now);
      const x = s.eleves[e.id];
      if (x.etat !== "libre") continue;
      if (x.exoEnAttente) relancer(s, e.id, now, rng);
      else if (rng() < e.pValider) validerExo(s, e.id, now, rng, rng() < P.probEligible);
    }

    // Comportement des correcteurs et des élèves pendant les échanges
    for (const ech of Object.values(s.echanges)) {
      const el = parId[ech.eleve];
      const co = ech.correcteur ? parId[ech.correcteur] : null;
      if (ech.etat === "verification" && co) {
        const p = plan(`v${ech.id}:${co.id}`, () => ({ repond: rng() < P.probRepond, a: now + entre(P.delaiReponseS) * 1000 }));
        if (p.repond && now >= p.a && connecte(co, now) && confirmer(s, co.id, now, rng).ok) {
          el.attentes.push((now - ech.creeLe) / 1000);
        }
      } else if (ech.etat === "confirme" && co) {
        const p = plan(`c${ech.id}`, () => ({ absent: rng() < P.probAbsentApresConfirmation, a: now + entre(P.deplacementS) * 1000 }));
        if (!p.absent && now >= p.a && connecte(el, now) && connecte(co, now)) saisirCode(s, el.id, ech.code, now);
      } else if (ech.etat === "en_cours" && co) {
        const p = plan(`e${ech.id}`, () => ({ a: now + entre(P.explicationS) * 1000, v: verdict() }));
        if (now >= p.a && connecte(co, now)) {
          if (donnerAvis(s, co.id, p.v, "", now).ok) el.recus++;
        }
      } else if (ech.etat === "appel_prof") {
        const p = plan(`p${ech.id}`, () => ({ a: now + P.delaiProfS * 1000 }));
        if (now >= p.a) cloreParProf(s, ech.id, now);
      }
    }
    tick(s, now, rng);
  }

  return statistiques(s, eleves, P, t0, fin);
}

// --------------------------------------------------------------------- statistiques

const moyenne = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
const ecartType = (v) => { const m = moyenne(v); return Math.sqrt(moyenne(v.map((x) => (x - m) ** 2))); };
const quantile = (v, q) => { if (!v.length) return 0; const t = [...v].sort((a, b) => a - b); return t[Math.min(t.length - 1, Math.floor(q * t.length))]; };

function statistiques(s, eleves, P, t0, fin) {
  const lignes = eleves.map((e) => {
    const x = s.eleves[e.id];
    const presence = e.vient ? Math.max(0, (Math.min(e.depart, fin) - e.arrivee) / 60000) : 0;
    return {
      id: e.id, classe: e.classe, vient: e.vient, presenceMin: Math.round(presence),
      exos: x ? x.valides : 0, recus: e.recus, corrections: x ? x.corrections : 0,
      attenteMoy: e.attentes.length ? Math.round(moyenne(e.attentes)) : null,
    };
  });
  const presents = lignes.filter((l) => l.vient);
  const corr = presents.map((l) => l.corrections);
  const echanges = Object.values(s.echanges);
  const compte = (etat) => echanges.filter((x) => x.etat === etat).length;
  const attentes = eleves.flatMap((e) => e.attentes);
  const paires = {};
  s.paires.forEach((k) => (paires[k] = (paires[k] || 0) + 1));
  const longtemps = presents.filter((l) => l.presenceMin >= 60);
  const moy = moyenne(corr);
  const resume = {
    elevesVenus: presents.length,
    echangesTermines: compte("termine"),
    echangesReportes: compte("reporte"),
    echangesExpires: compte("expire"),
    appelsProf: compte("appel_prof") + compte("clos_par_prof"),
    echangesEnCoursALaFin: echanges.filter((x) => ["recherche", "file", "verification", "confirme", "en_cours"].includes(x.etat)).length,
    correctionsMin: Math.min(...corr), correctionsMax: Math.max(...corr),
    correctionsMoyenne: +moy.toFixed(2), correctionsEcartType: +ecartType(corr).toFixed(2),
    rapportMaxSurMoyenne: moy ? +(Math.max(...corr) / moy).toFixed(2) : 0,
    jamaisCorrecteurAlorsPresent1h: longtemps.filter((l) => l.corrections === 0).length,
    elevesPresent1h: longtemps.length,
    pairesDistinctes: Object.keys(paires).length,
    pairePlusRepetee: Math.max(0, ...Object.values(paires)),
    attenteMoyenneS: Math.round(moyenne(attentes)), attenteMedianeS: Math.round(quantile(attentes, 0.5)),
    attenteP90S: Math.round(quantile(attentes, 0.9)),
  };
  return { lignes, resume, params: P, etat: s };
}

// --------------------------------------------------------------------- affichage

function afficher({ lignes, resume, params }, nomScenario) {
  const col = (t, n) => String(t).padEnd(n);
  const num = (t, n) => String(t).padStart(n);
  console.log(`\nSimulation PTP : scénario « ${nomScenario} », ${params.nbEleves} élèves, séance de ${params.seanceMin} min, graine ${params.graine}\n`);
  console.log(`${col("Élève", 6)} ${col("Classe", 7)} ${num("Présent", 8)} ${num("Exos", 5)} ${num("Reçus", 6)} ${num("Corrigé", 8)} ${num("Attente moy.", 13)}`);
  console.log("-".repeat(58));
  for (const l of lignes) {
    if (!l.vient) { console.log(`${col(l.id, 6)} ${col(l.classe, 7)}  absent`); continue; }
    console.log(`${col(l.id, 6)} ${col(l.classe, 7)} ${num(l.presenceMin + " min", 8)} ${num(l.exos, 5)} ${num(l.recus, 6)} ${num(l.corrections, 8)} ${num(l.attenteMoy == null ? "-" : l.attenteMoy + " s", 13)}`);
  }
  const r = resume;
  console.log("\nBilan");
  console.log(`  Échanges terminés : ${r.echangesTermines} · reportés : ${r.echangesReportes} · expirés : ${r.echangesExpires} · appels du prof : ${r.appelsProf} · en cours à la fin : ${r.echangesEnCoursALaFin}`);
  console.log(`  Corrections par élève (venus) : min ${r.correctionsMin}, max ${r.correctionsMax}, moyenne ${r.correctionsMoyenne}, écart-type ${r.correctionsEcartType}, max/moyenne ${r.rapportMaxSurMoyenne}`);
  console.log(`  Élèves présents plus d'1 h qui n'ont jamais corrigé : ${r.jamaisCorrecteurAlorsPresent1h} sur ${r.elevesPresent1h}`);
  console.log(`  Paires distinctes : ${r.pairesDistinctes} · paire la plus répétée : ${r.pairePlusRepetee} fois`);
  console.log(`  Attente avant l'arrivée d'un correcteur : moyenne ${r.attenteMoyenneS} s, médiane ${r.attenteMedianeS} s, 90 % en moins de ${r.attenteP90S} s\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: {
      scenario: { type: "string", default: "normal" }, eleves: { type: "string" },
      graine: { type: "string" }, seance: { type: "string" }, liste: { type: "boolean", default: false },
    },
  });
  if (values.liste) {
    console.log("Scénarios :\n" + Object.entries(SCENARIOS).map(([k, v]) => `  ${k.padEnd(20)} ${JSON.stringify(v)}`).join("\n"));
  } else if (!SCENARIOS[values.scenario]) {
    console.error(`Scénario inconnu : ${values.scenario}. Lance avec --liste pour voir les scénarios.`);
    process.exitCode = 1;
  } else {
    const surcharge = { ...SCENARIOS[values.scenario] };
    if (values.eleves) surcharge.nbEleves = Number(values.eleves);
    if (values.graine) surcharge.graine = Number(values.graine);
    if (values.seance) surcharge.seanceMin = Number(values.seance);
    afficher(simuler(surcharge), values.scenario);
  }
}
