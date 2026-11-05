// Moteur du simulateur PTP (README §6, §8, §19). Sans interface, sans dépendance.
// 1 tick = 1 minute. Toutes les durées sont en minutes.
// Les valeurs marquées « à confirmer » sont des hypothèses (issue #23).

export const PARAMETRES_DEFAUT = {
  // --- Élèves ---
  nbEleves: 30,
  repartitionAnnees: [0.4, 0.35, 0.25], // part des 1re, 2e, 3e année (à confirmer)
  compteurInitialMax: 0,       // compteur déjà avancé à l'arrivée (0 à ce max)
  vitesse: [0.6, 1.5],         // facteur de vitesse de chaque élève, tiré dans cet intervalle

  // --- Sessions et présence ---
  // Chaque élève appartient à un groupe ; il peut venir aux sessions de son groupe.
  sessions: [{ salle: "A102", groupe: 0, debut: 0, duree: 240 }],
  probaVenir: 0.9,             // chance de venir à une session (à confirmer)
  retardMax: 30,               // arrivée entre le début et début + retardMax
  probaDepartAnticipe: 0.15,   // chance de partir avant la fin
  dureeActifMoyenne: 25,       // l'élève alterne actif / inactif (lois exponentielles)
  dureeInactifMoyenne: 6,

  // --- Exos ---
  probaValidationParMinute: 0.06, // pour un élève actif de vitesse 1 (≈ 1 exo / 17 min)
  pic: { dernieresMinutes: 30, facteur: 2 }, // fin de séance : plus de validations
  partExosNonPtp: 0.15,

  // --- Déclenchement (README §6) ---
  probaDeclenchement: [0, 0, 0, 0.1, 0.2, 0.35, 0.6, 1],
  plafond: 7,

  // --- Correcteur ---
  probaConfirmation: 0.85,     // un correcteur actif répond à la vérification de 30 s
  maxTirages: 3,               // correcteurs non confirmés avant l'appel du prof
  deplacement: [1, 4],         // minutes pour rejoindre l'élève
  probaNeVientPas: 0.05,       // confirmé mais ne se déplace pas (à confirmer)
  delaiAlerte: 10,             // alerte au prof après ce délai
  attenteMaxAvantProf: 10,     // personne de libre pendant ce délai : appel du prof
  dureeEchange: [2, 3],
  dureeProf: 5,                // échange pris en charge par le prof

  // --- Score du correcteur (coefficients sans unité) ---
  bonusAutreAnnee: 0.2,        // +20 % de score pour une autre année
  seuilPetitPool: 8,           // en dessous, la préférence d'année est ignorée
  penalitePaire: 0.5,          // score divisé par (1 + 0,5 × échanges déjà faits par la paire)
  bruit: 0.05,                 // ±5 % pour départager
};

// ---------- Aléatoire seedé (mulberry32) ----------
export function creerGenerateur(graine) {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const entier = (rng, [a, b]) => a + Math.floor(rng() * (b - a + 1));
const expo = (rng, moyenne) => Math.max(1, Math.round(-Math.log(1 - rng()) * moyenne));
function melanger(tab, rng) {
  for (let i = tab.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tab[i], tab[j]] = [tab[j], tab[i]];
  }
  return tab;
}
const clePaire = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export function fusionnerParametres(...couches) {
  const p = Object.assign({}, PARAMETRES_DEFAUT, ...couches);
  p.pic = Object.assign({}, PARAMETRES_DEFAUT.pic, ...couches.map((c) => c?.pic ?? {}));
  return p;
}

// ---------- Élèves ----------
// `donnees` (optionnel) : liste d'élèves venant d'un fichier ou de la base.
// Un même identifiant n'est gardé qu'une fois (deux onglets = un seul élève).
export function dedoublonner(donnees) {
  const vus = new Map();
  for (const d of donnees) if (!vus.has(d.id)) vus.set(d.id, d);
  return [...vus.values()];
}

function tirerAnnee(p, rng) {
  const u = rng();
  let cumul = 0;
  for (let i = 0; i < p.repartitionAnnees.length; i++) {
    cumul += p.repartitionAnnees[i];
    if (u < cumul) return i + 1;
  }
  return p.repartitionAnnees.length;
}

