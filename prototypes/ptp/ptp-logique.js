// Logique du tirage PTP (voir CONCEPTION.md). Aucune interface, aucun accès au navigateur :
// tout prend l'état `s`, l'heure `now` (ms) et un générateur aléatoire `rng` en paramètres, pour être testable.

// Probabilité de déclenchement selon les exos validés depuis le dernier échange (README §6).
// Case i = exos validés depuis le dernier échange ; la dernière case vaut pour tous les nombres plus grands.
export const PROBAS_DEFAUT = [0, 0, 0, 0.10, 0.20, 0.35, 0.60, 1.0];

export const CONFIG_DEFAUT = {
  signalMs: 120000,      // un élève est « présent » si son dernier signal a moins de 2 min (proposition : 90 s)
  verifMs: 30000,        // vérification d'activité du correcteur
  confirmeMs: 600000,    // correcteur confirmé qui ne vient pas : appel du prof
  rechercheMs: 120000,   // recherche d'un correcteur (~2 min) ; sans résultat, l'échange est perdu et l'élève passe à l'exo suivant
  diviseurPlafond: 5,    // échanges en cours au maximum : connectés ÷ 5, arrondi au supérieur (17 connectés : 4 échanges)
  codeMs: 300000,        // validité du code à 6 chiffres
  essaisCodeMax: 5,
  topN: 6,
  petitPool: 6,          // en dessous : on relâche la contrainte « paire déjà vue » et la préférence d'année
  plafondSession: 3,     // corrections max par correcteur et par session
  repetitionMs: 900000,  // « pas deux d'affilée » : a déjà corrigé il y a moins de 15 min
  bonusAnnee: 0.2,
  bonusEquite: 0.3,
  malusPaire: 0.1,       // malus d'une paire qui vient de corriger ensemble ; il s'atténue ensuite
  demiViePaireMs: 3600000, // la moitié du malus de paire a disparu après 1 h (à régler au pilote)
  malusRepet: 0.3,
  baseMaxMin: 60,        // l'ancienneté plafonne après 60 min
  plancher: 0.05,
  toujours: false,       // démo : déclencher un échange à chaque exo validé
  probas: PROBAS_DEFAUT, // table de déclenchement (modifiable, voir simuler.mjs)
  // Portée du tirage : toutes les classes, comme le README §6 (pas de seuil de correcteurs libres).
};

// Probabilité de déclenchement pour `depuisPtp` exos validés.
export function probabilite(depuisPtp, table = PROBAS_DEFAUT) {
  return table[Math.min(depuisPtp, table.length - 1)];
}

export function nouvelEtat() {
  // `paires` : une entrée par échange terminé ; `pairesDernier` : date du dernier échange de chaque paire
  return { config: { ...CONFIG_DEFAUT }, eleves: {}, echanges: {}, paires: [], pairesDernier: {}, journal: [], suite: 1 };
}

const log = (s, now, texte) => {
  s.journal.push({ t: now, texte });
  if (s.journal.length > 200) s.journal.shift();
};
const nom = (s, id) => (s.eleves[id] ? s.eleves[id].prenom : id);
const present = (s, e, now) => now - e.dernierSignal <= s.config.signalMs;
const cle = (a, b) => [a, b].sort().join("|");

// Plafond d'échanges en cours : connectés (tous comptes, toutes séances ; les absents ne comptent pas) ÷ 5, arrondi au supérieur.
export function plafondEchanges(s, now) {
  const connectes = Object.values(s.eleves).filter((e) => present(s, e, now)).length;
  return Math.ceil(connectes / s.config.diviseurPlafond);
}

// Malus de paire : plein juste après un échange, de plus en plus faible ensuite (jamais interdit).
export function malusPaire(s, a, b, now) {
  const k = cle(a, b);
  const dernier = s.pairesDernier[k];
  if (dernier == null && !s.paires.includes(k)) return 1;
  const c = s.config;
  const age = dernier == null ? 0 : Math.max(0, now - dernier); // paire sans date : traitée comme récente
  return 1 - (1 - c.malusPaire) * Math.pow(0.5, age / c.demiViePaireMs);
}

