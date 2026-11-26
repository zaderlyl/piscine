import { lireCode, chargerExo } from "./exo.js";
import { assemblerPage, afficherDansApercu } from "./apercu.js";
import { injecterStockage, lireStockageApercu, ecrireStockageApercu } from "./stockage-apercu.js";
import { executerPhp } from "./php.js?v=2";
import { lireBrouillon, sauvegarderBrouillon } from "./brouillon.js";
import { creerEditeurs } from "./editeur.js";
import { afficherPanneauDoc } from "./doc.js";
import { debloquerEmmet } from "./emmet.js";
import { creerMenuNavigation } from "./navigation.js";
import { demarrerChrono } from "./chrono.js";
import { monterProgressionUi } from "./progression-ui.js";
import { monterPanneauCours } from "./panneaux/cours.js";
import { monterPanneauDepotExo } from "./panneaux/depot.js";
import { monterPanneauSchemaExo } from "./panneaux/schema.js";
import { monterPanneauSqlExo } from "./panneaux/sql.js";

import { afficherVariables, ecouterValeurs } from "./visualiseur-variables.js";
import { glissable } from "./redimensionner.js";
import {
  marquerReussi,
  estReussi,
  lireProgression,
  chargerListeExos,
  exoSuivant,
} from "./progression.js";
import {
  initialiserPtp,
  notifierValidationExo,
  ptpBloqueSuivant,
  afficherPtpUI,
} from "./ptp.js";

const apercu = document.getElementById("apercu");
const onglets = document.getElementById("onglets");
const zones = document.getElementById("zones");
const panneauResultats = document.getElementById("resultat");
const panneauEnonce = document.getElementById("enonce");
const docOnglet = document.getElementById("doc-onglet");

const boutonPhp = document.createElement("button");

// exo choisi dans l'adresse, par exemple ?exo=html/vanilla/04 (par défaut : HTML 05)
const exoChoisi = new URLSearchParams(location.search).get("exo");
const EXO = /^[\w/-]+$/.test(exoChoisi || "") ? exoChoisi : "html/vanilla/05";

// Temps actif de l'élève sur cet exo (enregistré dans le localStorage, rien n'est affiché)
demarrerChrono(EXO);

const CLE_BROUILLON = "piscine-brouillon:" + EXO;
const CLE_SUSPENDU = "piscine-apercu-suspendu";

const FICHIER_EXO = `../exos/${EXO}.md`;

const DELAI_SUSPENDU = 5000;

let enregistrerBrouillonActif = null;

// Export et import de la progression (src/progression-ui.js)
monterProgressionUi({ avantExport: () => enregistrerBrouillonActif?.() });

// bouton "suivant"
const boutonSuivant = document.createElement("button");
boutonSuivant.textContent = "Exo suivant →";
boutonSuivant.classList.add("cache");
onglets.append(boutonSuivant);

const listeExos = await chargerListeExos();
const suivant = exoSuivant(EXO, listeExos);

// menu de navigation entre les exos
const menuNavigation = creerMenuNavigation({
  conteneur: document.getElementById("navigation-exos"),
  exoCourant: EXO,
  listeExos,
  lireProgressionFn: lireProgression,
  estAuteur: new URLSearchParams(location.search).has("auteur"),
});

function afficherSuivant() {
  const bloquePtp = ptpBloqueSuivant();
  boutonSuivant.classList.toggle("cache", !(suivant && estReussi(EXO) && !bloquePtp));
}

boutonSuivant.addEventListener("click", () => {
  const params = new URLSearchParams(location.search);
  params.set("exo", suivant);
  location.search = params.toString();
});

const exo = await chargerExo(FICHIER_EXO);

// validation + exo suivant + tirage PTP
// Les tests repassent à chaque frappe : on ne prévient le PTP qu'à la première réussite de l'exo,
// sinon chaque frappe compterait comme un nouvel exo validé (et relancerait le tirage).
let ptpPrevenu = estReussi(EXO);
async function validerExo() {
  marquerReussi(EXO);
  if (!ptpPrevenu) {
    ptpPrevenu = true;
    await notifierValidationExo(EXO, exo.ptp !== "non");
  }
  afficherSuivant();
  menuNavigation.mettreAJour();
  afficherPtpUI(document.body, () => afficherSuivant());
}

