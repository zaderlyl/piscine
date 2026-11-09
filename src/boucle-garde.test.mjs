import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  protegerBoucles,
  GARDE_BOUCLE_CODE,
  MESSAGE_BOUCLE_TROP_LONGUE,
} from "./boucle-garde.js";
import { construireTests, injecterTests } from "./tests.js";

test("protegerBoucles : instrumente while avec accolades", () => {
  const code = "while (true) { let a = 1; }";
  const protege = protegerBoucles(code);
  assert.match(protege, /while\s*\(true\)\s*\{\s*__verifierBoucle\(\d+\);/);
});

test("protegerBoucles : instrumente while sans accolades", () => {
  const code = "while (true) a++;";
  const protege = protegerBoucles(code);
  assert.match(protege, /while\s*\(true\)\s*\{\s*__verifierBoucle\(\d+\);\s*a\+\+;\s*\}/);
});

test("protegerBoucles : instrumente for classique et for..of", () => {
  const code = "for (let i = 0; i < 10; i++) { sum += i; } for (const x of items) { use(x); }";
  const protege = protegerBoucles(code);
  assert.match(protege, /for\s*\(let i = 0; i < 10; i\+\+\)\s*\{\s*__verifierBoucle\(\d+\);/);
  assert.match(protege, /for\s*\(const x of items\)\s*\{\s*__verifierBoucle\(\d+\);/);
});

test("protegerBoucles : instrumente do..while", () => {
  const code = "do { x++; } while (x < 10);";
  const protege = protegerBoucles(code);
  assert.match(protege, /do\s*\{\s*__verifierBoucle\(\d+\);/);
  assert.doesNotMatch(protege, /while\s*\(x < 10\)\s*\{\s*__verifierBoucle/);
});

test("protegerBoucles : ignore les chaînes et commentaires", () => {
  const code = `
    // while (true) {}
    /* for (;;) {} */
    const msg = "while (true) {}";
    const tpl = \`for (let i = 0; i < 10; i++) {}\`;
  `;
  const protege = protegerBoucles(code);
  assert.equal(protege, code);
});

test("protegerBoucles : ignore les propriétés d'objets", () => {
  const code = "config.while = true; obj.for = false;";
  const protege = protegerBoucles(code);
  assert.equal(protege, code);
});

test("GARDE_BOUCLE_CODE : interrompt une boucle infinie après le délai", () => {
  const environnement = {};
  const codeGardeCourt = GARDE_BOUCLE_CODE.replace(
    /\$\{DELAI_BOUCLE_MS\}|\d{4}/,
    "50",
  );
  const fnGarde = new Function("window", codeGardeCourt + "; return window.__verifierBoucle;");
  const verifier = fnGarde(environnement);

  const debut = Date.now();
  assert.throws(
    () => {
      while (true) {
        verifier(0);
      }
    },
    (err) => err.message === MESSAGE_BOUCLE_TROP_LONGUE,
  );
  const duree = Date.now() - debut;
  assert.ok(duree >= 40, `La boucle s'est interrompue après ${duree}ms`);
});

test("GARDE_BOUCLE_CODE : laisse tourner les boucles normales", () => {
  const environnement = {};
  const fnGarde = new Function("window", GARDE_BOUCLE_CODE + "; return window.__verifierBoucle;");
  const verifier = fnGarde(environnement);

  let compteur = 0;
  for (let i = 0; i < 10000; i++) {
    verifier(1);
    compteur++;
  }
  assert.equal(compteur, 10000);
});

test("construireTests : génère un script avec écouteur d'erreur et timeout", () => {
  const tests = 'assert(document.title === "Test", "titre");';
  const script = construireTests(tests);
  assert.ok(script.includes("__verifierBoucle"));
  assert.ok(script.includes("addEventListener(\"error\""));
  assert.ok(script.includes("Promise.race"));
  assert.ok(script.includes(MESSAGE_BOUCLE_TROP_LONGUE));
});

test("injecterTests : insère les tests après head ou body", () => {
  const html = "<!doctype html><html><head><title>Test</title></head><body></body></html>";
  const injecte = injecterTests(html, "assert(true, 'ok');");
  assert.ok(injecte.startsWith("<!doctype html><html><head><script>"));
});

test("Intégration JSDOM : interruption d'une boucle infinie dans le script élève", async () => {
  const codeEleve = "while (true) {}";
  const codeProtege = protegerBoucles(codeEleve);
  const html = `<!doctype html><html><head><script>${codeProtege}</script></head><body></body></html>`;
  const codeAssemble = injecterTests(html, "assert(true, 'ok');");
  const codeRapide = codeAssemble.replace(/3000/g, "50");

  let messageRecu = null;
  const dom = new JSDOM(codeRapide, {
    runScripts: "dangerously",
    beforeParse(window) {
      window.parent = {
        postMessage(data) {
          messageRecu = data;
        },
      };
    },
  });

  await new Promise((resolve) => {
    const debut = Date.now();
    const interval = setInterval(() => {
      if (messageRecu || Date.now() - debut > 2000) {
        clearInterval(interval);
        resolve();
      }
    }, 10);
  });

  dom.window.close();

  assert.ok(messageRecu, "Un message a été posté au parent");
  assert.equal(messageRecu.type, "tests");
  assert.equal(messageRecu.resultats.length, 1);
  assert.equal(messageRecu.resultats[0].ok, false);
  assert.equal(
    messageRecu.resultats[0].message,
    MESSAGE_BOUCLE_TROP_LONGUE,
  );
});

test("Intégration JSDOM : timeout si des tests asynchrones ne répondent pas", async () => {
  const html = `<!doctype html><html><head></head><body></body></html>`;
  const testsHanging = "await new Promise(() => {});";
  const codeAssemble = injecterTests(html, testsHanging);
  const codeRapide = codeAssemble.replace(/4000/g, "50");

  let messageRecu = null;
  const dom = new JSDOM(codeRapide, {
    runScripts: "dangerously",
    beforeParse(window) {
      window.parent = {
        postMessage(data) {
          messageRecu = data;
        },
      };
    },
  });

  await new Promise((resolve) => {
    const debut = Date.now();
    const interval = setInterval(() => {
      if (messageRecu || Date.now() - debut > 2000) {
        clearInterval(interval);
        resolve();
      }
    }, 10);
  });

  dom.window.close();

  assert.ok(messageRecu, "Un message a été posté au parent");
  assert.equal(messageRecu.type, "tests");
  assert.equal(messageRecu.resultats.length, 1);
  assert.equal(messageRecu.resultats[0].ok, false);
  assert.equal(
    messageRecu.resultats[0].message,
    MESSAGE_BOUCLE_TROP_LONGUE,
  );
});
