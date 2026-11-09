import {
  GARDE_BOUCLE_CODE,
  DELAI_TESTS_MS,
  MESSAGE_BOUCLE_TROP_LONGUE,
} from "./boucle-garde.js";

// Construit le bloc <script> de tests injecté dans l'aperçu
export function construireTests(tests) {
  return `<script>
    ${GARDE_BOUCLE_CODE}
    let __erreurInterrompue = false;
    const __signalerBoucle = () => {
      if (__erreurInterrompue) return;
      __erreurInterrompue = true;
      parent.postMessage(
        {
          type: "tests",
          resultats: [{ ok: false, message: "${MESSAGE_BOUCLE_TROP_LONGUE}" }],
        },
        "*",
      );
    };
    // L'erreur du garde est reconnue à son marqueur, pas à son texte : une erreur de l'élève
    // qui parlerait de « boucles » ne sera pas prise pour une boucle infinie.
    window.addEventListener("error", (e) => {
      if (e.error && e.error.garde === true) __signalerBoucle();
    });
    window.addEventListener("load", async () => {
      // Le garde a pu se déclencher sans que l'erreur remonte (try/catch de l'élève)
      if (window.__gardeDeclenche) __signalerBoucle();
      if (__erreurInterrompue) return;
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
      const delaiTests = new Promise((_, reject) =>
        setTimeout(
          () => reject({ garde: true }),
          ${DELAI_TESTS_MS},
        ),
      );
      try {
        await Promise.race([
          (async () => {
            ${tests}
          })(),
          delaiTests,
        ]);
      } catch (erreur) {
        const message = erreur && erreur.garde
          ? "${MESSAGE_BOUCLE_TROP_LONGUE}"
          : "Erreur dans les tests : " + (erreur && erreur.message);
        resultats.push({ ok: false, message });
      }
      if (window.__gardeDeclenche) __signalerBoucle();
      if (__erreurInterrompue) return;
      parent.postMessage({ type: "tests", resultats }, "*");
    });
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
