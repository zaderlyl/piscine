import { analyserScript } from "./visualiseur-variables.js";
import { injecterTests } from "./tests.js";
import { protegerBoucles, scriptEstJavaScript } from "./boucle-garde.js";

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
    (tout, attrs, contenuScript) =>
      scriptEstJavaScript(attrs)
        ? `<script${attrs}>${protegerBoucles(contenuScript)}<\/script>`
        : tout,
  );

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
      const codeProtege = protegerBoucles(analyse.code);
      const balise = new RegExp(
        `<script[^>]*src=["']${echapper}["'][^>]*>\\s*</script>`,
        "g",
      );
      balisePresente = code.search(balise) !== -1;
      if (balisePresente) {
        code = code.replace(balise, () => `<script>${codeProtege}<\/script>`);
      } else if (contenu.trim()) {
        // Exos JS : index.html peut rester vide, on ajoute alors le script nous-mêmes
        // pour que le code tourne et que les tests passent
        code += `<script>${codeProtege}<\/script>`;
        balisePresente = true;
      }
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