function creerEleves(p, rng, donnees) {
  const nbGroupes = Math.max(1, ...p.sessions.map((s) => s.groupe + 1));
  const base = donnees
    ? dedoublonner(donnees)
    : Array.from({ length: p.nbEleves }, (_, i) => ({
        id: i + 1,
        prenom: `Élève ${String(i + 1).padStart(2, "0")}`,
        annee: tirerAnnee(p, rng),
      }));
  return base.map((d, i) => ({
    id: d.id,
    nom: [d.prenom, d.nom].filter(Boolean).join(" "),
    annee: d.annee ?? 1,
    groupe: d.groupe ?? i % nbGroupes,
    vitesse: p.vitesse[0] + rng() * (p.vitesse[1] - p.vitesse[0]),
    compteur: d.compteur ?? (p.compteurInitialMax ? entier(rng, [0, p.compteurInitialMax]) : 0),
    intervalles: [],
    present: false,
    actif: false,
    prochainChangement: 0,
    etat: "libre", // libre | gele | correcteur | echange
    declenche: false,
    declencheA: null,
    derniereCorrection: -1e6,
    valides: 0,
    validesALaDerniereDemande: null,
    echangesRecus: 0,
    corrections: 0,
    premiereArrivee: null,
    premierEchange: null,
    minutesPresent: 0,
  }));
}

// Présence : pour chaque session de son groupe, l'élève vient ou non, arrive, part.
function planifierPresence(eleves, p, rng) {
  for (const e of eleves) {
    for (const [index, s] of p.sessions.entries()) {
      if (s.groupe !== e.groupe || rng() >= p.probaVenir) continue;
      const fin = s.debut + s.duree;
      const debut = s.debut + Math.floor(rng() * (p.retardMax + 1));
      const depart = rng() < p.probaDepartAnticipe ? debut + Math.floor(rng() * (fin - debut)) : fin;
      if (depart > debut) e.intervalles.push({ debut, fin: depart, session: index, finSession: fin });
    }
    // Une seule session à la fois : on coupe les chevauchements
    e.intervalles.sort((a, b) => a.debut - b.debut);
    for (let i = 1; i < e.intervalles.length; i++) {
      const prec = e.intervalles[i - 1];
      if (e.intervalles[i].debut < prec.fin) e.intervalles[i].debut = prec.fin;
    }
    e.intervalles = e.intervalles.filter((iv) => iv.fin > iv.debut);
  }
}

export const intervalleA = (e, tick) => e.intervalles.find((iv) => tick >= iv.debut && tick < iv.fin);

