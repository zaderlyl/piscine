// Construit le bloc <script> de tests injecté dans l'aperçu
export function construireTests(tests) {
  return `<script>
    const executerTests = async () => {
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
      const code = window.__code ?? "";
      try {
        ${tests}
      } catch (erreur) {
        resultats.push({ ok: false, message: "Erreur dans les tests : " + erreur.message });
      }
      parent.postMessage({ type: "tests", resultats }, "*");
    };
    if (document.readyState === "complete") {
      executerTests();
    } else {
      window.addEventListener("load", executerTests);
    }
  <\/script>`;
}

// Insère le code de test au début du document (après <head>, <body> ou le doctype),
// car il serait ignoré après un </frameset>
export function injecterTests(code, tests) {
  const bloc = construireTests(tests);
  const ouverture =
    code.match(/<head(\s[^>]*)?>/i) ||
    code.match(/<body(\s[^>]*)?>/i) ||
    code.match(/^\s*<!doctype[^>]*>/i);
  if (!ouverture) return bloc + code;
  const fin = ouverture.index + ouverture[0].length;
  return code.slice(0, fin) + bloc + code.slice(fin);
}
