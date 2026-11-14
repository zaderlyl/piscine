import { PhpWeb } from "https://cdn.jsdelivr.net/npm/php-wasm@0.2.0/PhpWeb.mjs";
// Ajoute les extensions sqlite3 et pdo_sqlite (bases en mémoire pour les exos PDO)
import sqlite from "https://cdn.jsdelivr.net/npm/php-wasm-sqlite@0.2.0/index.mjs";

// Exécute les tests d'un exo PHP sur la sortie du programme
async function testerPhp(tests, sortie, code) {
  const resultats = [];
  const assert = (condition, message) =>
    resultats.push({ ok: !!condition, message });
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  try {
    await new AsyncFunction("assert", "sortie", "code", tests)(assert, sortie, code);
  } catch (erreur) {
    resultats.push({
      ok: false,
      message: "Erreur dans les tests : " + erreur.message,
    });
  }
  return resultats;
}

// Exécute du code PHP puis les tests ; renvoie { sortie, resultats }
export async function executerPhp(code, tests) {
  let sortie = "";
  const moteur = new PhpWeb({ version: "8.4", sharedLibs: [sqlite] }); // un moteur neuf à chaque exécution
  moteur.addEventListener("output", (e) => {
    sortie += e.detail;
  });
  moteur.addEventListener("error", (e) => {
    sortie += e.detail;
  });

  await moteur.binary;
  await moteur.run(code);

  return { sortie, resultats: await testerPhp(tests, sortie, code) };
}
