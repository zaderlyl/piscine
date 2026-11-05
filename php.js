import { PhpWeb } from "https://cdn.jsdelivr.net/npm/php-wasm@0.2.0/PhpWeb.mjs";

async function testerPhp(tests, sortie) {
  const resultats = [];
  const assert = (condition, message) => resultats.push({ ok: !!condition, message});
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  try{
    await new AsyncFunction("assert", "sortie", tests)(assert,sortie);
  } catch (erreur) {
    resultats.push({
      ok: false,
      message: "Erreur dans les tests :" +erreur.message
    });
  }
  return resultats;
}

// execute PHP puis sortie pour test

export async function executerPhp(code, tests){
  let sortie = "";
  const moteir = new PhpWeb();
  moteur.addEventListener("output", (e) => {
    sortie += e.detail;
  });
  moteur.addEventListener("error", (e) => {
    sortie += e.detail;
  });

  await moteur.binary; 
  await moteir.run(code);


  return {sortie, resultats: await testerPhp(tests, sortie)};
}