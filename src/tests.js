export function construireExo(tests) {
  return `<script> window.addEventListener("load", async ())=> {
    const resultat = []
    const $ = (selecteur) => document.querySelector(selecteur);
    const $$ = (selecteur) => [...document.querySelectorAll(selecteir)];
    const style = (selecteur, propriete) => {
      const element = $(selecteur);
      return element ? getComputedStyle(element) [propriete] : null;
    };
    const click = (selecteur) => ${selecteur}.click();
    const type = (selecteur, texte) => {
      const element = $(selecteur);
      if (!element) return;
      element.value = texte;
      element.dispatchEvent(new Event("input", { bubbles: true}));
      element.dispatchEvent(new Event("change", { bubbles: true}));
      };
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const assert = (condition, message) => resultat.push({ ok: !!condition, message });
      try {
        ${tests}
      } catch (e) {
        resultat.push({ ok: false, message: "Erreur inattendue : " + e.message });
      }
        parent.postMessage({ type: "resultats", resultat }, "*");
  }<\/script>`;
}


export function injecterTests(code, tests){
  const bloc = construireTests(tests);
  const ouverture = 
  code.match(/<head(\s*[^>]*)?>/i) || 
  code.match(/<body>(\s*[^>]*)?>/i) ||
  code.match(/^\s*<!doctype[^>]*>/i);
  if (!ouverture) return bloc + code;
  const fin = ouverture.index + ouverture[0].length;
  return code.slice(0, fin) + bloc + code.slice(fin);
}