export function rejoindre(s, { id, prenom, annee, classe, salle }, now) {
  if (!s.eleves[id]) {
    s.eleves[id] = {
      id, prenom, annee, classe: classe || "", salle: salle || "", dernierSignal: now, presenceDepuis: now,
      etat: "libre", echangeId: null, exoIdx: 0, valides: 0, depuisPtp: 0, declenche: false,
      exoEnAttente: false, corrections: 0, derniereCorrection: null, message: "",
    };
    log(s, now, `${prenom} (${classe || "année " + annee}) rejoint la session`);
  } else {
    s.eleves[id].dernierSignal = now;
  }
}

export function battement(s, id, now) {
  if (s.eleves[id]) s.eleves[id].dernierSignal = now;
}

// ---------- Score et tirage ----------

export function scorer(s, candidats, demandeur, now) {
  const c = s.config;
  const petit = candidats.length < c.petitPool;
  const taux = (e) => e.corrections / Math.max((now - e.presenceDepuis) / 3600000, 0.25);
  const moyenne = candidats.reduce((t, e) => t + taux(e), 0) / Math.max(candidats.length, 1);
  return candidats.map((e) => {
    const minutes = e.derniereCorrection == null ? Infinity : (now - e.derniereCorrection) / 60000;
    const base = 1 + 9 * Math.min(1, minutes / c.baseMaxMin);
    let bonus = 0;
    if (taux(e) < moyenne) bonus += c.bonusEquite;
    if (!petit && e.annee !== demandeur.annee) bonus += c.bonusAnnee;
    let malus = 1;
    if (!petit) malus *= malusPaire(s, e.id, demandeur.id, now);
    if (candidats.length >= 4 && e.derniereCorrection != null && now - e.derniereCorrection < c.repetitionMs) malus *= c.malusRepet;
    return { id: e.id, score: Math.max(c.plancher, base * (1 + bonus) * malus) };
  });
}

export function tirerPondere(scores, topN, rng) {
  const tries = [...scores].sort((a, b) => b.score - a.score).slice(0, Math.min(topN, scores.length));
  const total = tries.reduce((t, x) => t + x.score, 0);
  let r = rng() * total;
  for (const x of tries) {
    r -= x.score;
    if (r <= 0) return x.id;
  }
  return tries[tries.length - 1].id;
}

// ---------- Cycle d'un échange ----------

function demanderEchange(s, e, now, rng) {
  const id = "E" + s.suite++;
  s.echanges[id] = {
    id, eleve: e.id, correcteur: null, etat: "recherche", tentatives: [], essais: 0,
    code: null, codeExpire: null, deadline: null, rechercheDeadline: now + s.config.rechercheMs, creeLe: now, avis: null,
  };
  e.etat = "en_recherche";
  e.echangeId = id;
  e.message = "";
  const ech = s.echanges[id];
  // Au plafond d'échanges en cours : on reporte sans geler (le déclenchement reste en attente)
  const enCours = Object.values(s.echanges).filter((x) => x !== ech && actif(x)).length;
  if (enCours >= plafondEchanges(s, now)) return reporter(s, ech, now, "trop d'échanges en cours");
  chercher(s, ech, now, rng);
}

function chercher(s, ech, now, rng) {
  const e = s.eleves[ech.eleve];
  const autres = Object.values(s.eleves).filter((x) => x.id !== e.id && present(s, x, now));
  if (autres.length === 0) return reporter(s, ech, now, "aucun correcteur connecté");
  if (now >= ech.rechercheDeadline) return perdre(s, ech, now);
  let cands = autres.filter((x) => x.etat === "libre" && !ech.tentatives.includes(x.id));
  const sansPlafond = cands.filter((x) => x.corrections < s.config.plafondSession);
  if (sansPlafond.length > 0) cands = sansPlafond; // le plafond tombe si personne d'autre n'est disponible
  if (cands.length === 0) { // la recherche continue jusqu'à la fin des ~2 min
    ech.etat = "recherche";
    ech.deadline = ech.rechercheDeadline;
    return;
  }
  const scores = scorer(s, cands, e, now);
  const id = tirerPondere(scores, s.config.topN, rng);
  const c = s.eleves[id];
  c.etat = "reserve";
  c.echangeId = ech.id;
  ech.correcteur = id;
  ech.etat = "verification";
  ech.deadline = now + s.config.verifMs;
  s.journal.push({
    t: now,
    texte: `Tirage pour ${e.prenom} : ${scores.map((x) => nom(s, x.id) + " " + x.score.toFixed(2)).join(", ")} → ${c.prenom}`,
  });
}

