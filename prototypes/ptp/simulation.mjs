// Simulateur du tirage PTP : lancement en ligne de commande.
// node prototypes/ptp/simulation.mjs [scénario] [graine] [--eleves fichier.json] [--detail]
// node prototypes/ptp/simulation.mjs --liste
// Même scénario + même graine = même résultat.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { simuler, mesurer } from "./moteur.mjs";

const ici = dirname(fileURLToPath(import.meta.url));
const dossierScenarios = join(ici, "scenarios");

export function chargerScenario(nom) {
  try {
    return JSON.parse(readFileSync(join(dossierScenarios, `${nom}.json`), "utf8"));
  } catch {
    throw new Error(`Scénario inconnu : « ${nom} ». Voir --liste.`);
  }
}

export function listerScenarios() {
  return readdirSync(dossierScenarios)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

const pct = (x) => (Number.isFinite(x) ? `${Math.round(x * 100)} %` : "—");
const num = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "—");

function afficherDetail(r) {
  const larg = [22, 6, 8, 8, 12, 10];
  const ligne = (c) => c.map((x, i) => String(x).padEnd(larg[i])).join(" ").trimEnd();
  console.log(ligne(["Élève", "Année", "Validés", "Reçus", "Corrections", "Présent"]));
  console.log("-".repeat(70));
  for (const e of r.eleves) {
    const present = e.premiereArrivee === null ? "absent" : `${e.minutesPresent} min`;
    console.log(ligne([e.nom, e.annee, e.valides, e.echangesRecus, e.corrections, present]));
  }
  console.log();
}

function afficherBilan(nom, description, r, m) {
  const p = r.parametres;
  console.log(`Scénario « ${nom} », graine ${r.graine}`);
  if (description) console.log(description);
  console.log(
    `${r.eleves.length} élèves, ${p.sessions.length} session(s), 1 tick = 1 minute. ` +
      `Plafond ${p.plafond}, échange ${p.dureeEchange.join(" à ")} min, alerte à ${p.delaiAlerte} min.\n`,
  );
  const repos = p.probaDeclenchement.findIndex((x) => x > 0);
  const lignes = [
    ["Présence", `${m.elevesVenus} venus, ${m.elevesAbsents} absents`],
    ["Exos validés", m.exosValides],
    ["Demandes d'échange", `${m.demandes} (dont ${m.demandesPendantPic} en fin de séance)`],
    ["Échanges entre élèves", m.echangesEntrePairs],
    ["Échanges pris par le prof", m.echangesParProf],
    [
      "Appels du prof",
      `${m.appelsProf.personneDeLibre} personne de libre, ${m.appelsProf.tiragesEpuises} tirages épuisés, ` +
        `${m.appelsProf.correcteurAbsent} correcteur absent`,
    ],
    ["Demandes non terminées", m.demandesNonTerminees],
    ["Tirages reportés (minutes)", m.tiragesReportes],
    ["Confirmations échouées", m.confirmationsEchouees],
    [
      "Attente d'un correcteur",
      `moy. ${num(m.attenteCorrecteur.moyenne)} min, 90 % sous ${m.attenteCorrecteur.p90} min, max ${m.attenteCorrecteur.max} min`,
    ],
    [
      "Déclenchement → échange",
      `moy. ${num(m.delaiDeclenchementEchange.moyenne)} min, max ${m.delaiDeclenchementEchange.max} min`,
    ],
    [
      "Exos entre deux échanges",
      `min ${m.exosEntreDeuxEchanges.min} (repos attendu ≥ ${repos}), moy. ${num(m.exosEntreDeuxEchanges.moyenne)}, max ${m.exosEntreDeuxEchanges.max}`,
    ],
    ["Compteur max à la demande", `${m.compteurMaxADemande} (plafond ${p.plafond})`],
    ["Premier échange", `${num(m.delaiPremierEchange, 0)} min après l'arrivée, en moyenne`],
    [
      "Corrections par élève venu",
      `de ${m.corrections.min} à ${m.corrections.max}, écart type ${num(m.corrections.ecartType, 2)}`,
    ],
    ["Paires", `${m.pairesDistinctes} distinctes, la plus répétée ${m.paireMax} fois`],
    ["Échanges inter-années", pct(m.partInterAnnees)],
    ["Élèves oubliés", m.elevesOublies],
  ];
  const largeur = Math.max(...lignes.map(([k]) => k.length));
  for (const [k, v] of lignes) console.log(`${k.padEnd(largeur)} : ${v}`);

  if (m.exosEntreDeuxEchanges.min < repos) console.log(`\n⚠️  Repos de ${repos} exos non respecté.`);
  if (m.elevesOublies > 0) console.log("\n⚠️  Des élèves actifs n'ont reçu aucun échange.");
}

function main(argv) {
  const args = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--eleves");
  if (argv.includes("--liste")) {
    for (const nom of listerScenarios()) console.log(`${nom.padEnd(22)} ${chargerScenario(nom).description ?? ""}`);
    return;
  }
  const nom = args[0] ?? "normal";
  const graine = Number(args[1] ?? 42);
  const iFichier = argv.indexOf("--eleves");
  const donnees = iFichier >= 0 ? JSON.parse(readFileSync(argv[iFichier + 1], "utf8")) : null;
  const { description, ...parametres } = chargerScenario(nom);
  const r = simuler(parametres, graine, donnees);
  if (argv.includes("--detail")) afficherDetail(r);
  afficherBilan(nom, description, r, mesurer(r));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
