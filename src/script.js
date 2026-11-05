import { lireCode, chargerExo } from "./exo.js";
import { assemblerPage, afficherDansApercu } from "./apercu.js";
import { executerPhp } from "./php.js";
import { lireBrouillon, sauvegarderBrouillon } from "./brouillon.js";
import { creerEditeurs } from "./editeur.js";
import { afficherPanneauDoc } from "./doc.js";


import { afficherVariables, ecouterValeurs } from "./visualiseur-variables.js";
import { glissable } from "./redimensionner.js";
import { marquerReussi } from "./progression.js";


const apercu = document.getElementById("apercu");
const onglets = document.getElementById("onglets");
const zones = document.getElementById("zones");
const panneauResultats = document.getElementById("resultat");
const panneauEnonce = document.getElementById("enonce");
const docOnglet = document.getElementById("doc-onglet");

const boutonPhp = document.createElement("button");

// exo choisi dans l'adresse, par exemple ?exo=html/vanilla/04 (par défaut : HTML 04)
const exoChoisi = new URLSearchParams(location.search).get("exo");
const EXO = /^[\w/-]+$/.test(exoChoisi || "") ? exoChoisi : "html/vanilla/04";

const CLE_BROUILLON = "piscine-brouillon:" + EXO;
const CLE_SUSPENDU = "piscine-apercyu-suspendu";

const FICHIER_EXO = `../exos/${EXO}.md`;

const DELAI_SUSPENDU = 5000;

const types = {
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
};

let minuteurTests = null;
let minuteur = null;
let testsExo = "";



function arreterApercu() {
  enregistrerBrouillon();
  localStorage.setItem(CLE_SUSPENDU, "1");
  location.reload();
}





// Affiche index.html dans l'iframe
function afficherApercu() {
  const { code, analyse } = assemblerPage(lireContenus(), testsExo);
  afficherVariables(analyse);
  afficherDansApercu(apercu, code);
  clearTimeout(minuteurTests);
  minuteurTests = setTimeout(arreterApercu, DELAI_SUSPENDU);
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

const { editeurs, afficherFichier } = creerEditeurs({
  zones,
  onglets,
  brouillon: lireBrouillon(CLE_BROUILLON),
  surChangement(vue) {
    if (vue !== editeurs["index.php"]) afficherApercu();
    clearTimeout(minuteur);
    minuteur = setTimeout(enregistrerBrouillon, 1000);
  },
});

const exo = await chargerExo(FICHIER_EXO);
testsExo = lireCode(exo["Tests"]);

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
}

// Mode auteur ( acces via ?auteur ) bouton pour verif solution

if (new URLSearchParams(location.search).has("auteur")) {
  const boutonSolution = document.createElement("button");
  boutonSolution.textContent = "Charger la solution";
  boutonSolution.addEventListener("click", chargerSolution);
  onglets.append(boutonSolution);
}

boutonPhp.textContent = "Exécuter PHP";
boutonPhp.addEventListener("click", lancerPhp);
onglets.append(boutonPhp);

afficherFichier("index.html");

if (localStorage.getItem(CLE_SUSPENDU)) {
  localStorage.removeItem(CLE_SUSPENDU);
  panneauResultats.textContent =
    "Aperçu suspendu : ton code semble tourner à l'infini. Corrige-le pour relancer.";
} else {
  afficherApercu();
}

ecouterValeurs(apercu);

// Barres pour agrandir ou réduire les colonnes et les panneaux de droite
glissable(document.getElementById("separateur-v"), document.getElementById("editeur"), {
  axe: "x",
  variable: "--largeur-gauche",
  min: 200,
});
glissable(document.getElementById("separateur-a"), apercu, {
  axe: "y",
  variable: "--h-apercu",
  min: 80,
});
glissable(document.getElementById("separateur-b"), document.getElementById("variables"), {
  axe: "y",
  variable: "--h-variables",
  min: 60,
});

// Affiche les résultats envoyés par l'aperçu
window.addEventListener("message", (e) => {
  if (e.source !== apercu.contentWindow || e.data.type !== "tests") return;
  clearTimeout(minuteurTests);
  const echecs = e.data.resultats.filter((r) => !r.ok);
  panneauResultats.textContent = echecs.length
    ? echecs.map((r) => "❌ " + r.message).join("\n")
    : "✅ Tous les tests passent";
  if (!echecs.length && e.data.resultats.length) marquerReussi(EXO);
});


async function lancerPhp() {
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
    if (!echecs.length && resultats.length)marquerReussi(EXO);

  clearTimeout(minuteurTests);
  afficherDansApercu(apercu, sortie);
}
