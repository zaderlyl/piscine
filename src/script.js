import { EditorView, basicSetup } from "https://esm.sh/codemirror@6.0.1";
import { html } from "https://esm.sh/@codemirror/lang-html@6.4.9";
import { css } from "https://esm.sh/@codemirror/lang-css@6.3.1";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript@6.2.2";
import { marked } from "https://esm.sh/marked@12.0.2";
import { php } from "https://esm.sh/@codemirror/lang-php@6.0.1";
import { PhpWeb } from "https://cdn.jsdelivr.net/npm/php-wasm@0.2.0/PhpWeb.mjs";


import expand from "https://esm.sh/emmet@2.4.11";



const apercu = document.getElementById("apercu");
const onglets = document.getElementById("onglets");
const zones = document.getElementById("zones");
const panneauResultats = document.getElementById("resultat");
const panneauEnonce = document.getElementById("enonce");
const docOnglet = document.getElementById("doc-onglet");

const boutonPhp = document.createElement("button");



const CLE_BROUILLON = "piscine-brouillon";
const CLE_SUSPENDU = "piscine-apercyu-suspendu";
const CLE_EMMET = "piscine-emmet";

const FICHIER_EXO = "../exos/html/vanilla/04.md";

const editeurs = {};
const zonesParNom = {};
const boutons = {};
const boutonsDoc = {};



const SECTION_DOC = ["Énoncé", "Cours", "Méthode", "Indice"];


const moteurPhp = new PhpWeb();



const DELAI_SUSPENDU = 5000;

const fichier = {
  "index.html": html,
  "style.css": css,
  "script.js": javascript,
  "index.php": php,
};

const types = {
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
};

let minuteurTests = null;
let minuteur = null;
let urlApercu = null;

let testsExo = "";
let sortiePhp = "";

// decoupage fichier exo en section -> ("##Titre")

