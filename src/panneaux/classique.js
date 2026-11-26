// Panneau « classique » (HTML, CSS, JS, PHP) : éditeurs à onglets, aperçu, tests et exécution PHP
import { lireCode } from "../exo.js";
import { contenuEcrit } from "../projet.js";
import { assemblerPage, afficherDansApercu } from "../apercu.js";
import { injecterStockage, lireStockageApercu, ecrireStockageApercu } from "../stockage-apercu.js";
import { executerPhp } from "../php.js?v=2";
import { lireBrouillon, sauvegarderBrouillon } from "../brouillon.js";
import { creerEditeurs } from "../editeur.js";
import { afficherPanneauDoc } from "../doc.js";
import { debloquerEmmet } from "../emmet.js";
import { contenusPageCachee } from "../page-cachee.js";
import { afficherVariables, ecouterValeurs } from "../visualiseur-variables.js";
import { glissable } from "../redimensionner.js";

const CLE_SUSPENDU = "piscine-apercu-suspendu";
const DELAI_SUSPENDU = 5000;

// Retourne la fonction qui enregistre le brouillon (appelée avant l'export de la progression)
export function monterPanneauClassique({
  exo,
  nomExo,
  cleBrouillon,
  apercu,
  onglets,
  zones,
  panneauResultats,
  panneauEnonce,
  docOnglet,
  onSucces,
  onOuvert,
}) {
  const boutonPhp = document.createElement("button");

  let minuteurTests = null;
  let minuteur = null;
  let testsExo = lireCode(exo["Tests"] ?? ""); // un projet n'a pas de tests

  function arreterApercu() {
    enregistrerBrouillon();
    localStorage.setItem(CLE_SUSPENDU, "1");
    location.reload();
  }

  // Contenu des éditeurs : c'est ce qui est enregistré dans le brouillon de l'élève
  function lireContenus() {
    const contenus = {};
    for (const nom in editeurs) {
      contenus[nom] = editeurs[nom].state.doc.toString();
    }
    return contenus;
  }

  // Fichiers de l'aperçu : pour un exo à page cachée, la page de l'exo plus le script de l'élève
  function lireContenusApercu() {
    return exo.page ? contenusPageCachee(exo.page, lireContenus()["script.js"] ?? "") : lireContenus();
  }

  function enregistrerBrouillon() {
    sauvegarderBrouillon(cleBrouillon, lireContenus());
  }

  // Affiche index.html dans l'iframe
  function afficherApercu() {
    if (nomExo.startsWith("php/")) return; // les exos PHP se testent avec « Exécuter PHP »
    const { code, analyse, balisePresente } = assemblerPage(lireContenusApercu(), testsExo);
    afficherVariables(analyse, balisePresente);
    // localStorage est interdit dans l'iframe isolée : on y place un faux, gardé par exo
    afficherDansApercu(apercu, injecterStockage(code, lireStockageApercu(nomExo)));
    clearTimeout(minuteurTests);
    minuteurTests = setTimeout(arreterApercu, DELAI_SUSPENDU);
  }

  const { editeurs, afficherFichier } = creerEditeurs({
    zones,
    onglets,
    brouillon: lireBrouillon(cleBrouillon),
    avecPhp: nomExo.startsWith("php/"),
    // exo à page cachée : l'élève n'écrit que script.js
    fichiers: exo.page ? ["script.js"] : null,
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

  // Projet : l'éditeur démarre vide ; si l'exo a un squelette, l'élève peut le charger d'un clic
  if (Object.keys(exo.squelette).length > 0) {
    const boutonSquelette = document.createElement("button");
    boutonSquelette.textContent = "Partir d'un squelette";
    boutonSquelette.addEventListener("click", () => {
      if (contenuEcrit(lireContenus()) && !confirm("Le squelette va remplacer ce que tu as écrit. Continuer ?")) return;
      for (const [nom, contenu] of Object.entries(exo.squelette)) {
        const editeur = editeurs[nom];
        if (!editeur) continue;
        editeur.dispatch({ changes: { from: 0, to: editeur.state.doc.length, insert: contenu } });
      }
    });
    onglets.append(boutonSquelette);
  }

  if (nomExo.startsWith("php/")) {
    boutonPhp.textContent = "Exécuter PHP";
    boutonPhp.addEventListener("click", lancerPhp);
    onglets.append(boutonPhp);
  }

  onOuvert();
  // Fichier ouvert au départ : script.js pour les exos JS, index.php pour PHP, sinon index.html
  const fichierParDefaut = exo.type === "projet"
    ? "index.html"
    : exo.page || nomExo.startsWith("js/") || exo["Solution: script.js"]
      ? "script.js"
      : nomExo.startsWith("php/") || exo["Solution: index.php"]
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
    ecrireStockageApercu(nomExo, e.data.donnees);
  });

  // Affiche les résultats envoyés par l'aperçu
  window.addEventListener("message", (e) => {
    if (e.source !== apercu.contentWindow || e.data.type !== "tests") return;
    clearTimeout(minuteurTests);
    if (exo.type === "projet") {
      panneauResultats.textContent = "Projet libre : pas de tests automatiques.";
      return;
    }
    const echecs = e.data.resultats.filter((r) => !r.ok);
    panneauResultats.textContent = echecs.length
      ? echecs.map((r) => "❌ " + r.message).join("\n")
      : "✅ Tous les tests passent";
    if (!echecs.length && e.data.resultats.length) {
      if (testsExo && exo.emmetDebloque) debloquerEmmet(exo.emmetDebloque);
      onSucces();
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
        onSucces();
      }

      clearTimeout(minuteurTests);
      afficherDansApercu(apercu, sortie);
    } finally {
      executionPhpEnCours = false;
      boutonPhp.disabled = false;
    }
  }

  return enregistrerBrouillon;
}
