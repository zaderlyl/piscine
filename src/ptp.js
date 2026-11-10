// Intégration du tirage PTP dans l'application principale
import * as P from "../prototypes/ptp/ptp-logique.js";

const CLE_STOCKAGE = "piscine-ptp-etat";
const CANAL_NOM = "piscine-ptp-canal";

let canal = null;
if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  try {
    canal = new BroadcastChannel(CANAL_NOM);
  } catch {
    canal = null;
  }
}

// Identifiant unique pour cet onglet/session
export function obtenirMonId() {
  if (typeof window === "undefined") return "eleve-test";
  const params = new URLSearchParams(window.location.search);
  const nomUrl = params.get("eleve");
  if (nomUrl) return nomUrl.trim();

  let id = sessionStorage.getItem("ptp-moi");
  if (!id) {
    id = "eleve-" + Math.random().toString(36).slice(2, 6);
    sessionStorage.setItem("ptp-moi", id);
  }
  return id;
}

export function obtenirMonPrenom() {
  const id = obtenirMonId();
  return id.replace(/^eleve-/, "Élève ");
}

export function chargerEtat(stockage = localStorage) {
  try {
    const brut = stockage.getItem(CLE_STOCKAGE);
    return brut ? JSON.parse(brut) : P.nouvelEtat();
  } catch {
    return P.nouvelEtat();
  }
}

export function sauverEtat(s, stockage = localStorage) {
  try {
    stockage.setItem(CLE_STOCKAGE, JSON.stringify(s));
    canal?.postMessage({ type: "ptp-sync" });
  } catch {
    // ignore
  }
}

// Effectue une action sur l'état partagé sous verrou
export async function avecEtat(fn, stockage = localStorage) {
  const corps = () => {
    const s = chargerEtat(stockage);
    const moi = obtenirMonId();
    const now = Date.now();
    P.battement(s, moi, now);
    P.tick(s, now, Math.random);
    const res = fn(s, moi, now, Math.random);
    P.tick(s, now, Math.random);
    sauverEtat(s, stockage);
    return res;
  };

  if (typeof navigator !== "undefined" && navigator.locks) {
    return await navigator.locks.request("piscine-ptp-lock", corps);
  }
  return corps();
}

// Initialise la présence de l'élève
export function initialiserPtp(onChangement) {
  if (typeof window === "undefined") return;

  const moi = obtenirMonId();
  const prenom = obtenirMonPrenom();

  avecEtat((s, id, now) => {
    P.rejoindre(s, { id, prenom, annee: 1 }, now);
  }).then(() => onChangement?.());

  // Battement régulier
  setInterval(() => {
    avecEtat(() => {}).then(() => onChangement?.());
  }, 10000);

  // Écoute des mises à jour des autres onglets
  window.addEventListener("storage", (e) => {
    if (e.key === CLE_STOCKAGE) onChangement?.();
  });
  canal?.addEventListener("message", () => onChangement?.());
}

// Appelé quand un élève valide un exercice
export async function notifierValidationExo(nomExo, eligible = true, stockage = localStorage) {
  return await avecEtat((s, moi, now, rng) => {
    // Si l'élève n'avait pas encore rejoint
    if (!s.eleves[moi]) {
      P.rejoindre(s, { id: moi, prenom: obtenirMonPrenom(), annee: 1 }, now);
    }
    return P.validerExo(s, moi, now, rng, eligible);
  }, stockage);
}

// Vérifie si un échange bloque le passage à l'exercice suivant
export function ptpBloqueSuivant(stockage = localStorage) {
  const s = chargerEtat(stockage);
  const moi = obtenirMonId();
  const e = s.eleves[moi];
  if (!e) return false;
  return Boolean(e.exoEnAttente || (e.etat && e.etat !== "libre"));
}

