import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import {
  lireProgression,
  marquerReussi,
  estReussi,
  exoSuivant,
  construireExport,
  validerDonneesProgression,
  fusionnerProgression,
  normaliserDonnees,
} from "./progression.js";

function creerStockageMock(initial = {}) {
  const table = new Map(
    Object.entries(initial).map(([k, v]) => [
      k,
      typeof v === "string" ? v : JSON.stringify(v),
    ]),
  );
  return {
    getItem: (k) => (table.has(k) ? table.get(k) : null),
    setItem: (k, v) => table.set(k, String(v)),
    removeItem: (k) => table.delete(k),
    clear: () => table.clear(),
    key: (i) => Array.from(table.keys())[i] ?? null,
    get length() {
      return table.size;
    },
  };
}

test("lireProgression et marquerReussi", () => {
  const stockage = creerStockageMock();
  assert.deepEqual(lireProgression(stockage), {});
  assert.equal(estReussi("html/vanilla/04", stockage), false);

  marquerReussi("html/vanilla/04", stockage);
  assert.equal(estReussi("html/vanilla/04", stockage), true);

  const prog = lireProgression(stockage);
  assert.equal(prog["html/vanilla/04"].reussi, true);
  assert.ok(prog["html/vanilla/04"].date);
});

test("exoSuivant", () => {
  const liste = ["exo1", "exo2", "exo3"];
  assert.equal(exoSuivant("exo1", liste), "exo2");
  assert.equal(exoSuivant("exo2", liste), "exo3");
  assert.equal(exoSuivant("exo3", liste), null);
  assert.equal(exoSuivant("inconnu", liste), null);
});

test("construireExport : inclut la progression, les brouillons et emmet", () => {
  const stockage = creerStockageMock({
    "piscine-progression": { "html/vanilla/00": { reussi: true, date: "2026-01-01" } },
    "piscine-brouillon:html/vanilla/00": { "index.html": "<h1>Test</h1>" },
    "piscine-emmet": ["!", "h1"],
  });

  const exportDonnees = construireExport(stockage);
  assert.equal(exportDonnees.version, 1);
  assert.ok(exportDonnees.dateExport);
  assert.deepEqual(exportDonnees.progression, {
    "html/vanilla/00": { reussi: true, date: "2026-01-01" },
  });
  assert.deepEqual(exportDonnees.brouillons, {
    "html/vanilla/00": { "index.html": "<h1>Test</h1>" },
  });
  assert.deepEqual(exportDonnees.emmet, ["!", "h1"]);
});

test("validerDonneesProgression : valide les formats acceptés et rejette les invalides", () => {
  assert.doesNotThrow(() => validerDonneesProgression({ progression: {} }));
  assert.doesNotThrow(() => validerDonneesProgression(["html/vanilla/00"]));
  assert.doesNotThrow(() =>
    validerDonneesProgression({ "html/vanilla/00": { reussi: true } }),
  );

  assert.throws(() => validerDonneesProgression(null));
  assert.throws(() => validerDonneesProgression("chaine"));
  assert.throws(() => validerDonneesProgression({}));
  assert.throws(() => validerDonneesProgression({ autre: 123 }));
});

test("fusionnerProgression : fusionne sans écraser la progression existante", () => {
  const stockage = creerStockageMock({
    "piscine-progression": {
      "html/vanilla/00": { reussi: true, date: "2026-01-01T00:00:00Z" },
    },
    "piscine-brouillon:html/vanilla/00": { "index.html": "Ancien" },
  });

  const exportExterne = {
    version: 1,
    progression: {
      "html/vanilla/00": { reussi: true, date: "2026-01-02T00:00:00Z" },
      "html/vanilla/01": { reussi: true, date: "2026-01-03T00:00:00Z" },
    },
    brouillons: {
      "html/vanilla/01": { "index.html": "Nouveau" },
    },
    emmet: ["p"],
  };

  const resultat = fusionnerProgression(exportExterne, stockage);

  assert.equal(resultat.nbTotalReussis, 2);
  assert.equal(resultat.nbNouveauxExos, 1);
  assert.equal(resultat.nbBrouillons, 1);

  assert.equal(estReussi("html/vanilla/00", stockage), true);
  assert.equal(estReussi("html/vanilla/01", stockage), true);

  assert.deepEqual(JSON.parse(stockage.getItem("piscine-brouillon:html/vanilla/00")), {
    "index.html": "Ancien",
  });
  assert.deepEqual(JSON.parse(stockage.getItem("piscine-brouillon:html/vanilla/01")), {
    "index.html": "Nouveau",
  });
});

test("fusionnerProgression : accepte un tableau d'identifiants d'exercices", () => {
  const stockage = creerStockageMock();
  const liste = ["html/vanilla/00", "html/vanilla/01"];

  const res = fusionnerProgression(liste, stockage);
  assert.equal(res.nbTotalReussis, 2);
  assert.equal(res.nbNouveauxExos, 2);
  assert.equal(estReussi("html/vanilla/00", stockage), true);
  assert.equal(estReussi("html/vanilla/01", stockage), true);
});

