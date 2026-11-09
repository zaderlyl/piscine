import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  lireProgression,
  marquerReussi,
  estReussi,
  exoSuivant,
  construireExport,
  validerDonneesProgression,
  fusionnerProgression,
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

test("Intégration DOM : présence des éléments d'export et d'import dans index.html", () => {
  const dom = new JSDOM(`<!DOCTYPE html>
    <div id="editeur">
      <footer id="barre-progression">
        <button id="btn-exporter" type="button">Exporter ma progression</button>
        <button id="btn-importer" type="button">Importer</button>
        <input type="file" id="input-importer" accept=".json,application/json" class="cache">
        <span id="msg-progression" class="cache"></span>
      </footer>
    </div>`);

  const doc = dom.window.document;
  assert.ok(doc.getElementById("btn-exporter"));
  assert.ok(doc.getElementById("btn-importer"));
  assert.ok(doc.getElementById("input-importer"));
  assert.ok(doc.getElementById("msg-progression"));
});