// ---------- Simulation ----------
export function simuler(parametres = {}, graine = 42, donnees = null) {
  const p = fusionnerParametres(parametres);
  const rng = creerGenerateur(graine);
  const eleves = creerEleves(p, rng, donnees);
  planifierPresence(eleves, p, rng);
  const parId = new Map(eleves.map((e) => [e.id, e]));

  const nbTicks = Math.max(...p.sessions.map((s) => s.debut + s.duree)) + 60;
  const evenements = [];
  const demandes = [];
  const paires = new Map();
  const appelsProf = { personneDeLibre: 0, tiragesEpuises: 0, correcteurAbsent: 0 };
  let reports = 0;
  let prochainId = 1;
  const log = (type, tick, donnees) => evenements.push({ type, tick, ...donnees });

  function confierAuProf(d, tick, raison) {
    appelsProf[raison]++;
    d.parProf = true;
    d.etat = "echange";
    d.debutEchange = tick;
    d.finA = tick + p.dureeProf;
    d.eleve.etat = "echange";
    log("appel-prof", tick, { demande: d.id, eleve: d.eleve.id, raison });
  }

  function chercherCorrecteur(d, tick, nbPresents) {
    const e = d.eleve;
    while (d.tirages < p.maxTirages) {
      const candidats = eleves.filter(
        (c) =>
          c !== e && c.present && c.etat === "libre" && !d.dejaTires.has(c.id) && intervalleA(c, tick),
      );
      if (candidats.length === 0) {
        reports++;
        if (tick - d.creeA >= p.attenteMaxAvantProf) confierAuProf(d, tick, "personneDeLibre");
        return;
      }
      const preferenceAnnee = nbPresents >= p.seuilPetitPool;
      let meilleur = null;
      let meilleurScore = -Infinity;
      for (const c of candidats) {
        const anciennete = tick - c.derniereCorrection;
        const dejaVus = paires.get(clePaire(e.id, c.id)) ?? 0;
        const score =
          anciennete *
          (preferenceAnnee && c.annee !== e.annee ? 1 + p.bonusAutreAnnee : 1) /
          (1 + p.penalitePaire * dejaVus) *
          (1 + p.bruit * (2 * rng() - 1));
        if (score > meilleurScore) [meilleur, meilleurScore] = [c, score];
      }
      d.tirages++;
      d.dejaTires.add(meilleur.id);
      // Vérification d'activité de 30 s : il faut être actif et répondre
      if (!meilleur.actif || rng() >= p.probaConfirmation) {
        log("confirmation-echouee", tick, { demande: d.id, correcteur: meilleur.id });
        continue;
      }
      d.correcteur = meilleur;
      d.etat = "deplacement";
      meilleur.etat = "correcteur"; // bloqué sur son propre exo
      meilleur.derniereCorrection = tick;
      log("correcteur-confirme", tick, { demande: d.id, eleve: e.id, correcteur: meilleur.id });
      if (rng() < p.probaNeVientPas) d.alerteA = tick + p.delaiAlerte;
      else d.arriveeA = tick + entier(rng, p.deplacement);
      return;
    }
    confierAuProf(d, tick, "tiragesEpuises");
  }

  function valider(e, tick, picEnCours) {
    e.valides++;
    e.compteur++;
    const eligible = rng() >= p.partExosNonPtp;
    if (!e.declenche) {
      const proba = e.compteur >= p.plafond ? 1 : p.probaDeclenchement[e.compteur] ?? 0;
      if (rng() < proba) {
        e.declenche = true;
        e.declencheA = tick;
        log("declenchement", tick, { eleve: e.id, compteur: e.compteur });
      }
    }
    log("validation", tick, { eleve: e.id, eligible, compteur: e.compteur });
    // L'échange a lieu au prochain exo éligible (celui-ci compris) après le déclenchement (sans nouveau tirage)
    if (e.declenche && eligible) {
      const d = {
        id: prochainId++,
        eleve: e,
        creeA: tick,
        declencheA: e.declencheA,
        compteur: e.compteur,
        exosDepuisDerniere:
          e.validesALaDerniereDemande === null ? null : e.valides - e.validesALaDerniereDemande,
        pendantPic: picEnCours,
        etat: "recherche",
        tirages: 0,
        dejaTires: new Set(),
        correcteur: null,
        parProf: false,
      };
      e.validesALaDerniereDemande = e.valides;
      e.compteur = 0;
      e.declenche = false;
      e.etat = "gele";
      demandes.push(d);
      log("demande", tick, { demande: d.id, eleve: e.id });
    }
  }

  function terminer(d, tick) {
    d.etat = "fini";
    d.finiA = tick;
    d.eleve.etat = "libre";
    d.eleve.echangesRecus++;
    d.eleve.premierEchange ??= d.debutEchange;
    if (d.correcteur) {
      d.correcteur.etat = "libre";
      d.correcteur.corrections++;
      const cle = clePaire(d.eleve.id, d.correcteur.id);
      paires.set(cle, (paires.get(cle) ?? 0) + 1);
    }
    log("fin-echange", tick, {
      demande: d.id,
      eleve: d.eleve.id,
      correcteur: d.correcteur?.id ?? null,
      parProf: d.parProf,
    });
  }

  for (let tick = 0; tick < nbTicks; tick++) {
    // 1. Présence et activité
    for (const e of eleves) {
      const iv = intervalleA(e, tick);
      if (iv && !e.present) {
        e.present = true;
        e.actif = true;
        e.prochainChangement = tick + expo(rng, p.dureeActifMoyenne);
        e.premiereArrivee ??= tick;
        log("arrivee", tick, { eleve: e.id, session: iv.session });
      } else if (!iv && e.present && e.etat === "libre") {
        // Départ ; un élève en échange finit d'abord (délai de grâce)
        e.present = false;
        e.actif = false;
        log("depart", tick, { eleve: e.id });
      }
      if (e.present) {
        e.minutesPresent++;
        if (tick >= e.prochainChangement) {
          e.actif = !e.actif;
          e.prochainChangement =
            tick + expo(rng, e.actif ? p.dureeActifMoyenne : p.dureeInactifMoyenne);
        }
      }
    }

    // 2. Avancement des échanges en cours
    for (const d of demandes) {
      if (d.etat === "deplacement" && d.alerteA !== undefined && tick >= d.alerteA) {
        d.correcteur.etat = "libre";
        log("alerte-correcteur-absent", tick, { demande: d.id, correcteur: d.correcteur.id });
        d.correcteurAbsent = d.correcteur;
        d.correcteur = null;
        confierAuProf(d, tick, "correcteurAbsent");
      } else if (d.etat === "deplacement" && d.arriveeA !== undefined && tick >= d.arriveeA) {
        d.etat = "echange";
        d.debutEchange = tick;
        d.finA = tick + entier(rng, p.dureeEchange);
        d.eleve.etat = "echange";
        d.correcteur.etat = "echange";
        log("debut-echange", tick, { demande: d.id, eleve: d.eleve.id, correcteur: d.correcteur.id });
      } else if (d.etat === "echange" && tick >= d.finA) {
        terminer(d, tick);
      }
    }

    // 3. Validations, dans un ordre mélangé à chaque tick
    for (const e of melanger([...eleves], rng)) {
      if (!e.present || !e.actif || e.etat !== "libre") continue;
      const iv = intervalleA(e, tick);
      if (!iv) continue; // délai de grâce : il finit son échange mais ne travaille plus
      const picEnCours = iv.finSession - tick <= p.pic.dernieresMinutes;
      const proba = p.probaValidationParMinute * e.vitesse * (picEnCours ? p.pic.facteur : 1);
      if (rng() < proba) valider(e, tick, picEnCours);
    }

    // 4. Tirage des correcteurs pour les demandes en attente, ordre mélangé
    const nbPresents = eleves.filter((e) => e.present).length;
    for (const d of melanger(demandes.filter((d) => d.etat === "recherche"), rng)) {
      chercherCorrecteur(d, tick, nbPresents);
    }
  }

  return { parametres: p, graine, eleves, demandes, evenements, paires, appelsProf, reports, nbTicks, parId };
}

