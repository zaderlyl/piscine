// Exo à page cachée : la section « ## Page » de l'exo contient une page HTML complète (avec son CSS
// dans un <style>). L'élève ne la voit pas : il écrit seulement script.js, et l'aperçu affiche la page
// avec son script. Voir docs/ecrire-un-exo.md.

import { lireCode } from "./exo.js";

const BALISE_SCRIPT = /<script[^>]*\bsrc=["']script\.js["'][^>]*>\s*<\/script>/i;

// Page HTML de l'exo (chaîne vide si l'exo n'a pas de section « Page »).
export function lirePage(exo) {
  return lireCode(exo["Page"] ?? "");
}

// Liste des problèmes de la page (vide si tout va bien).
export function problemesPage(page) {
  const problemes = [];
  if (!page.trim()) {
    problemes.push("la section « Page » n'a pas de bloc de code HTML");
  } else if (!BALISE_SCRIPT.test(page)) {
    problemes.push("la page doit contenir <script src=\"script.js\"></script>");
  }
  return problemes;
}

// Fichiers à assembler (voir assemblerPage) : la page cachée et le script de l'élève.
export function contenusPageCachee(page, script) {
  return { "index.html": page, "script.js": script };
}
