import { lireCode, chargerExo } from "./exo.js";
import { assemblerPage, afficherDansApercu } from "./apercu.js";
import { injecterStockage, lireStockageApercu, ecrireStockageApercu } from "./stockage-apercu.js";
import { executerPhp } from "./php.js?v=2";
import { lireBrouillon, sauvegarderBrouillon } from "./brouillon.js";
import { creerEditeurs, creerEditeurSql } from "./editeur.js";
import { afficherPanneauDoc } from "./doc.js";
import { debloquerEmmet } from "./emmet.js";
import { monterPanneauDepot } from "./depot.js";
import { monterPanneauSchema } from "./schema/panneau.js";
import { monterPanneauSql } from "./sql/panneau.js";
import { creerMenuNavigation } from "./navigation.js";

import { afficherVariables, ecouterValeurs } from "./visualiseur-variables.js";
import { glissable } from "./redimensionner.js";
import {
  marquerReussi,
  estReussi,
  lireProgression,
  chargerListeExos,
  exoSuivant,
  construireExport,
  telechargerExport,
  fusionnerProgression,
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

const btnExporter = document.getElementById("btn-exporter");
const btnImporter = document.getElementById("btn-importer");
const inputImporter = document.getElementById("input-importer");
const msgProgression = document.getElementById("msg-progression");

const boutonPhp = document.createElement("button");

// exo choisi dans l'adresse, par exemple ?exo=html/vanilla/04 (par défaut : HTML 04)
const exoChoisi = new URLSearchParams(location.search).get("exo");
const EXO = /^[\w/-]+$/.test(exoChoisi || "") ? exoChoisi : "html/vanilla/04";

const CLE_BROUILLON = "piscine-brouillon:" + EXO;
const CLE_SUSPENDU = "piscine-apercu-suspendu";

const FICHIER_EXO = `../exos/${EXO}.md`;

const DELAI_SUSPENDU = 5000;

let enregistrerBrouillonActif = null;

// Gestion de l'exportation et de l'importation de la progression
let minuteurMsgProgression = null;

function afficherMessageProgression(texte, estErreur = false) {
  if (!msgProgression) return;
  msgProgression.textContent = texte;
  msgProgression.classList.remove("cache", "succes", "erreur");
  msgProgression.classList.add(estErreur ? "erreur" : "succes");
  clearTimeout(minuteurMsgProgression);
  minuteurMsgProgression = setTimeout(() => {
    msgProgression.classList.add("cache");
  }, 4000);
}

// Affiche le message de confirmation après rechargement si présent
try {
  const msgEnAttente = sessionStorage.getItem("piscine-message-import");
  if (msgEnAttente) {
    sessionStorage.removeItem("piscine-message-import");
    afficherMessageProgression(msgEnAttente, false);
  }
} catch {
  // sessionStorage inaccessible
}

if (btnExporter) {
  btnExporter.addEventListener("click", () => {
    if (typeof enregistrerBrouillonActif === "function") {
      enregistrerBrouillonActif();
    }
    const exportDonnees = construireExport();
    telechargerExport(exportDonnees, "progression-piscine.json");
    afficherMessageProgression("Progression exportée avec succès !");
  });
}

if (btnImporter && inputImporter) {
  btnImporter.addEventListener("click", () => {
    inputImporter.value = "";
    inputImporter.click();
  });

  inputImporter.addEventListener("change", async (e) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;

    try {
      const texte = await fichier.text();
      const donnees = JSON.parse(texte);
      const { nbTotalReussis, nbBrouillonsConserves } = fusionnerProgression(donnees);
      const conserves = nbBrouillonsConserves
        ? ` ${nbBrouillonsConserves} brouillon(s) déjà présent(s) sur ce poste conservé(s).`
        : "";
      try {
        sessionStorage.setItem(
          "piscine-message-import",
          `Progression importée avec succès (${nbTotalReussis} exercice(s) validé(s)).${conserves}`,
        );
      } catch {
        // ignore
      }
      location.reload();
    } catch (erreur) {
      afficherMessageProgression("Erreur lors de l'import : " + erreur.message, true);
    }
  });
}

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

if (panneaux.includes("depot")) {
  // Masque l'éditeur classique, doc et aperçu
  docOnglet.classList.add("cache");
  panneauEnonce.classList.add("cache");
  zones.classList.add("cache");
  apercu.classList.add("cache");
  document.getElementById("separateur-a").classList.add("cache");
  document.getElementById("variables").classList.add("cache");
  document.getElementById("separateur-b").classList.add("cache");
  panneauResultats.classList.add("cache");

  const depotGauche = document.createElement("div");
  depotGauche.id = "depot-gauche";
  document.getElementById("editeur").append(depotGauche);

  const depotDroite = document.createElement("div");
  depotDroite.id = "depot-droite";
  document.getElementById("droite").append(depotDroite);

  monterPanneauDepot({
    conteneurGauche: depotGauche,
    conteneurDroite: depotDroite,
    exo,
    nomExo: EXO,
    auteur: new URLSearchParams(location.search).has("auteur"),
    onSucces: validerExo,
  });

  afficherSuivant();
} else if (panneaux.includes("schema")) {
  // Exo de schéma de base de données : énoncé à gauche, table à compléter à droite
  zones.classList.add("cache");
  apercu.classList.add("cache");
  document.getElementById("separateur-a").classList.add("cache");
  document.getElementById("variables").classList.add("cache");
  document.getElementById("separateur-b").classList.add("cache");
  panneauResultats.classList.add("cache");

  afficherPanneauDoc(exo, panneauEnonce, docOnglet);

  const conteneurSchema = document.createElement("div");
  document.getElementById("droite").append(conteneurSchema);

  monterPanneauSchema({
    conteneur: conteneurSchema,
    section: exo["Schéma"],
    onSucces: validerExo,
  });

  afficherSuivant();
} else if (panneaux.includes("sql")) {
  // Exo de requêtes SQL : énoncé et éditeur à gauche, résultat à droite
  apercu.classList.add("cache");
  document.getElementById("separateur-a").classList.add("cache");
  document.getElementById("variables").classList.add("cache");
  document.getElementById("separateur-b").classList.add("cache");
  panneauResultats.classList.add("cache");

  afficherPanneauDoc(exo, panneauEnonce, docOnglet);

  const zoneSql = document.createElement("div");
  zoneSql.className = "zone";
  zones.append(zoneSql);

  let minuteurSql = null;
  const editeurSql = creerEditeurSql({
    parent: zoneSql,
    doc: lireBrouillon(CLE_BROUILLON)["requete.sql"],
    surChangement(vue) {
      clearTimeout(minuteurSql);
      minuteurSql = setTimeout(
        () => sauvegarderBrouillon(CLE_BROUILLON, { "requete.sql": vue.state.doc.toString() }),
        1000,
      );
    },
  });

  const conteneurSql = document.createElement("div");
  document.getElementById("droite").append(conteneurSql);

  monterPanneauSql({
    conteneur: conteneurSql,
    exo,
    lireRequete: () => editeurSql.state.doc.toString(),
    onSucces: validerExo,
    verification: exo.verification,
  });

  afficherSuivant();
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
