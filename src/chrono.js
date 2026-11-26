// Chrono en temps actif : mesure, par exo, le temps pendant lequel l'élève travaille vraiment.
// Il compte seulement quand la page est visible, a le focus, et a reçu une action (clavier,
// souris, défilement) dans les dernières minutes. Il n'affiche rien et n'impose aucune limite.

const CLE_CHRONO = "piscine-chrono";

// Au-delà de ce délai sans action, le chrono ne compte plus (à régler au pilote, README §9)
export const INACTIVITE_MAX_MS = 2 * 60 * 1000;

function obtenirStockage(stockage) {
  if (stockage) return stockage;
  if (typeof localStorage !== "undefined") return localStorage;
  return null;
}

function lireTout(stockage) {
  const s = obtenirStockage(stockage);
  if (!s) return {};
  try {
    const donnees = JSON.parse(s.getItem(CLE_CHRONO));
    return donnees && typeof donnees === "object" ? donnees : {};
  } catch {
    return {};
  }
}

// Temps actif cumulé d'un exo, en millisecondes (0 si aucun)
export function lireTempsActif(exo, stockage = null) {
  const total = Number(lireTout(stockage)[exo]);
  return Number.isFinite(total) && total > 0 ? total : 0;
}

// Ajoute une durée au total enregistré d'un exo. On lit puis on écrit : deux onglets ouverts
// sur le même exo additionnent leurs temps au lieu de s'écraser.
function ajouterTempsActif(exo, ms, stockage) {
  const s = obtenirStockage(stockage);
  if (!s || ms <= 0) return;
  const donnees = lireTout(s);
  donnees[exo] = lireTempsActif(exo, s) + ms;
  try {
    s.setItem(CLE_CHRONO, JSON.stringify(donnees));
  } catch {
    console.error("Erreur lors de la sauvegarde du chrono");
  }
}

// Logique du chrono, sans rien du navigateur (horloge et stockage injectables pour les tests).
export function creerChrono({
  exo,
  stockage = null,
  maintenant = Date.now,
  inactiviteMax = INACTIVITE_MAX_MS,
  visible = true,
  focus = true,
}) {
  let present = visible && focus;
  let derniereActivite = maintenant();
  let dernierTic = maintenant();
  let nonEnregistre = 0;

  // Ajoute au total le temps écoulé depuis le dernier tic, s'il compte comme actif
  function tic() {
    const now = maintenant();
    if (present) {
      const finActive = Math.min(now, derniereActivite + inactiviteMax);
      if (finActive > dernierTic) nonEnregistre += finActive - dernierTic;
    }
    dernierTic = now;
  }

  return {
    // Une action de l'élève (clavier, souris, défilement)
    activite() {
      tic();
      derniereActivite = maintenant();
    },
    // La page devient visible ou cachée, gagne ou perd le focus
    definirEtat({ visible: v, focus: f }) {
      tic();
      const etait = present;
      present = v && f;
      if (present && !etait) derniereActivite = maintenant();
    },
    tic,
    // Écrit le temps compté depuis la dernière sauvegarde
    sauvegarder() {
      tic();
      ajouterTempsActif(exo, nonEnregistre, stockage);
      nonEnregistre = 0;
    },
    // Total de l'exo (déjà enregistré + en cours), en millisecondes
    temps() {
      tic();
      return lireTempsActif(exo, stockage) + nonEnregistre;
    },
  };
}

const EVENEMENTS_ACTIVITE = ["keydown", "pointerdown", "pointermove", "wheel", "touchstart"];

// Branche le chrono sur la page : à appeler une fois, avec l'identifiant de l'exo affiché.
export function demarrerChrono(exo, { stockage = null, fenetre = window } = {}) {
  const doc = fenetre.document;
  const etat = () => ({ visible: !doc.hidden, focus: doc.hasFocus() });
  const chrono = creerChrono({ exo, stockage, ...etat() });

  const surActivite = () => chrono.activite();
  for (const nom of EVENEMENTS_ACTIVITE) {
    fenetre.addEventListener(nom, surActivite, { passive: true, capture: true });
  }
  // Un défilement dans un panneau ne remonte pas : on l'écoute en capture
  doc.addEventListener("scroll", surActivite, { passive: true, capture: true });

  const surEtat = () => {
    chrono.definirEtat(etat());
    if (doc.hidden) chrono.sauvegarder();
  };
  doc.addEventListener("visibilitychange", surEtat);
  fenetre.addEventListener("focus", surEtat);
  fenetre.addEventListener("blur", surEtat);
  // La page se ferme ou se recharge (changement d'exo) : on garde le temps compté
  fenetre.addEventListener("pagehide", () => chrono.sauvegarder());

  // On compte chaque seconde et on enregistre toutes les cinq secondes
  let tours = 0;
  fenetre.setInterval(() => {
    chrono.tic();
    if (++tours % 5 === 0) chrono.sauvegarder();
  }, 1000);

  return chrono;
}
