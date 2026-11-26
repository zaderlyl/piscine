import { chargerExo } from "./exo.js";
import { creerMenuNavigation } from "./navigation.js";
import { demarrerChrono } from "./chrono.js";
import { monterProgressionUi } from "./progression-ui.js";
import { monterPanneauCours } from "./panneaux/cours.js";
import { monterPanneauDepotExo } from "./panneaux/depot.js";
import { monterPanneauSchemaExo } from "./panneaux/schema.js";
import { monterPanneauSqlExo } from "./panneaux/sql.js";
import { monterPanneauClassique } from "./panneaux/classique.js";

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

// exo choisi dans l'adresse, par exemple ?exo=html/vanilla/04 (par défaut : HTML 05)
const exoChoisi = new URLSearchParams(location.search).get("exo");
const EXO = /^[\w/-]+$/.test(exoChoisi || "") ? exoChoisi : "html/vanilla/05";

// Temps actif de l'élève sur cet exo (enregistré dans le localStorage, rien n'est affiché)
demarrerChrono(EXO);

const CLE_BROUILLON = "piscine-brouillon:" + EXO;

const FICHIER_EXO = `../exos/${EXO}.md`;

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
  // HTML / CSS / JS / PHP classique (src/panneaux/classique.js)
  enregistrerBrouillonActif = monterPanneauClassique({
    exo,
    nomExo: EXO,
    cleBrouillon: CLE_BROUILLON,
    apercu,
    onglets,
    zones,
    panneauResultats,
    panneauEnonce,
    docOnglet,
    onSucces: validerExo,
    onOuvert: afficherSuivant,
  });
}

// Initialisation PTP
initialiserPtp(() => {
  afficherSuivant();
  afficherPtpUI(document.body, () => afficherSuivant());
});
afficherPtpUI(document.body, () => afficherSuivant());