function lireExo(texte) {
  const section = {};
  let courant = null;
  for (const ligne of texte.split("\n")) {
    const titre = ligne.match(/^##\s*(.*)/);
    if (titre) {
      courant = titre[1].trim();
      section[courant] = "";
    } else if (courant) {
      section[courant] += ligne + "\n";
    }
  }
  return section;
}

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

function arreterApercu() {
  sauvegarderBrouillon();
  localStorage.setItem(CLE_SUSPENDU, "1");
  location.reload();
}

// Insère le code de test au début du document (après <head>, <body> ou le doctype),
// car il serait ignoré après un </frameset>
function injecterTests(code, tests) {
  const bloc = construireTests(tests);
  const ouverture =
    code.match(/<head(\s[^>]*)?>/i) ||
    code.match(/<body(\s[^>]*)?>/i) ||
    code.match(/^\s*<!doctype[^>]*>/i);
  if (!ouverture) return bloc + code;
  const fin = ouverture.index + ouverture[0].length;
  return code.slice(0, fin) + bloc + code.slice(fin);
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
  code = injecterTests(code, testsExo);
  if (urlApercu) URL.revokeObjectURL(urlApercu);
  urlApercu = URL.createObjectURL(new Blob([code], { type: "text/html;charset=utf-8" }));
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
    if (update.view !== editeurs["index.php"])
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

// abreviation lock au start puis deblocable
function lireEmmet() {
  try {
    return JSON.parse(localStorage.getItem(CLE_EMMET)) || [false];
  } catch {
    return [];
  }
}

const emmet = lireEmmet();

// raccourcis clavier pour Emmet
const emmetTab = EditorView.domEventHandlers({
  keydown(event, view) {
    if (event.key !== "Tab" || event.shiftKey) return false;
    const { from, to } = view.state.selection.main;
    if (from !== to) return false;

    const ligne = view.state.doc.lineAt(from);
    const abreviation = ligne.text
      .slice(0, from - ligne.from)
      .match(/\S+$/)?.[0];
    if (!abreviation) return false;
    if (!emmetDebloque.includes(abreviation)) return false;
    
    let resultat;
    try {
      resultat = expand(abreviation);
    } catch {
      return false;
    }

    event.preventDefault();
    const debut = from - abreviation.length;
    view.dispatch({
      changes: { from: debut, to: from, insert: resultat },
      selection: { anchor: debut + resultat.length },
    });
    return true;
  },
});

for (const [nom, langage] of Object.entries(fichier)) {
  const zone = document.createElement("div");
  zone.className = "zone cache";
  zones.append(zone);
  zonesParNom[nom] = zone;

  editeurs[nom] = new EditorView({
    doc: brouillon[nom] || "",
    extensions: [
      basicSetup,
      langage(),
      theme,
      ecoute,
      ...(nom === "index.html" ? [emmetTab] : []),
    ],
    parent: zone,
  });

  const bouton = document.createElement("button");
  bouton.textContent = nom;
  bouton.addEventListener("click", () => afficherFichier(nom));
  onglets.append(bouton);
  boutons[nom] = bouton;
}

// recuperer cotenu d'un section
function lireCode(section) {
  const bloc = section.match(/```(\w+)?\n([\s\S]*?)```/);
  return bloc ? bloc[2] : "";
}

const reponse = await fetch(FICHIER_EXO);
const exo = lireExo(await reponse.text());
testsExo = lireCode(exo["Tests"]);

// Panneau doc : un onglet par section de l'exo
function afficherDoc(nom) {
  panneauEnonce.innerHTML = marked.parse((exo[nom] || "").trim());
  for (const [n, bouton] of Object.entries(boutonsDoc)) {
    bouton.classList.toggle("actif", n === nom);
  }
}

for (const nom of SECTION_DOC) {
  if (!exo[nom]) continue;
  const bouton = document.createElement("button");
  bouton.textContent = nom;
  bouton.addEventListener("click", () => afficherDoc(nom));
  docOnglet.append(bouton);
  boutonsDoc[nom] = bouton;
}

afficherDoc("Énoncé");


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

// PHP dans le navigateur : la sortie s'affiche en texte (console) et en HTML (aperçu)
moteurPhp.addEventListener("output", (e) => { sortiePhp += e.detail; });
moteurPhp.addEventListener("error", (e) => { sortiePhp += e.detail; });

async function testerPhp(){
  const resultats = [];
  const assert = (condition, message) => resultats.push({ ok: condition, message });
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  try {
    await new AsyncFunction("assert","sortie", testsExo)(assert, sortie);
  } catch (erreur) {
    resultats.push({ ok: false, message: "Erreur dans les tests : " + erreur.message });
  }
  return resultats;
}

async function lancerPhp() {
  const echecs = ( await testerPhp(sortiePhp)).filter((r) => !r.ok);
  panneauResultats.textContent = sortiePhp + "\n\n" + (echecs.length ? echecs.maps((r) => " X " + r.message).join("\n") : " OK : Alle tests are done");
  sortiePhp = "";
  await moteurPhp.binary;
  await moteurPhp.run(editeurs["index.php"].state.doc.toString());
  panneauResultats.textContent = sortiePhp;

  clearTimeout(minuteurTests);
  if (urlApercu) URL.revokeObjectURL(urlApercu);
  urlApercu = URL.createObjectURL(
    new Blob([sortiePhp], { type: "text/html;charset=utf-8" }),
  );
  apercu.src = urlApercu;
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

// Affiche les résultats envoyés par l'aperçu
window.addEventListener("message", (e) => {
  if (e.source !== apercu.contentWindow || e.data.type !== "tests") return;
  clearTimeout(minuteurTests);
  const echecs = e.data.resultats.filter((r) => !r.ok);
  panneauResultats.textContent = echecs.length
    ? echecs.map((r) => "❌ " + r.message).join("\n")
    : "✅ Tous les tests passent";
});
