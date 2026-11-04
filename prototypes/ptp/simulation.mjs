// Simulateur du tirage PTP (README §6 et §19). Sans interface, sans dépendance.
// Lancer : node prototypes/ptp/simulation.mjs [graine]
// Même graine = même résultat, pour comparer deux réglages.

// ---------- Paramètres : à régler ici ----------
const PARAMETRES = {
  nbEleves: 30,
  nbAnnees: 3,            // les élèves sont répartis sur les années 1 à 3
  nbTicks: 3000,          // une unité de temps = un tick
  probaConnexion: 0.6,    // chance qu'un élève soit connecté à un tick donné
  probaValidation: 0.05,  // chance qu'un élève connecté valide un exo à un tick
  partExosNonPtp: 0.15,   // part des exos marqués « ptp: non » (jamais tirés)
  // Chance de déclenchement, indexée par le nombre d'exos validés depuis le dernier PTP
  probaDeclenchement: [0, 0, 0, 0.10, 0.20, 0.35, 0.60, 1.00],
  plafond: 7,             // à partir de ce compteur, déclenchement garanti
  dureeEchange: 3,        // ticks pendant lesquels élève et correcteur sont occupés
  bonusAutreAnnee: 50,    // bonus (en ticks d'ancienneté) pour un correcteur d'une autre année
  penalitePaire: 200,     // pénalité si cette paire s'est déjà vue récemment
  fenetrePaire: 300,      // « récemment » : nombre de ticks
};

