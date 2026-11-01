import { EditorView, basicSetup } from "https://esm.sh/codemirror@6.0.1";
import { html } from "https://esm.sh/@codemirror/lang-html@6.4.9";
import { css } from "https://esm.sh/@codemirror/lang-css@6.3.1";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript@6.2.2";

const apercu = document.getElementById("apercu");
const onglets = document.getElementById("onglets");
const zones = document.getElementById("zones");
const panneauResultats = document.getElementById("resultat");
const CLE_BROUILLON = "piscine-brouillon";
const CLE_SUSPENDU = "piscine-apercyu-suspendu";


const editeurs = {};
const zonesParNom = {};
const boutons = {};

const DELAI_SUSPENDU = 5000;

const fichier = {
  "index.html": html,
  "style.css": css,
  "script.js": javascript,
};

const types = {
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
};

const testsDemo = `
  assert($("h1"), "Il faut une balise h1");
  assert(style("h1", "color") === "rgb(255, 0, 0)", "Le h1 doit être rouge");
  assert($$("input").length === 1, "Il faut un seul champ de saisie");
  type("#nom", "Lilian");
  click("#valider");
  await wait(100);
  assert($("#message")?.textContent === "Bonjour Lilian", "Après le clic sur #valider, #message devrait afficher « Bonjour Lilian »");
`;



let minuteurTests = null;
let minuteur = null;
let urlApercu = null;


// execution des resultat de page

function construireTests(tests) {
  return `<script>
    window.addEventListener("load", async () => {
      const resultats = [];
      const $ = (selecteur) => document.querySelector(selecteur);
      const $$ = (selecteur) => [...document.querySelectorAll(selecteur)];
      const style = (selecteur, propriete) => {
        const element = $(selecteur);
        return element ? getComputedStyle(element)[propriete] : null;
      };
      const click = (selecteur) => $(selecteur)?.click();
      const type = (selecteur, texte) => {
        const element = $(selecteur);
        if (!element) return;
        element.value = texte;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      };
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const assert = (condition, message) => resultats.push({ ok: !!condition, message });
      try {
        ${tests}
      } catch (erreur) {
        resultats.push({ ok: false, message: "Erreur dans les tests : " + erreur.message });
      }
      parent.postMessage({ type: "tests", resultats }, "*");
    });
  <\/script>`;
}


function arreterApercu(){
  sauvegarderBrouillon();
  localStorage.setItem(CLE_SUSPENDU, "1");
  location.reload();
}

// Affiche index.html dans l'iframe, en injectant le CSS et le JS dans la page
function afficherApercu() {
  let code = editeurs["index.html"].state.doc.toString();

  for (const nom of Object.keys(fichier)) {
    if (nom === "index.html") continue;
    const contenu = editeurs[nom].state.doc.toString();
    const extension = nom.split(".").pop();
    const echapper = nom.replace(".", "\\.");

    if (extension === "css") {
      const lien = new RegExp(`<link[^>]*href=["']${echapper}["'][^>]*>`, "g");
      code = code.replace(lien, () => `<style>${contenu}</style>`);
    } else if (extension === "js") {
      const balise = new RegExp(
        `<script[^>]*src=["']${echapper}["'][^>]*>\\s*</script>`,
        "g",
      );
      code = code.replace(balise, () => `<script>${contenu}<\/script>`);
    }
  }
  code += construireTests(testsDemo);
  if (urlApercu) URL.revokeObjectURL(urlApercu);
  urlApercu = URL.createObjectURL(new Blob([code], { type: "text/html" }));
  apercu.src = urlApercu;
  clearTimeout(minuteurTests);
  minuteurTests = setTimeout(arreterApercu, DELAI_SUSPENDU);
}

const theme = EditorView.theme({
  "&": {
    height: "100%",
  },
});

// mise a jour a chaque modif

const ecoute = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    afficherApercu();
    clearTimeout(minuteur);
    minuteur = setTimeout(sauvegarderBrouillon, 1000);
  }
});

// visibilité et cache fichier

function afficherFichier(nom) {
  for (const n in fichier) {
    zonesParNom[n].classList.toggle("cache", n !== nom);
    boutons[n].classList.toggle("actif", n === nom);
  }
}

function lireBrouillon() {
  try {
    return JSON.parse(localStorage.getItem(CLE_BROUILLON)) || {};
  } catch {
    return {};
  }
}

function sauvegarderBrouillon() {
  const brouillon = {};
  for (const nom in editeurs) {
    brouillon[nom] = editeurs[nom].state.doc.toString();
  }
  try {
    localStorage.setItem(CLE_BROUILLON, JSON.stringify(brouillon));
  } catch {
    console.error("Erreur lors de la sauvegarde du brouillon");
  }
}

const brouillon = lireBrouillon();

for (const [nom, langage] of Object.entries(fichier)) {
  const zone = document.createElement("div");
  zone.className = "zone cache";
  zones.append(zone);
  zonesParNom[nom] = zone;

  editeurs[nom] = new EditorView({
    doc: brouillon[nom] || "",
    extensions: [basicSetup, langage(), theme, ecoute],
    parent: zone,
  });

  const bouton = document.createElement("button");
  bouton.textContent = nom;
  bouton.addEventListener("click", () => afficherFichier(nom));
  onglets.append(bouton);
  boutons[nom] = bouton;
}

afficherFichier("index.html");

if (localStorage.getItem(CLE_SUSPENDU)) {
  localStorage.removeItem(CLE_SUSPENDU);
  panneauResultats.textContent =
    "⏱ Aperçu suspendu : ton code semble tourner à l'infini. Corrige-le pour relancer.";
} else {
  afficherApercu();
}



// Affiche les résultats envoyés par l'aperçu
window.addEventListener("message", (e) => {
  if (e.source !== apercu.contentWindow || e.data.type !== "tests") return;
  clearTimeout(minuteurTests);
  const echecs = e.data.resultats.filter((r) => !r.ok);
  panneauResultats.textContent = echecs.length
    ? echecs.map((r) => "❌ " + r.message).join("\n")
    : "✅ Tous les tests passent";
});