test("Intégration DOM : le vrai index.html contient les éléments d'export et d'import", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const doc = new JSDOM(html).window.document;
  assert.ok(doc.querySelector("#barre-progression #btn-exporter"));
  assert.ok(doc.querySelector("#barre-progression #btn-importer"));
  const input = doc.querySelector("#barre-progression #input-importer[type=file]");
  assert.ok(input);
  assert.match(input.getAttribute("accept"), /json/);
  assert.ok(doc.querySelector("#barre-progression #msg-progression"));
});

test("fusionnerProgression : un brouillon local existant n'est jamais écrasé", () => {
  const stockage = creerStockageMock({
    "piscine-brouillon:html/vanilla/04": { "index.html": "MON TRAVAIL EN COURS" },
  });
  const res = fusionnerProgression(
    {
      progression: {},
      brouillons: {
        "html/vanilla/04": { "index.html": "vieux brouillon importé" },
        "html/vanilla/05": { "index.html": "nouveau" },
      },
    },
    stockage,
  );
  assert.deepEqual(JSON.parse(stockage.getItem("piscine-brouillon:html/vanilla/04")), {
    "index.html": "MON TRAVAIL EN COURS",
  });
  assert.deepEqual(JSON.parse(stockage.getItem("piscine-brouillon:html/vanilla/05")), {
    "index.html": "nouveau",
  });
  assert.equal(res.nbBrouillons, 1);
  assert.equal(res.nbBrouillonsConserves, 1);
});

test("fusionnerProgression : conserve la date d'un exercice déjà validé", () => {
  const stockage = creerStockageMock({
    "piscine-progression": { "html/vanilla/00": { reussi: true, date: "2026-01-01T00:00:00Z" } },
  });
  fusionnerProgression({ progression: { "html/vanilla/00": { reussi: true, date: "2026-05-05T00:00:00Z" } } }, stockage);
  assert.equal(lireProgression(stockage)["html/vanilla/00"].date, "2026-01-01T00:00:00Z");
});

test("normaliserDonnees : ignore les entrées mal formées", () => {
  const r = normaliserDonnees({
    version: 1,
    progression: {
      "html/vanilla/00": { reussi: true, date: "pas une date" },
      "../../n/importe/quoi": { reussi: true },
      "__proto__": { reussi: true },
      "html/vanilla/01": { reussi: "oui" },
      "html/vanilla/02": 123,
    },
    brouillons: {
      "html/vanilla/00": { "index.html": "ok", "../evil.js": "x", "n.html": 42 },
      "x": [1, 2],
      "html/vanilla/09": { "a.html": 42 },
    },
    emmet: ["p", "h1", { a: 1 }, 42, null, "<script>"],
  });
  assert.deepEqual(Object.keys(r.progression), ["html/vanilla/00"]);
  assert.equal(r.progression["html/vanilla/00"].date, null);
  assert.deepEqual(r.brouillons, { "html/vanilla/00": { "index.html": "ok" } });
  assert.deepEqual(r.emmet, ["p", "h1"]);
});

test("validerDonneesProgression : rejette les formats trompeurs", () => {
  assert.throws(() => validerDonneesProgression({ "a/b": 123 }));
  assert.throws(() => validerDonneesProgression({ progression: [] }));
  assert.throws(() => validerDonneesProgression([1, {}, null]));
  assert.throws(() => validerDonneesProgression({ version: 999, progression: {} }), /plus récente/);
  assert.doesNotThrow(() => validerDonneesProgression({ progression: {} }));
});

test("fusionnerProgression : stockage plein → erreur claire et aucune modification", () => {
  const stockage = creerStockageMock({
    "piscine-progression": { "html/vanilla/00": { reussi: true, date: "2026-01-01T00:00:00Z" } },
  });
  const original = stockage.setItem;
  let appels = 0;
  stockage.setItem = (k, v) => {
    if (++appels === 2) throw new DOMException("quota", "QuotaExceededError");
    return original(k, v);
  };
  assert.throws(
    () =>
      fusionnerProgression(
        {
          progression: { "html/vanilla/01": { reussi: true } },
          brouillons: { "html/vanilla/01": { "index.html": "x" } },
        },
        stockage,
      ),
    /Rien n'a été modifié/,
  );
  stockage.setItem = original;
  assert.equal(estReussi("html/vanilla/01", stockage), false);
  assert.equal(stockage.getItem("piscine-brouillon:html/vanilla/01"), null);
});

test("fusionnerProgression : clé __proto__ ignorée, compteurs cohérents", () => {
  const stockage = creerStockageMock();
  const res = fusionnerProgression(
    JSON.parse('{"progression":{"__proto__":{"reussi":true},"html/vanilla/00":{"reussi":true}}}'),
    stockage,
  );
  assert.equal(res.nbNouveauxExos, 1);
  assert.equal(res.nbTotalReussis, 1);
});
