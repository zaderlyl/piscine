import { estReussi } from "./progression.js";

// Formate l'identifiant pour l'affichage (README §2 : la ressource vanilla est masquée)
// Exemple : "html/vanilla/04" -> "HTML 04", "php/vanilla/00" -> "PHP 00", "js/alpine/03" -> "JS ALPINE 03"
export function formaterNomExo(identifiant) {
  if (!identifiant || typeof identifiant !== "string") return "";
  const parties = identifiant.split("/");
  if (parties.length >= 3) {
    const module = parties[0].toUpperCase();
    const ressource = parties[1] === "vanilla" ? "" : " " + parties[1].toUpperCase();
    const numero = parties[2];
    return `${module}${ressource} ${numero}`;
  }
  return identifiant;
}

// Détermine l'état d'un exercice dans le parcours :
// - valide : l'exercice a été réussi
// - courant : l'exercice actuellement affiché
// - accessible : disponible pour être tenté (immédiatement après le dernier réussi)
// - verrouille : pas encore débloqué dans le fil linéaire
export function determinerEtatExo({ id, exoCourant, listeExos = [], progression = {}, estAuteur = false }) {
  const reussi = Boolean(progression[id]?.reussi);
  const estLeCourant = id === exoCourant;

  // En mode auteur, tout le catalogue est accessible pour inspection
  if (estAuteur) {
    if (estLeCourant) return { etat: "courant", etiquette: "En cours", accessible: true };
    if (reussi) return { etat: "valide", etiquette: "Validé", accessible: true };
    return { etat: "accessible", etiquette: "Disponible", accessible: true };
  }

  // Trouver le premier exercice non encore validé dans la liste ordonnée
  const premierNonReussiIndex = listeExos.findIndex((exoId) => !progression[exoId]?.reussi);
  const indexCourant = listeExos.indexOf(id);

  // Un exercice est accessible s'il est déjà réussi ou s'il s'agit du tout premier non réussi
  const accessible = reussi || indexCourant === premierNonReussiIndex || (premierNonReussiIndex === -1 && indexCourant !== -1);

  if (estLeCourant) {
    return { etat: "courant", etiquette: "En cours", accessible: true };
  }
  if (reussi) {
    return { etat: "valide", etiquette: "Validé", accessible: true };
  }
  if (accessible) {
    return { etat: "accessible", etiquette: "Disponible", accessible: true };
  }
  return { etat: "verrouille", etiquette: "Verrouillé", accessible: false };
}

// Construit le sélecteur / menu déroulant des exercices
export function creerMenuNavigation({
  conteneur,
  exoCourant,
  listeExos = [],
  lireProgressionFn = () => ({}),
  estAuteur = false,
  surChangerExo,
}) {
  if (!conteneur) return null;

  conteneur.innerHTML = "";
  conteneur.classList.add("barre-navigation-exos");

  const groupeMenu = document.createElement("div");
  groupeMenu.className = "groupe-menu-exos";

  const declencheur = document.createElement("button");
  declencheur.type = "button";
  declencheur.className = "declencheur-menu-exos";
  declencheur.setAttribute("aria-haspopup", "true");
  declencheur.setAttribute("aria-expanded", "false");

  const texteDeclencheur = document.createElement("span");
  texteDeclencheur.className = "texte-declencheur";
  texteDeclencheur.textContent = formaterNomExo(exoCourant);

  const chevron = document.createElement("span");
  chevron.className = "chevron-menu";

  declencheur.append(texteDeclencheur, chevron);

  const panneau = document.createElement("div");
  panneau.className = "panneau-menu-exos cache";

  const enTete = document.createElement("div");
  enTete.className = "en-tete-menu-exos";
  enTete.textContent = "Parcours d'exercices";
  panneau.append(enTete);

  const listeEl = document.createElement("ul");
  listeEl.className = "liste-menu-exos";
  panneau.append(listeEl);

  function naviguerVers(id) {
    if (typeof surChangerExo === "function") {
      surChangerExo(id);
      return;
    }
    const params = new URLSearchParams(location.search);
    params.set("exo", id);
    location.search = params.toString();
  }

  function fermerMenu() {
    panneau.classList.add("cache");
    declencheur.setAttribute("aria-expanded", "false");
    declencheur.classList.remove("ouvert");
  }

  function ouvrirMenu() {
    mettreAJour();
    panneau.classList.remove("cache");
    declencheur.setAttribute("aria-expanded", "true");
    declencheur.classList.add("ouvert");
  }

  declencheur.addEventListener("click", (e) => {
    e.stopPropagation();
    if (panneau.classList.contains("cache")) {
      ouvrirMenu();
    } else {
      fermerMenu();
    }
  });

  document.addEventListener("click", (e) => {
    if (!groupeMenu.contains(e.target)) {
      fermerMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panneau.classList.contains("cache")) {
      fermerMenu();
      declencheur.focus();
    }
  });

  function mettreAJour() {
    const progression = lireProgressionFn();
    texteDeclencheur.textContent = formaterNomExo(exoCourant);
    listeEl.innerHTML = "";

    for (const id of listeExos) {
      const { etat, etiquette, accessible } = determinerEtatExo({
        id,
        exoCourant,
        listeExos,
        progression,
        estAuteur,
      });

      const li = document.createElement("li");
      li.className = "item-menu-exo";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `btn-choix-exo ${etat === "courant" ? "actif" : ""}`;
      btn.disabled = !accessible;

      const nom = document.createElement("span");
      nom.className = "nom-exo";
      nom.textContent = formaterNomExo(id);

      const badge = document.createElement("span");
      badge.className = `badge-etat-exo etat-${etat}`;
      badge.textContent = etiquette;

      btn.append(nom, badge);

      if (accessible && id !== exoCourant) {
        btn.addEventListener("click", () => {
          fermerMenu();
          naviguerVers(id);
        });
      }

      li.append(btn);
      listeEl.append(li);
    }
  }

  groupeMenu.append(declencheur, panneau);
  conteneur.append(groupeMenu);

  mettreAJour();

  return {
    mettreAJour,
    fermerMenu,
  };
}
