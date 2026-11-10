import { EditorView, basicSetup } from "https://esm.sh/codemirror@6.0.1";
import { html } from "https://esm.sh/@codemirror/lang-html@6.4.9";
import { css } from "https://esm.sh/@codemirror/lang-css@6.3.1";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript@6.2.2";
import { php } from "https://esm.sh/@codemirror/lang-php@6.0.1";
import { emmetTab } from "./emmet.js";

// un éditeur par fichier, avec son langage
const fichier = {
  "index.html": html,
  "style.css": css,
  "script.js": javascript,
  "index.php": php,
};

const theme = EditorView.theme({
  "&": {
    height: "100%",
  },
});

// Crée un éditeur et un onglet par fichier.
// brouillon = { fichier: texte } ; surChangement(vue) est appelée à chaque modification.
// Renvoie { editeurs, afficherFichier }.
export function creerEditeurs({ zones, onglets, brouillon, surChangement, avecPhp = false }) {
  const editeurs = {};
  const zonesParNom = {};
  const boutons = {};

  const ecoute = EditorView.updateListener.of((update) => {
    if (update.docChanged) surChangement(update.view);
  });

  // visibilité et cache fichier
  function afficherFichier(nom) {
    for (const n in zonesParNom) {
      zonesParNom[n].classList.toggle("cache", n !== nom);
      boutons[n].classList.toggle("actif", n === nom);
    }
  }

  for (const [nom, langage] of Object.entries(fichier)) {
    if (nom === "index.php" && !avecPhp) continue;
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

  return { editeurs, afficherFichier };
}
