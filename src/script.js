import { EditorView, basicSetup } from "https://esm.sh/codemirror@6.0.1";
import { html } from "https://esm.sh/@codemirror/lang-html@6.4.9";
import { css } from "https://esm.sh/@codemirror/lang-css@6.3.1";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript@6.2.2";
import expand from "https://esm.sh/emmet@2.4.11";


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

let urlApercu = null;

const types = {
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
};

const CLE_BROUILLON = "piscine-brouillon";

let minuteur = null;

// affichage du code dans iframe avec URL temporaire

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

  if (urlApercu) URL.revokeObjectURL(urlApercu);
  urlApercu = URL.createObjectURL(new Blob([code], { type: "text/html" }));
  apercu.src = urlApercu;
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

// raccourcis clavier pour Emmet

const emmetTab = editorView.domEventHandlers ({
  keydown(event, view) {
    if (event.key !== "Tab" || event.shiftKey) return false;
    const { from, to } =view.state.selection.main;
    if (from !== to) return false;

    const ligne = view.state.doc.lineAt(from);
    const abreviation = ligne.text.slice(0, from - ligne.from).match(/\S+$/)?.[0];
    if(!abreviation) return false;

    let resultat;
    try {
      resultat = expand(abreviation, { type: "html" });
    } catch {
      return false;
    }

    event.preventDefault();
    const debut = from - abreviation.lenght;
    view.dispatch({
      changes: { from: debut, to: from, insert: resultat},
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
    extensions: [basicSetup, langage(), theme, ecoute, ...(nom === "index.html" ? [emmetTab] : [])],
    parent: zone,
  });

  const bouton = document.createElement("button");
  bouton.textContent = nom;
  bouton.addEventListener("click", () => afficherFichier(nom));
  onglets.append(bouton);
  boutons[nom] = bouton;
}

afficherFichier("index.html");

afficherApercu();
