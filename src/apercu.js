import { analyserScript } from "./visualiseur-variables.js";
import { injecterTests } from "./tests.js";
import { protegerBoucles } from "./boucle-garde.js";

export { protegerBoucles };

let urlApercu = null;

// Assemble la page : injecte le CSS et le JS dans index.html, puis les tests.
// contenus = { "index.html": "...", "style.css": "...", ... }
export function assemblerPage(contenus, tests) {
  let code = contenus["index.html"] || "";
  let analyse = analyserScript("");
  let balisePresente = false;

  // Protège les boucles dans les éventuels scripts inline de index.html
  code = code.replace(
    /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi,
    (_, attrs, contenuScript) =>
      `<script${attrs}>${protegerBoucles(contenuScript)}<\/script>`,
  );

  for (const [nom, contenu] of Object.entries(contenus)) {
    if (nom === "index.html") continue;
    const extension = nom.split(".").pop();
    const echapper = nom.replace(".", "\\.");

    if (extension === "css") {
      const lien = new RegExp(`<link[^>]*href=["']${echapper}["'][^>]*>`, "g");
      code = code.replace(lien, () => `<style>${contenu}</style>`);
    } else if (extension === "js") {
      analyse = analyserScript(contenu);
      const codeProtege = protegerBoucles(analyse.code);
      const balise = new RegExp(
        `<script[^>]*src=["']${echapper}["'][^>]*>\\s*</script>`,
        "g",
      );
      // Sans cette balise dans index.html, le script de l'élève ne tourne pas : on le dit au panneau
      balisePresente = code.search(balise) !== -1;
      code = code.replace(balise, () => `<script>${codeProtege}<\/script>`);
    }
  }
  const testsProteges = tests ? protegerBoucles(tests) : "";
  return { code: injecterTests(code, testsProteges), analyse, balisePresente };
}

// Affiche du HTML dans l'iframe (libère l'ancienne adresse)
export function afficherDansApercu(iframe, code) {
  if (urlApercu) URL.revokeObjectURL(urlApercu);
  urlApercu = URL.createObjectURL(
    new Blob([code], { type: "text/html;charset=utf-8" }),
  );
  iframe.src = urlApercu;
}
