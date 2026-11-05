import { analyserScript } from "./visualiseur-variables.js";
import { injecterTests } from "./tests.js";

let urlApercu = null;

// Assemble la page : injecte le CSS et le JS dans index.html, puis les tests.
// contenus = { "index.html": "...", "style.css": "...", ... }
export function assemblerPage(contenus, tests) {
  let code = contenus["index.html"];
  let analyse = analyserScript("");

  for (const [nom, contenu] of Object.entries(contenus)) {
    if (nom === "index.html") continue;
    const extension = nom.split(".").pop();
    const echapper = nom.replace(".", "\\.");

    if (extension === "css") {
      const lien = new RegExp(`<link[^>]*href=["']${echapper}["'][^>]*>`, "g");
      code = code.replace(lien, () => `<style>${contenu}</style>`);
    } else if (extension === "js") {
      analyse = analyserScript(contenu);
      const balise = new RegExp(
        `<script[^>]*src=["']${echapper}["'][^>]*>\\s*</script>`,
        "g",
      );
      code = code.replace(balise, () => `<script>${analyse.code}<\/script>`);
    }
  }
  return { code: injecterTests(code, tests), analyse };
}

// Affiche du HTML dans l'iframe (libère l'ancienne adresse)
export function afficherDansApercu(iframe, code) {
  if (urlApercu) URL.revokeObjectURL(urlApercu);
  urlApercu = URL.createObjectURL(
    new Blob([code], { type: "text/html;charset=utf-8" }),
  );
  iframe.src = urlApercu;
}
