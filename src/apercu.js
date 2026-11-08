import { analyserScript } from "./visualiseur-variables.js";
import { injecterTests } from "./tests.js";

let urlApercu = null;

// Assemble la page : injecte le CSS et le JS dans index.html, puis les tests.
// contenus = { "index.html": "...", "style.css": "...", ... }
export function assemblerPage(contenus, tests) {
  let code = contenus["index.html"] || "";
  let analyse = analyserScript("");
  let balisePresente = false;

  for (const [nom, contenu] of Object.entries(contenus)) {
    if (nom === "index.html") continue;
    const extension = nom.split(".").pop();
    const echapper = nom.replace(".", "\\.");

    if (extension === "css") {
      const lien = new RegExp(`<link[^>]*href=["']${echapper}["'][^>]*>`, "g");
      if (code.search(lien) !== -1) {
        code = code.replace(lien, () => `<style>${contenu}</style>`);
      } else if (contenu.trim()) {
        code += `<style>${contenu}</style>`;
      }
    } else if (extension === "js") {
      analyse = analyserScript(contenu);
      const balise = new RegExp(
        `<script[^>]*src=["']${echapper}["'][^>]*>\\s*</script>`,
        "g",
      );
      balisePresente = code.search(balise) !== -1;
      if (balisePresente) {
        code = code.replace(balise, () => `<script>${analyse.code}<\/script>`);
      } else if (contenu.trim()) {
        // En mode exercice JS (ou si index.html ne contient pas la balise),
        // on injecte automatiquement le script pour que le code tourne et que les tests passent
        code += `<script>${analyse.code}<\/script>`;
        balisePresente = true;
      }
    }
  }
  return { code: injecterTests(code, tests), analyse, balisePresente };
}

// Affiche du HTML dans l'iframe (libère l'ancienne adresse)
export function afficherDansApercu(iframe, code) {
  if (urlApercu) URL.revokeObjectURL(urlApercu);
  urlApercu = URL.createObjectURL(
    new Blob([code], { type: "text/html;charset=utf-8" }),
  );
  iframe.src = urlApercu;
}
