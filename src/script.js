import { EditorView, basicSetup } from "https://esm.sh/codemirror@6.0.1";
import { html } from "https://esm.sh/@codemirror/lang-html@6.4.9";
import { css } from "https://esm.sh/@codemirror/lang-css@6.3.1";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript@6.2.2";

const apercu = document.getElementById("apercu");
const onglets = document.getElementById("onglets");
const zones = document.getElementById("zones");

const fichier = {
  "index.html": html,
  "style.css": css,
  "script.js": javascript,
};

const editeurs = {};
const zonesParNom = {};
const boutons = {};
let urls = [];

const types = {
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
};
// affichage du code dans iframe avec URL temporaire

function creerURL(code, type) {
  const url = URL.createObjectURL(new Blob([code], { type }));
  urls.push(url);
  return url;
}

function afficherApercu() {
  urls.forEach((u) => URL.revokeObjectURL(u));
  urls = [];

  let code = editeurs["index.html"].state.doc.toString();
  for (const nom of Object.keys(fichier)) {
    if (nom === "index.html") continue;
    const extension = nom.split(".").pop();
    const url = creerURL(editeurs[nom].state.doc.toString(), types[extension]);
    code = code.replaceAll(`src="${nom}"`, `src="${url}"`).replaceAll(`href="${nom}"`, `href="${url}"`); 
  }
apercu.src = creerURL(code, "text/html");

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
  }
});

// visibilité et cache fichier

function afficherFichier(nom) {
  for (const n in fichier) {
    zonesParNom[n].classList.toggle("cache", n !== nom);
    boutons[n].classList.toggle("actif", n === nom);
  }
}

for (const [nom, langage] of Object.entries(fichier)) {
  const zone = document.createElement("div");
  zone.className = "zone cache";
  zones.append(zone);
  zonesParNom[nom] = zone;

  editeurs[nom] = new EditorView({
    doc: "",
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