function reporter(s, ech, now, raison) {
  const e = s.eleves[ech.eleve];
  if (ech.correcteur && s.eleves[ech.correcteur]) {
    const c = s.eleves[ech.correcteur];
    c.etat = "libre";
    c.echangeId = null;
  }
  ech.etat = "reporte";
  ech.correcteur = null;
  e.etat = "libre";
  e.echangeId = null;
  e.exoEnAttente = false;
  e.exoIdx++; // l'élève n'attend pas : il continue, le déclenchement reste en attente
  e.message = `Échange reporté (${raison}). Tu continues ; il aura lieu à un prochain exo.`;
  log(s, now, `Échange reporté pour ${e.prenom} : ${raison}`);
}

// Recherche terminée sans correcteur : l'échange est perdu (pas de report), l'élève passe à l'exo suivant.
function perdre(s, ech, now) {
  const e = s.eleves[ech.eleve];
  if (ech.correcteur) liberer(s, ech.correcteur);
  ech.etat = "perdu";
  ech.correcteur = null;
  e.etat = "libre";
  e.echangeId = null;
  e.exoEnAttente = false;
  e.declenche = false;
  e.depuisPtp = 0;
  e.exoIdx++;
  e.message = "Aucun correcteur trouvé : tu passes à l'exo suivant.";
  log(s, now, `Échange perdu pour ${e.prenom} : aucun correcteur trouvé en ${Math.round(s.config.rechercheMs / 60000)} min`);
}

function liberer(s, id) {
  const x = s.eleves[id];
  if (x) {
    x.etat = "libre";
    x.echangeId = null;
  }
}

function actif(ech) {
  return ["recherche", "verification", "confirme", "en_cours", "appel_prof"].includes(ech.etat);
}

// Fait avancer tout ce qui dépend du temps (évaluation paresseuse : appelée par chaque battement).
export function tick(s, now, rng) {
  for (const ech of Object.values(s.echanges)) {
    if (!actif(ech)) continue;
    const e = s.eleves[ech.eleve];
    const c = ech.correcteur ? s.eleves[ech.correcteur] : null;
    if (ech.etat === "recherche") {
      if (!present(s, e, now)) { annuler(s, ech.eleve, now); continue; }
      chercher(s, ech, now, rng);
    } else if (ech.etat === "verification") {
      if (now >= ech.deadline) {
        log(s, now, `${nom(s, ech.correcteur)} n'a pas répondu à la vérification : libéré`);
        liberer(s, ech.correcteur);
        ech.tentatives.push(ech.correcteur);
        ech.correcteur = null;
        chercher(s, ech, now, rng);
      }
    } else if (ech.etat === "confirme" || ech.etat === "en_cours") {
      if (!present(s, e, now) || (c && !present(s, c, now))) {
        const parti = !present(s, e, now) ? e : c;
        log(s, now, `${parti.prenom} s'est déconnecté en plein échange : échange expiré`);
        ech.etat = "expire";
        const reste = parti === e ? c : e;
        liberer(s, reste.id);
        if (parti.id !== e.id) { e.message = `${parti.prenom} s'est déconnecté. Relance la recherche.`; e.exoEnAttente = true; }
        parti.etat = "libre";
        parti.echangeId = null;
      } else if (ech.etat === "confirme" && now >= ech.deadline) {
        ech.etat = "appel_prof";
        log(s, now, `ALERTE : ${nom(s, ech.correcteur)} n'est pas venu voir ${e.prenom} depuis 10 min, appel du prof`);
      } else if (ech.etat === "confirme" && now >= ech.codeExpire) {
        ech.code = codeAleatoire(rng);
        ech.codeExpire = now + s.config.codeMs;
        ech.essais = 0;
      }
    }
  }
}

function codeAleatoire(rng) {
  return String(Math.floor(rng() * 1000000)).padStart(6, "0");
}

// ---------- Actions des élèves ----------

