import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  protegerBoucles,
  GARDE_BOUCLE_CODE,
  creerGardeCode,
  scriptEstJavaScript,
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
  const codeGardeCourt = creerGardeCode(50);
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

// --- Corps sans accolades, if/else, templates ---

function compile(code) {
  // Lève SyntaxError si le code protégé n'est plus du JavaScript valide
  return new Function("async function __asyncWrap(){}; " + code);
}

test("protegerBoucles : while/for sans accolades avec if/else reste du JS valide", () => {
  for (const code of [
    "let a=0; while (a<3) if (a%2) a++; else a+=2;",
    "let s=0; for (let i=0;i<3;i++) if (i) s++; else s--;",
    "let a=0; while (a<3) if (a) a++; else if (a===0) a+=2; else a--;",
    "let a=0; while (a<3) try { a++; } catch (e) {} finally { a++; }",
  ]) {
    const protege = protegerBoucles(code);
    assert.doesNotThrow(() => compile(protege), protege);
    assert.match(protege, /__verifierBoucle\(\d+\)/);
  }
});

test("protegerBoucles : une boucle dans un corps sans accolades est aussi protégée", () => {
  const protege = protegerBoucles("for (let i=0;i<2;i++) for (let j=0;j<2;j++) n++;");
  assert.equal((protege.match(/__verifierBoucle\(/g) || []).length, 2);
  const ids = [...protege.matchAll(/__verifierBoucle\((\d+)\)/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, 2, "chaque boucle a un identifiant distinct");
  assert.doesNotThrow(() => compile(protege));
});

test("protegerBoucles : do...while sans accolades et imbriqué", () => {
  const protege = protegerBoucles("let x=0; do x++; while (x<3); do { do { x++ } while (x<9) } while (x<12);");
  assert.doesNotThrow(() => compile(protege), protege);
  assert.equal((protege.match(/__verifierBoucle\(/g) || []).length, 3);
});

test("protegerBoucles : protège une boucle écrite dans un ${...} de template", () => {
  const protege = protegerBoucles("const t = `a ${(() => { while (true) {} })()} b`;");
  assert.match(protege, /while \(true\) \{ __verifierBoucle\(\d+\);/);
  assert.doesNotThrow(() => compile(protege));
  assert.ok(protege.startsWith("const t = `a ${"));
  assert.ok(protege.endsWith(" b`;"));
});

test("protegerBoucles : le code protégé garde le même comportement", () => {
  const code = "let s = 0; for (let i = 0; i < 5; i++) if (i % 2) s += i; else s -= 1; return s;";
  const garde = creerGardeCode(5000);
  const direct = new Function(code)();
  const protege = new Function("window", garde + ";" + protegerBoucles(code))({});
  assert.equal(protege, direct);
});

// --- Garde : try/catch, corps lent, attente asynchrone ---

test("garde : un try/catch autour d'une boucle ne peut plus la relancer après le délai", () => {
  const win = {};
  new Function("window", creerGardeCode(30))(win);
  const code = protegerBoucles("let tours = 0; while (true) { try { while (true) {} } catch (e) { tours++; } }");
  const debut = Date.now();
  assert.throws(
    () => new Function("window", "const __verifierBoucle = window.__verifierBoucle; " + code)(win),
    (err) => err.garde === true,
  );
  assert.ok(Date.now() - debut < 2000, "la boucle externe est aussi interrompue");
});

test("garde : une boucle dont le corps est lent est quand même interrompue", () => {
  const win = {};
  new Function("window", creerGardeCode(100))(win);
  const debut = Date.now();
  assert.throws(
    () => {
      for (;;) {
        win.__verifierBoucle(3);
        const t = performance.now();
        while (performance.now() - t < 5); // 5 ms par itération
      }
    },
    (err) => err.garde === true,
  );
  assert.ok(Date.now() - debut < 1500);
});

test("garde : une boucle qui attend vraiment (await) n'est pas coupée", async () => {
  globalThis.window = {};
  new Function("window", creerGardeCode(50))(globalThis.window);
  const verifier = globalThis.window.__verifierBoucle;
  for (let i = 0; i < 40; i++) {
    verifier(9);
    await new Promise((r) => setTimeout(r, 5)); // ~200 ms au total > délai de 50 ms
  }
  delete globalThis.window;
});

// --- Page complète ---

function lancerPage(htmlEleve, tests, delaiGarde = 50) {
  const html = injecterTests(htmlEleve, tests).replace(/3000/g, String(delaiGarde));
  return new Promise((resolve) => {
    let message = null;
    const dom = new JSDOM(html, {
      runScripts: "dangerously",
      beforeParse(window) {
        window.parent = { postMessage: (d) => (message = d) };
      },
    });
    const debut = Date.now();
    const t = setInterval(() => {
      if (message || Date.now() - debut > 2500) {
        clearInterval(t);
        dom.window.close();
        resolve(message);
      }
    }, 10);
  });
}

test("page : une erreur de l'élève qui contient le mot « boucles » n'est pas prise pour une boucle infinie", async () => {
  const msg = await lancerPage(
    '<!doctype html><html><head><script>throw new Error("mes boucles sont cassées");</script></head><body></body></html>',
    "assert(true, 'ok');",
  );
  assert.ok(msg);
  assert.equal(msg.resultats.length, 1);
  assert.equal(msg.resultats[0].ok, true);
  assert.notEqual(msg.resultats[0].message, MESSAGE_BOUCLE_TROP_LONGUE);
});

test("page : boucle infinie avalée par un try/catch de l'élève → échec bienveillant", async () => {
  const eleve = protegerBoucles("while (true) { try { while (true) {} } catch (e) {} }");
  const msg = await lancerPage(
    `<!doctype html><html><head><script>${eleve}</script></head><body></body></html>`,
    "assert(true, 'ok');",
  );
  assert.ok(msg, "un message est posté au parent");
  assert.equal(msg.resultats[0].ok, false);
  assert.equal(msg.resultats[0].message, MESSAGE_BOUCLE_TROP_LONGUE);
});

test("scriptEstJavaScript : seuls les <script> JavaScript sont instrumentés", () => {
  assert.equal(scriptEstJavaScript(""), true);
  assert.equal(scriptEstJavaScript(' defer'), true);
  assert.equal(scriptEstJavaScript(' type="module"'), true);
  assert.equal(scriptEstJavaScript(" type='text/javascript'"), true);
  assert.equal(scriptEstJavaScript(' type="application/json"'), false);
  assert.equal(scriptEstJavaScript(' type="importmap"'), false);
  assert.equal(scriptEstJavaScript(' type="text/template"'), false);
});