// Construit et met à jour le modal / panneau d'échange PTP
export function afficherPtpUI(conteneur = document.body, onMiseAJour = null) {
  let modal = document.getElementById("ptp-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "ptp-modal";
    modal.className = "ptp-modal cache";
    conteneur.append(modal);
  }

  const s = chargerEtat();
  const moi = obtenirMonId();
  const e = s.eleves[moi];

  if (!e || (!e.exoEnAttente && e.etat === "libre")) {
    modal.classList.add("cache");
    modal.replaceChildren();
    return;
  }

  modal.classList.remove("cache");
  modal.replaceChildren();

  const boite = document.createElement("div");
  boite.className = "ptp-boite";

  const titre = document.createElement("h3");
  titre.textContent = "Échange entre pairs (PTP)";
  boite.append(titre);

  const ech = e.echangeId ? s.echanges[e.echangeId] : null;

  // Cas 1 : En recherche d'un correcteur
  if (e.etat === "en_recherche" || (ech && ech.etat === "recherche")) {
    const p = document.createElement("p");
    p.textContent = "Recherche d'un correcteur parmi les élèves connectés...";
    const annulerBtn = document.createElement("button");
    annulerBtn.textContent = "Annuler la recherche";
    annulerBtn.addEventListener("click", async () => {
      await avecEtat((etat, id, now) => P.annuler(etat, id, now));
      onMiseAJour?.();
      afficherPtpUI(conteneur, onMiseAJour);
    });
    boite.append(p, annulerBtn);
  }
  // Cas 2 : Un correcteur est tiré mais doit confirmer
  else if (ech && ech.etat === "verification") {
    if (ech.correcteur === moi) {
      const p = document.createElement("p");
      p.textContent = `Tu as été tiré au sort pour corriger ${s.eleves[ech.eleve]?.prenom || "un élève"} !`;
      const btn = document.createElement("button");
      btn.className = "principal";
      btn.textContent = "J'accepte et je vais le voir";
      btn.addEventListener("click", async () => {
        await avecEtat((etat, id, now, rng) => P.confirmer(etat, id, now, rng));
        onMiseAJour?.();
        afficherPtpUI(conteneur, onMiseAJour);
      });
      boite.append(p, btn);
    } else {
      const p = document.createElement("p");
      p.textContent = `Correcteur trouvé (${s.eleves[ech.correcteur]?.prenom || "en attente"}), confirmation en cours...`;
      boite.append(p);
    }
  }
  // Cas 3 : Échange confirmé avec code à 6 chiffres
  else if (ech && ech.etat === "confirme") {
    if (ech.eleve === moi) {
      const p = document.createElement("p");
      p.textContent = `Ton correcteur est ${s.eleves[ech.correcteur]?.prenom || "ton binôme"}. Donne-lui ce code :`;
      const codeSpan = document.createElement("div");
      codeSpan.className = "ptp-code";
      codeSpan.textContent = ech.code || "------";

      const pSaisie = document.createElement("p");
      pSaisie.textContent = "Ou valide le code saisi par ton correcteur :";
      const inputCode = document.createElement("input");
      inputCode.type = "text";
      inputCode.maxLength = 6;
      inputCode.placeholder = "Code 6 chiffres";
      const btnValider = document.createElement("button");
      btnValider.textContent = "Valider";
      btnValider.addEventListener("click", async () => {
        await avecEtat((etat, id, now) => P.saisirCode(etat, id, inputCode.value, now));
        onMiseAJour?.();
        afficherPtpUI(conteneur, onMiseAJour);
      });

      boite.append(p, codeSpan, pSaisie, inputCode, " ", btnValider);
    } else if (ech.correcteur === moi) {
      const p = document.createElement("p");
      p.textContent = `Rends-toi auprès de ${s.eleves[ech.eleve]?.prenom || "l'élève"}, demande-lui son code à 6 chiffres :`;
      const inputCode = document.createElement("input");
      inputCode.type = "text";
      inputCode.maxLength = 6;
      inputCode.placeholder = "Code 6 chiffres";
      const btnValider = document.createElement("button");
      btnValider.className = "principal";
      btnValider.textContent = "Valider le code";
      btnValider.addEventListener("click", async () => {
        await avecEtat((etat, id, now) => {
          // Valide le code pour l'échange de l'élève
          P.saisirCode(etat, ech.eleve, inputCode.value, now);
        });
        onMiseAJour?.();
        afficherPtpUI(conteneur, onMiseAJour);
      });
      boite.append(p, inputCode, " ", btnValider);
    }
  }
  // Cas 4 : En cours de correction (Avis du correcteur)
  else if (ech && ech.etat === "en_cours") {
    if (ech.correcteur === moi) {
      const p = document.createElement("p");
      p.textContent = `Vérifie le code et le fonctionnement de l'exercice avec ${s.eleves[ech.eleve]?.prenom}. Ton avis :`;
      const btnBon = document.createElement("button");
      btnBon.className = "principal";
      btnBon.textContent = "✅ Valider l'exercice (Bon)";
      btnBon.addEventListener("click", async () => {
        await avecEtat((etat, id, now) => P.donnerAvis(etat, id, "bon", "Exercice bien validé", now));
        onMiseAJour?.();
        afficherPtpUI(conteneur, onMiseAJour);
      });

      const btnRevoir = document.createElement("button");
      btnRevoir.textContent = "⚠️ À retravailler";
      btnRevoir.addEventListener("click", async () => {
        await avecEtat((etat, id, now) => P.donnerAvis(etat, id, "a_revoir", "À retravailler", now));
        onMiseAJour?.();
        afficherPtpUI(conteneur, onMiseAJour);
      });

      boite.append(p, btnBon, " ", btnRevoir);
    } else {
      const p = document.createElement("p");
      p.textContent = `Correction en cours avec ${s.eleves[ech.correcteur]?.prenom || "ton correcteur"}...`;
      boite.append(p);
    }
  }

  modal.append(boite);
}
