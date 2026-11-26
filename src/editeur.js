import { EditorView, basicSetup } from "https://esm.sh/codemirror@6.0.1";
import { html } from "https://esm.sh/@codemirror/lang-html@6.4.9";
import { css } from "https://esm.sh/@codemirror/lang-css@6.3.1";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript@6.2.2";
import { php } from "https://esm.sh/@codemirror/lang-php@6.0.1";
import { sql } from "https://esm.sh/@codemirror/lang-sql@6.8.0";
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
// `fichiers` limite les éditeurs créés (par exemple ["script.js"] pour un exo à page cachée) ;
// sans lui, tous les fichiers sont créés (index.php seulement si avecPhp).
// Renvoie { editeurs, afficherFichier }.
export function creerEditeurs({ zones, onglets, brouillon, surChangement, avecPhp = false, fichiers = null }) {
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
    if (fichiers && !fichiers.includes(nom)) continue;
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

// Éditeur SQL seul (exos de requêtes). surChangement() est appelée à chaque modification.
export function creerEditeurSql({ parent, doc, surChangement }) {
  return new EditorView({
    doc: doc || "",
    extensions: [
      basicSetup,
      sql(),
      theme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && surChangement) surChangement(update.view);
      }),
    ],
    parent,
  });
}