// ---------- Mesures ----------
const moyenne = (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN);
const quantile = (v, q) => {
  if (!v.length) return NaN;
  const t = [...v].sort((a, b) => a - b);
  return t[Math.min(t.length - 1, Math.floor(q * t.length))];
};
const ecartType = (v) => {
  const m = moyenne(v);
  return Math.sqrt(moyenne(v.map((x) => (x - m) ** 2)));
};

export function mesurer(r) {
  const { eleves, demandes, paires, appelsProf, parametres: p } = r;
  const finies = demandes.filter((d) => d.etat === "fini");
  const entrePairs = finies.filter((d) => !d.parProf);
  const venus = eleves.filter((e) => e.premiereArrivee !== null);
  const corrections = venus.map((e) => e.corrections);
  const attente = finies.map((d) => d.debutEchange - d.creeA);
  const declenchementEchange = finies.map((d) => d.debutEchange - d.declencheA);
  const ecartsExos = demandes.map((d) => d.exosDepuisDerniere).filter((x) => x !== null);
  const interAnnees = entrePairs.filter((d) => d.correcteur.annee !== d.eleve.annee).length;
  // « Oublié » : présent assez longtemps pour valider plusieurs fois le plafond, sans aucun échange
  const oublies = venus.filter((e) => e.valides >= 2 * p.plafond && e.echangesRecus === 0);

  return {
    elevesVenus: venus.length,
    elevesAbsents: eleves.length - venus.length,
    exosValides: eleves.reduce((s, e) => s + e.valides, 0),
    demandes: demandes.length,
    echangesEntrePairs: entrePairs.length,
    echangesParProf: finies.length - entrePairs.length,
    demandesNonTerminees: demandes.length - finies.length,
    demandesPendantPic: demandes.filter((d) => d.pendantPic).length,
    appelsProf: { ...appelsProf },
    tiragesReportes: r.reports,
    confirmationsEchouees: r.evenements.filter((e) => e.type === "confirmation-echouee").length,
    attenteCorrecteur: { moyenne: moyenne(attente), p90: quantile(attente, 0.9), max: Math.max(0, ...attente) },
    delaiDeclenchementEchange: {
      moyenne: moyenne(declenchementEchange),
      max: Math.max(0, ...declenchementEchange),
    },
    exosEntreDeuxEchanges: {
      min: ecartsExos.length ? Math.min(...ecartsExos) : NaN,
      moyenne: moyenne(ecartsExos),
      max: ecartsExos.length ? Math.max(...ecartsExos) : NaN,
    },
    compteurMaxADemande: Math.max(0, ...demandes.map((d) => d.compteur)),
    delaiPremierEchange: moyenne(
      venus.filter((e) => e.premierEchange !== null).map((e) => e.premierEchange - e.premiereArrivee),
    ),
    corrections: { min: Math.min(...corrections), max: Math.max(...corrections), ecartType: ecartType(corrections) },
    pairesDistinctes: paires.size,
    paireMax: Math.max(0, ...paires.values()),
    partInterAnnees: entrePairs.length ? interAnnees / entrePairs.length : NaN,
    elevesOublies: oublies.length,
  };
}
