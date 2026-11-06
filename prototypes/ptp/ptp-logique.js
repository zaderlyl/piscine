// Logique du tirage PTP (voir CONCEPTION.md). Aucune interface, aucun accès au navigateur :
// tout prend l'état `s`, l'heure `now` (ms) et un générateur aléatoire `rng` en paramètres, pour être testable.

// Probabilité de déclenchement selon les exos validés depuis le dernier échange (README §6).
// Case i = exos validés depuis le dernier échange ; la dernière case vaut pour tous les nombres plus grands.
export const PROBAS_DEFAUT = [0, 0, 0, 0.10, 0.20, 0.35, 0.60, 1.0];

export const CONFIG_DEFAUT = {
  signalMs: 120000,      // un élève est « présent » si son dernier signal a moins de 2 min (proposition : 90 s)
  verifMs: 30000,        // vérification d'activité du correcteur
  confirmeMs: 600000,    // correcteur confirmé qui ne vient pas : appel du prof
  fileMs: 120000,        // file d'attente courte quand tous les candidats sont occupés
  codeMs: 300000,        // validité du code à 6 chiffres
  essaisCodeMax: 5,
  essaisVerifMax: 3,     // tirages successifs avant la file d'attente
  topN: 6,
  petitPool: 6,          // en dessous : on relâche la contrainte « paire déjà vue » et la préférence d'année
  plafondSession: 3,     // corrections max par correcteur et par session
  repetitionMs: 900000,  // « pas deux d'affilée » : a déjà corrigé il y a moins de 15 min
  bonusAnnee: 0.2,
  bonusEquite: 0.3,
  malusPaire: 0.1,
  malusRepet: 0.3,
  baseMaxMin: 60,        // l'ancienneté plafonne après 60 min
  plancher: 0.05,
  toujours: false,       // démo : déclencher un échange à chaque exo validé
  probas: PROBAS_DEFAUT, // table de déclenchement (modifiable, voir simuler.mjs)
  // Qui peut corriger qui :
  //  "classe_puis_autres" : la classe d'abord ; si elle a moins de `petitPool` correcteurs libres, on élargit aux autres classes
  //  "classe_seule"       : uniquement la classe (si personne : file courte puis report)
  //  "toutes"             : toutes les classes ouvertes dès le départ (README §6)
  portee: "classe_puis_autres",
  bonusClasse: 0.5,      // préférence pour la même classe quand le pool est élargi (le correcteur se déplace moins)
};

// Probabilité de déclenchement pour `depuisPtp` exos validés.
export function probabilite(depuisPtp, table = PROBAS_DEFAUT) {
  return table[Math.min(depuisPtp, table.length - 1)];
}

export function nouvelEtat() {
  return { config: { ...CONFIG_DEFAUT }, eleves: {}, echanges: {}, paires: [], journal: [], suite: 1 };
}

const log = (s, now, texte) => {
  s.journal.push({ t: now, texte });
  if (s.journal.length > 200) s.journal.shift();
};
const nom = (s, id) => (s.eleves[id] ? s.eleves[id].prenom : id);
const present = (s, e, now) => now - e.dernierSignal <= s.config.signalMs;
const cle = (a, b) => [a, b].sort().join("|");

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
    if (c.portee !== "toutes" && e.classe === demandeur.classe) bonus += c.bonusClasse;
    let malus = 1;
    if (!petit && s.paires.includes(cle(e.id, demandeur.id))) malus *= c.malusPaire;
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
    code: null, codeExpire: null, deadline: null, fileDeadline: null, creeLe: now, avis: null,
  };
  e.etat = "en_recherche";
  e.echangeId = id;
  e.message = "";
  chercher(s, s.echanges[id], now, rng);
}

function chercher(s, ech, now, rng) {
  const e = s.eleves[ech.eleve];
  const autres = Object.values(s.eleves).filter((x) => x.id !== e.id && present(s, x, now));
  if (autres.length === 0) return reporter(s, ech, now, "aucun correcteur connecté");
  let cands = autres.filter((x) => x.etat === "libre" && !ech.tentatives.includes(x.id));
  const sansPlafond = cands.filter((x) => x.corrections < s.config.plafondSession);
  if (sansPlafond.length > 0) cands = sansPlafond; // le plafond tombe si personne d'autre n'est disponible
  cands = restreindreALaPortee(s, cands, e);
  if (cands.length === 0 || ech.tentatives.length >= s.config.essaisVerifMax) {
    if (ech.fileDeadline == null) ech.fileDeadline = now + s.config.fileMs;
    if (now >= ech.fileDeadline) return reporter(s, ech, now, "tous les correcteurs sont occupés");
    ech.etat = "file";
    ech.deadline = ech.fileDeadline;
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

// Applique la règle « la classe d'abord » (voir CONFIG_DEFAUT.portee).
export function restreindreALaPortee(s, cands, demandeur) {
  const memeClasse = cands.filter((x) => x.classe === demandeur.classe);
  if (s.config.portee === "toutes") return cands;
  if (s.config.portee === "classe_seule") return memeClasse;
  return memeClasse.length >= s.config.petitPool ? memeClasse : cands;
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

function liberer(s, id) {
  const x = s.eleves[id];
  if (x) {
    x.etat = "libre";
    x.echangeId = null;
  }
}

function actif(ech) {
  return ["recherche", "file", "verification", "confirme", "en_cours", "appel_prof"].includes(ech.etat);
}

// Fait avancer tout ce qui dépend du temps (évaluation paresseuse : appelée par chaque battement).
export function tick(s, now, rng) {
  for (const ech of Object.values(s.echanges)) {
    if (!actif(ech)) continue;
    const e = s.eleves[ech.eleve];
    const c = ech.correcteur ? s.eleves[ech.correcteur] : null;
    if (ech.etat === "file") {
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
  if (!ech || !["recherche", "file", "verification", "confirme"].includes(ech.etat)) return { ok: false };
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