// Barres pour agrandir ou réduire les colonnes
glissable(document.getElementById("separateur-v"), document.getElementById("editeur"), {
  axe: "x",
  variable: "--largeur-gauche",
  min: 200,
  max: () => window.innerWidth - 200,
});

const panneaux = exo.panneaux || ["enonce", "editeur", "apercu"];

if (exo.type === "cours") {
  // Cours seul (src/panneaux/cours.js)
  monterPanneauCours({
    exo,
    nomExo: EXO,
    panneauEnonce,
    docOnglet,
    zones,
    onOuvert: () => {
      afficherSuivant();
      menuNavigation.mettreAJour();
    },
  });
} else if (panneaux.includes("depot")) {
  // Dépôt Git (src/panneaux/depot.js)
  monterPanneauDepotExo({
    exo,
    nomExo: EXO,
    apercu,
    docOnglet,
    panneauEnonce,
    zones,
    panneauResultats,
    onSucces: validerExo,
    onOuvert: afficherSuivant,
  });
} else if (panneaux.includes("schema")) {
  // Schéma de base de données (src/panneaux/schema.js)
  monterPanneauSchemaExo({
    exo,
    apercu,
    docOnglet,
    panneauEnonce,
    zones,
    panneauResultats,
    onSucces: validerExo,
    onOuvert: afficherSuivant,
  });
} else if (panneaux.includes("sql")) {
  // Requêtes SQL (src/panneaux/sql.js)
  monterPanneauSqlExo({
    exo,
    cleBrouillon: CLE_BROUILLON,
    apercu,
    docOnglet,
    panneauEnonce,
    zones,
    panneauResultats,
    onSucces: validerExo,
    onOuvert: afficherSuivant,
  });
} else {
  // HTML / CSS / JS / PHP classique
  let minuteurTests = null;
  let minuteur = null;
  let testsExo = lireCode(exo["Tests"]);

  function arreterApercu() {
    enregistrerBrouillon();
    localStorage.setItem(CLE_SUSPENDU, "1");
    location.reload();
  }

  function lireContenus() {
    const contenus = {};
    for (const nom in editeurs) {
      contenus[nom] = editeurs[nom].state.doc.toString();
    }
    return contenus;
  }

  function enregistrerBrouillon() {
    sauvegarderBrouillon(CLE_BROUILLON, lireContenus());
  }

  enregistrerBrouillonActif = enregistrerBrouillon;

  // Affiche index.html dans l'iframe
  function afficherApercu() {
    if (EXO.startsWith("php/")) return; // les exos PHP se testent avec « Exécuter PHP »
    const { code, analyse, balisePresente } = assemblerPage(lireContenus(), testsExo);
    afficherVariables(analyse, balisePresente);
    // localStorage est interdit dans l'iframe isolée : on y place un faux, gardé par exo
    afficherDansApercu(apercu, injecterStockage(code, lireStockageApercu(EXO)));
    clearTimeout(minuteurTests);
    minuteurTests = setTimeout(arreterApercu, DELAI_SUSPENDU);
  }

  const { editeurs, afficherFichier } = creerEditeurs({
    zones,
    onglets,
    brouillon: lireBrouillon(CLE_BROUILLON),
    avecPhp: EXO.startsWith("php/"),
    surChangement(vue) {
      if (vue !== editeurs["index.php"]) afficherApercu();
      clearTimeout(minuteur);
      minuteur = setTimeout(enregistrerBrouillon, 1000);
    },
  });

  afficherPanneauDoc(exo, panneauEnonce, docOnglet);

  // remplace le code des editeurs par la solution de reference
  function chargerSolution() {
    for (const [tire, contenu] of Object.entries(exo)) {
      if (!tire.startsWith("Solution: ")) continue;
      const editeur = editeurs[tire.slice("Solution: ".length).trim()];
      if (!editeur) continue;
      editeur.dispatch({
        changes: {
          from: 0,
          to: editeur.state.doc.length,
          insert: lireCode(contenu),
        },
      });
    }
    // Un exo PHP se teste avec « Exécuter PHP » : on le lance directement
    if (exo["Solution: index.php"]) lancerPhp();
  }

  // Mode auteur ( acces via ?auteur ) bouton pour verif solution
  if (new URLSearchParams(location.search).has("auteur")) {
    const boutonSolution = document.createElement("button");
    boutonSolution.textContent = "Charger la solution";
    boutonSolution.addEventListener("click", chargerSolution);
    onglets.append(boutonSolution);
  }

  if (EXO.startsWith("php/")) {
    boutonPhp.textContent = "Exécuter PHP";
    boutonPhp.addEventListener("click", lancerPhp);
    onglets.append(boutonPhp);
  }

  afficherSuivant();
  // Fichier ouvert au départ : script.js pour les exos JS, index.php pour PHP, sinon index.html
  const fichierParDefaut = EXO.startsWith("js/") || exo["Solution: script.js"]
    ? "script.js"
    : EXO.startsWith("php/") || exo["Solution: index.php"]
      ? "index.php"
      : "index.html";
  afficherFichier(fichierParDefaut);

  if (localStorage.getItem(CLE_SUSPENDU)) {
    localStorage.removeItem(CLE_SUSPENDU);
    panneauResultats.textContent =
      "Aperçu suspendu : ton code semble tourner à l'infini. Corrige-le pour relancer.";
  } else {
    afficherApercu();
  }

  ecouterValeurs(apercu);

  // Barres pour agrandir ou réduire les colonnes et les panneaux de droite
  // Les limites hautes laissent toujours de la place au résultat des tests (environ 10 % de la hauteur)
  glissable(document.getElementById("separateur-a"), apercu, {
    axe: "y",
    variable: "--h-apercu",
    min: 80,
    max: () => window.innerHeight * 0.6,
  });
  glissable(document.getElementById("separateur-b"), document.getElementById("variables"), {
    axe: "y",
    variable: "--h-variables",
    min: 60,
    max: () => window.innerHeight * 0.3,
  });

  // Enregistre le localStorage de l'aperçu (voir stockage-apercu.js)
  window.addEventListener("message", (e) => {
    if (e.source !== apercu.contentWindow || e.data?.type !== "stockage") return;
    ecrireStockageApercu(EXO, e.data.donnees);
  });

  // Affiche les résultats envoyés par l'aperçu
  window.addEventListener("message", (e) => {
    if (e.source !== apercu.contentWindow || e.data.type !== "tests") return;
    clearTimeout(minuteurTests);
    const echecs = e.data.resultats.filter((r) => !r.ok);
    panneauResultats.textContent = echecs.length
      ? echecs.map((r) => "❌ " + r.message).join("\n")
      : "✅ Tous les tests passent";
    if (!echecs.length && e.data.resultats.length) {
      if (testsExo && exo.emmetDebloque) debloquerEmmet(exo.emmetDebloque);
      validerExo();
    }
  });

  let executionPhpEnCours = false;
  async function lancerPhp() {
    if (executionPhpEnCours) return;
    executionPhpEnCours = true;
    boutonPhp.disabled = true;
    try {
      panneauResultats.textContent = "Exécution en cours...";
      const { sortie, resultats } = await executerPhp(
        editeurs["index.php"].state.doc.toString(),
        testsExo,
      );

      const echecs = resultats.filter((r) => !r.ok);
      panneauResultats.textContent =
        sortie +
        "\n\n" +
        (echecs.length
          ? echecs.map((r) => "❌ " + r.message).join("\n")
          : "✅ Tous les tests passent");
      if (!echecs.length && resultats.length) {
        validerExo();
      }

      clearTimeout(minuteurTests);
      afficherDansApercu(apercu, sortie);
    } finally {
      executionPhpEnCours = false;
      boutonPhp.disabled = false;
    }
  }
}

// Initialisation PTP
initialiserPtp(() => {
  afficherSuivant();
  afficherPtpUI(document.body, () => afficherSuivant());
});
afficherPtpUI(document.body, () => afficherSuivant());