// ---------- Générateur aléatoire seedé (mulberry32) ----------
function creerGenerateur(graine) {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Modèle ----------
function creerEleves(p, rng) {
  return Array.from({ length: p.nbEleves }, (_, i) => ({
    id: i,
    nom: `Élève ${String(i + 1).padStart(2, "0")}`,
    annee: (i % p.nbAnnees) + 1,
    connecte: false,
    occupeJusquA: -1,        // tick jusqu'auquel l'élève est en échange
    dernierCorrection: -p.nbTicks, // jamais corrigé : très ancien
    compteur: 0,             // exos validés depuis le dernier PTP reçu
    validés: 0,
    echangesRecus: 0,
    corrections: 0,
    validesAuDernierEchange: null,
    ecartMin: Infinity,      // plus petit nombre d'exos validés entre deux échanges reçus
  }));
}

function creerStats() {
  return { tirages: 0, reportes: 0, paires: new Map() };
}

// Choisit le correcteur : libre, connecté, pas soi-même, le moins récemment sollicité d'abord.
function choisirCorrecteur(eleve, eleves, p, tick, stats, rng) {
  let meilleur = null;
  let meilleurScore = -Infinity;
  for (const c of eleves) {
    if (c === eleve || !c.connecte || c.occupeJusquA > tick) continue;
    const cle = [eleve.id, c.id].sort((a, b) => a - b).join("-");
    const derniere = stats.paires.get(cle);
    const pairRecente = derniere !== undefined && tick - derniere < p.fenetrePaire;
    const score =
      (tick - c.dernierCorrection) +
      (c.annee !== eleve.annee ? p.bonusAutreAnnee : 0) -
      (pairRecente ? p.penalitePaire : 0) +
      rng() * 10; // petit bruit pour départager les ex æquo
    if (score > meilleurScore) {
      meilleurScore = score;
      meilleur = c;
    }
  }
  return meilleur;
}

// Un élève vient de valider un exo : compteur, déclenchement, éventuel échange.
function valider(eleve, eleves, p, tick, stats, rng) {
  eleve.validés++;
  eleve.compteur++;
  if (rng() < p.partExosNonPtp) return; // exo « ptp: non » : pas d'échange possible

  const index = Math.min(eleve.compteur, p.plafond);
  const proba = index >= p.plafond ? 1 : p.probaDeclenchement[index];
  if (rng() >= proba) return;

  stats.tirages++;
  const correcteur = choisirCorrecteur(eleve, eleves, p, tick, stats, rng);
  if (!correcteur) {
    stats.reportes++; // personne de libre : le compteur reste, l'élève n'attend pas
    return;
  }
  if (correcteur === eleve) throw new Error("Un élève ne peut pas se corriger lui-même");

  // Échange : le compteur de l'élève repart de zéro
  if (eleve.validesAuDernierEchange !== null) {
    eleve.ecartMin = Math.min(eleve.ecartMin, eleve.validés - eleve.validesAuDernierEchange);
  }
  eleve.validesAuDernierEchange = eleve.validés;
  eleve.compteur = 0;
  eleve.echangesRecus++;
  eleve.occupeJusquA = tick + p.dureeEchange;
  correcteur.occupeJusquA = tick + p.dureeEchange;
  correcteur.corrections++;
  correcteur.dernierCorrection = tick;

  const cle = [eleve.id, correcteur.id].sort((a, b) => a - b).join("-");
  stats.paires.set(cle, tick);
}

// ---------- Simulation ----------
function simuler(p, graine) {
  const rng = creerGenerateur(graine);
  const eleves = creerEleves(p, rng);
  const stats = creerStats();

  for (let tick = 0; tick < p.nbTicks; tick++) {
    for (const e of eleves) e.connecte = rng() < p.probaConnexion;
    for (const e of eleves) {
      if (!e.connecte || e.occupeJusquA > tick) continue;
      if (rng() < p.probaValidation) valider(e, eleves, p, tick, stats, rng);
    }
  }
  return { eleves, stats };
}

// ---------- Affichage ----------
const largeurs = [12, 6, 8, 8, 12, 14];
const entetes = ["Élève", "Année", "Validés", "Reçus", "Corrections", "Écart corr."];

function ligne(cellules) {
  return cellules.map((c, i) => String(c).padEnd(largeurs[i])).join(" ").trimEnd();
}

function afficher(p, graine, { eleves, stats }) {
  const moyenneCorrections = eleves.reduce((s, e) => s + e.corrections, 0) / eleves.length;
  const totalEchanges = eleves.reduce((s, e) => s + e.echangesRecus, 0);
  const totalCorrections = eleves.reduce((s, e) => s + e.corrections, 0);
  if (totalEchanges !== totalCorrections) throw new Error("Incohérence : échanges reçus ≠ corrections");

  console.log(`Simulation PTP : ${p.nbEleves} élèves, ${p.nbTicks} ticks, graine ${graine}`);
  console.log(`Plafond ${p.plafond} · repos : 0 % en dessous de 3 · correction ${p.dureeEchange} ticks\n`);
  console.log(ligne(entetes));
  console.log("-".repeat(largeurs.reduce((s, l) => s + l + 1, 0) - 1));
  for (const e of eleves) {
    const ecart = e.corrections - moyenneCorrections;
    console.log(
      ligne([
        e.nom,
        e.annee,
        e.validés,
        e.echangesRecus,
        e.corrections,
        (ecart >= 0 ? "+" : "") + ecart.toFixed(1),
      ]),
    );
  }

  const sansEchange = eleves.filter((e) => e.echangesRecus === 0).length;
  const ecartMin = Math.min(...eleves.map((e) => e.ecartMin));

  console.log("\nBilan");
  console.log(`- Tirages déclenchés : ${stats.tirages}`);
  console.log(`- Échanges réalisés : ${totalEchanges}`);
  console.log(`- Tirages reportés (personne de libre) : ${stats.reportes}`);
  console.log(`- Élèves sans aucun échange reçu : ${sansEchange}`);
  console.log(
    `- Plus petit nombre d'exos validés entre deux échanges reçus : ${Number.isFinite(ecartMin) ? ecartMin : "—"} (repos attendu : ≥ 3)`,
  );
  console.log(`- Paires distinctes ayant eu au moins un échange : ${stats.paires.size}`);
  console.log(`- Écart type des corrections : ${ecartType(eleves.map((e) => e.corrections)).toFixed(2)}`);

  if (Number.isFinite(ecartMin) && ecartMin < 3) {
    console.log("\n⚠️  Le repos de 3 exos n'est pas respecté : vérifie les paramètres.");
  }
}

function ecartType(valeurs) {
  const moyenne = valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
  return Math.sqrt(valeurs.reduce((s, v) => s + (v - moyenne) ** 2, 0) / valeurs.length);
}

const graine = Number(process.argv[2] ?? 42);
afficher(PARAMETRES, graine, simuler(PARAMETRES, graine));