// `eligible` : false pour un exo marqué `ptp: non` (README §6) : il compte comme validé mais ne déclenche pas d'échange.
export function validerExo(s, id, now, rng, eligible = true) {
  const e = s.eleves[id];
  if (!e || e.etat !== "libre" || e.exoEnAttente) return { ok: false, raison: "Tu ne peux pas valider maintenant." };
  e.valides++;
  e.depuisPtp++;
  e.message = "";
  if ((e.declenche || s.config.toujours) && eligible) {
    e.exoEnAttente = true;
    demanderEchange(s, e, now, rng);
  } else {
    e.exoIdx++;
    if (!e.declenche && rng() < probabilite(e.depuisPtp, s.config.probas)) {
      e.declenche = true;
      log(s, now, `${e.prenom} : échange déclenché pour le prochain exo`);
    }
  }
  return { ok: true };
}

export function relancer(s, id, now, rng) {
  const e = s.eleves[id];
  if (!e || e.etat !== "libre" || !e.exoEnAttente) return { ok: false };
  demanderEchange(s, e, now, rng);
  return { ok: true };
}

export function annuler(s, id, now) {
  const e = s.eleves[id];
  const ech = e && e.echangeId ? s.echanges[e.echangeId] : null;
  if (!ech || !["recherche", "verification", "confirme"].includes(ech.etat)) return { ok: false };
  if (ech.correcteur) liberer(s, ech.correcteur);
  ech.etat = "annule";
  liberer(s, id);
  e.exoEnAttente = true; // l'exo suivant reste bloqué ; le déclenchement reste en attente
  e.message = "Échange annulé. L'exo suivant reste bloqué tant que l'échange n'a pas eu lieu.";
  log(s, now, `${e.prenom} a annulé l'échange (journalisé)`);
  return { ok: true };
}

export function confirmer(s, id, now, rng) {
  const c = s.eleves[id];
  const ech = c && c.echangeId ? s.echanges[c.echangeId] : null;
  if (!ech || ech.etat !== "verification" || ech.correcteur !== id) return { ok: false };
  ech.etat = "confirme";
  ech.code = codeAleatoire(rng);
  ech.codeExpire = now + s.config.codeMs;
  ech.deadline = now + s.config.confirmeMs;
  c.etat = "en_echange";
  s.eleves[ech.eleve].etat = "en_echange";
  log(s, now, `${c.prenom} confirme : va voir ${nom(s, ech.eleve)}`);
  return { ok: true };
}

export function saisirCode(s, id, code, now) {
  const e = s.eleves[id];
  const ech = e && e.echangeId ? s.echanges[e.echangeId] : null;
  if (!ech || ech.eleve !== id || ech.etat !== "confirme") return { ok: false, raison: "Pas d'échange à valider." };
  if (ech.essais >= s.config.essaisCodeMax) return { ok: false, raison: "Trop d'essais : attends un nouveau code." };
  ech.essais++;
  if (String(code).trim() !== ech.code) return { ok: false, raison: "Code faux." };
  ech.etat = "en_cours";
  return { ok: true };
}

export function donnerAvis(s, id, verdict, commentaire, now) {
  const c = s.eleves[id];
  const ech = c && c.echangeId ? s.echanges[c.echangeId] : null;
  if (!ech || ech.etat !== "en_cours" || ech.correcteur !== id) return { ok: false };
  const e = s.eleves[ech.eleve];
  ech.etat = "termine";
  ech.avis = { verdict, commentaire: commentaire || "" };
  c.corrections++;
  c.derniereCorrection = now;
  s.paires.push(cle(c.id, e.id));
  s.pairesDernier[cle(c.id, e.id)] = now;
  liberer(s, c.id);
  liberer(s, e.id);
  e.depuisPtp = 0;
  e.declenche = false;
  e.exoEnAttente = false;
  if (verdict === "bon") e.exoIdx++;
  e.message = verdict === "bon" ? "Avis positif : exo suivant débloqué." : "Refais l'exo avec les conseils reçus.";
  log(s, now, `${c.prenom} a corrigé ${e.prenom} (${verdict})`);
  return { ok: true };
}

export function cloreParProf(s, echId, now) {
  const ech = s.echanges[echId];
  if (!ech || ech.etat !== "appel_prof") return { ok: false };
  ech.etat = "clos_par_prof";
  liberer(s, ech.correcteur);
  liberer(s, ech.eleve);
  const e = s.eleves[ech.eleve];
  e.exoEnAttente = false;
  e.exoIdx++;
  e.message = "Le prof a clos l'échange.";
  log(s, now, `Le prof a clos l'échange de ${e.prenom}`);
  return { ok: true };
}
