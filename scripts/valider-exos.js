// Vérifie que les exos sont bien formés, avant fusion (README §11).
// Usage : node scripts/valider-exos.js [dossier]   (par défaut : exos/)
//
// Quatre façons de valider un exo, selon son module :
// - exos/sql/requetes : on lit « Base » et « Solutions » avec lireSql() et on exécute chaque solution
//   sur la base de départ (il faut le paquet sql.js, sinon avertissement).
// - exos/sql/schema : pas de section « Tests » ni de solution. On lit la section « Schéma »
//   avec lireSchemas() et on vérifie que chaque réponse est dans les choix de son trou.
// - exos/git/visuel : pas de section « Tests ». On joue la solution dans le moteur
//   Git et on vérifie que toutes les étapes (## Étapes) se cochent dans l'ordre.
// - les autres modules (HTML, PHP) : section « Tests » obligatoire. Les tests sont joués
//   sur la solution HTML dans un DOM (jsdom). Une solution PHP n'est pas exécutée
//   (il faut un interpréteur PHP) : le script l'signale par un avertissement.
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { nouveauDepot, executerScript, condition } from "../src/depot/moteur.js";
import { createRequire } from "node:module";
import { lireSchemas } from "../src/schema/lecture.js";
import { lireSql } from "../src/sql/lecture.js";
import { verifierResultat, verifierEtat, verifierStructure } from "../src/sql/verification.js";
import { executerRequete } from "../src/sql/moteur.js";

const RACINE = process.argv[2] ?? fileURLToPath(new URL("../exos", import.meta.url));
const CHAMPS_OBLIGATOIRES = ["type", "titre", "annee", "ptp", "notions", "panneaux"];
const TYPES = ["intro", "classique", "palier", "projet", "cours"];
const CHAMPS_COURS = ["type", "titre", "notions"];
const VALEURS_PTP = ["oui", "non", "simple", "riche"];
const VALEURS_VERIFICATION = ["texte", "resultat", "etat", "structure"];

// Les conditions acceptées par condition() dans src/depot/moteur.js.
// À garder synchronisé avec ce fichier : une condition inconnue ne se coche jamais.
const CONDITIONS_CONNUES = [
  /^commit ".*"$/, /^sans ".*"$/, /^branche \S+$/, /^meme \S+ \S+$/, /^head \S+$/,
  /^index \S+$/, /^travail \S+$/, /^propre$/, /^origine \S+$/, /^suivi \S+$/,
  /^serveur \S+$/, /^fusion$/, /^conflit$/, /^pr ouverte$/, /^pr approuvee$/, /^pr fusionnee$/,
];

// Liste des fichiers .md sous un dossier, triés
function fichiersMarkdown(dossier) {
  const trouves = [];
  for (const entree of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) trouves.push(...fichiersMarkdown(chemin));
    else if (entree.name.endsWith(".md")) trouves.push(chemin);
  }
  return trouves.sort();
}

// Lit le front matter et les sections (## Titre). Garde le numéro de ligne de chaque section.
// Les titres à l'intérieur d'un bloc de code (```) ne comptent pas comme section.
function lireFichier(texte) {
  const lignes = texte.split(/\r?\n/);
  const front = { valeurs: {}, ligne: 1, present: lignes[0] === "---" };
  let i = 1;
  if (front.present) {
    for (; i < lignes.length && lignes[i] !== "---"; i++) {
      const m = lignes[i].match(/^([\w]+):\s*(.*)$/);
      if (m) front.valeurs[m[1]] = m[2].replace(/\s+#.*$/, "").trim();
    }
    i++; // ligne de fermeture
  }

  const sections = [];
  let dansCode = false;
  let courante = null;
  for (let n = i; n < lignes.length; n++) {
    const ligne = lignes[n];
    if (/^\s*```/.test(ligne)) dansCode = !dansCode;
    const titre = !dansCode && ligne.match(/^##\s+(.+?)\s*$/);
    if (titre) {
      courante = { titre: titre[1], ligne: n + 1, corps: [] };
      sections.push(courante);
    } else if (courante) {
      courante.corps.push({ texte: ligne, ligne: n + 1 });
    }
  }
  return { front, sections, lignes };
}

const trouver = (sections, nom) => sections.find((s) => s.titre === nom);
const commencePar = (sections, debut) => sections.find((s) => s.titre.startsWith(debut));

// Lignes de commande d'une section (git, gh, edit, autre-dev), avec leur numéro de ligne
function commandes(section) {
  return (section?.corps ?? [])
    .map((l) => ({ texte: l.texte.trim(), ligne: l.ligne }))
    .filter((l) => /^(git|gh|edit|autre-dev) /.test(l.texte));
}

// Étapes d'une section : « - condition | texte | indice »
function etapesDe(section) {
  return (section?.corps ?? [])
    .map((l) => ({ brut: l.texte.trim(), ligne: l.ligne }))
    .filter((l) => l.brut.startsWith("- "))
    .map((l) => {
      const [condition, texte = "", indice = ""] = l.brut.slice(2).split(" | ").map((s) => s.trim());
      return { condition, texte, indice, ligne: l.ligne };
    });
}

// Vérifie le front matter : champs obligatoires et valeurs connues
function verifierFront(front) {
  const erreurs = [];
  if (!front.present) {
    erreurs.push({ section: "Front matter", ligne: 1, message: "le fichier doit commencer par une ligne « --- »" });
    return erreurs;
  }
  for (const champ of CHAMPS_OBLIGATOIRES) {
    if (!(champ in front.valeurs)) {
      erreurs.push({ section: "Front matter", ligne: front.ligne, message: `champ « ${champ} » manquant` });
    }
  }
  if (front.valeurs.type && !TYPES.includes(front.valeurs.type)) {
    erreurs.push({ section: "Front matter", ligne: front.ligne, message: `type « ${front.valeurs.type} » inconnu (attendu : ${TYPES.join(", ")})` });
  }
  if (front.valeurs.ptp && !VALEURS_PTP.includes(front.valeurs.ptp)) {
    erreurs.push({ section: "Front matter", ligne: front.ligne, message: `ptp « ${front.valeurs.ptp} » inconnu (attendu : ${VALEURS_PTP.join(", ")})` });
  }
  if (front.valeurs.verification && !VALEURS_VERIFICATION.includes(front.valeurs.verification)) {
    erreurs.push({ section: "Front matter", ligne: front.ligne, message: `verification « ${front.valeurs.verification} » inconnue (attendu : ${VALEURS_VERIFICATION.join(", ")})` });
  }
  return erreurs;
}

// Un cours seul n'a qu'une section « Cours » : ni énoncé, ni méthode, ni indice, ni solution
function verifierCours(front, sections) {
  const erreurs = [];
  if (!front.present) {
    erreurs.push({ section: "Front matter", ligne: 1, message: "le fichier doit commencer par une ligne « --- »" });
    return erreurs;
  }
  for (const champ of CHAMPS_COURS) {
    if (!(champ in front.valeurs)) {
      erreurs.push({ section: "Front matter", ligne: front.ligne, message: `champ « ${champ} » manquant` });
    }
  }
  for (const s of sections) {
    if (s.titre !== "Cours") {
      erreurs.push({ section: s.titre, ligne: s.ligne, message: "un cours ne contient que la section « Cours » (pas d'énoncé, de méthode, d'indice ni de solution)" });
    }
  }
  const cours = trouver(sections, "Cours");
  if (!cours) {
    erreurs.push({ section: "Cours", ligne: front.ligne, message: "section « Cours » manquante" });
  } else if (!cours.corps.some((l) => l.texte.trim())) {
    erreurs.push({ section: "Cours", ligne: cours.ligne, message: "section « Cours » vide" });
  }
  return erreurs;
}

// Contenu du premier bloc de code d'une section, avec la ligne de son premier contenu
function blocDeCode(section) {
  if (!section) return null;
  const debut = section.corps.findIndex((l) => /^\s*```/.test(l.texte));
  if (debut === -1) return null;
  const fin = section.corps.findIndex((l, i) => i > debut && /^\s*```\s*$/.test(l.texte));
  if (fin === -1) return null;
  const lignes = section.corps.slice(debut + 1, fin);
  return { code: lignes.map((l) => l.texte).join("\n"), ligne: section.corps[debut].ligne };
}

// Joue les tests d'un exo HTML sur sa solution, dans un DOM (jsdom).
// Même rôle que construireTests() dans src/script.js : $, $$, assert, wait, click, type.
const DELAI_TESTS = 5000; // ms, pour qu'un test qui attend ne bloque pas le script
async function jouerTestsHtml(solution, tests) {
  const dom = new JSDOM(solution, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "http://localhost/",
    beforeParse(window) {
      if (!window.localStorage) {
        const store = new Map();
        window.localStorage = {
          getItem: (k) => (store.has(k) ? store.get(k) : null),
          setItem: (k, v) => store.set(k, String(v)),
          removeItem: (k) => store.delete(k),
          clear: () => store.clear(),
        };
      }
      if (!window.Audio) {
        window.Audio = class Audio {
          play() {
            return Promise.resolve();
          }
        };
      }
      if (!window.IntersectionObserver) {
        window.IntersectionObserver = class IntersectionObserver {
          constructor(callback) {
            this.callback = callback;
          }
          observe() {}
          unobserve() {}
          disconnect() {}
        };
      }
    },
  });
  const fenetre = dom.window;
  const chargement = new Promise((resolve) => fenetre.addEventListener("load", resolve));
  await chargement;
  const script = `(async () => {
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
    return resultats;
  })()`;
  try {
    const delai = new Promise((_, rejet) => setTimeout(() => rejet(new Error("délai dépassé")), DELAI_TESTS));
    return await Promise.race([fenetre.eval(script), delai]);
  } finally {
    fenetre.close();
  }
}

// Règle « tests » : Énoncé, Tests (avec du code), une Solution, et les tests passent sur la solution
async function verifierTests(sections) {
  const erreurs = [];
  const avertissements = [];
  for (const nom of ["Énoncé", "Tests"]) {
    if (!trouver(sections, nom)) erreurs.push({ section: "—", ligne: 1, message: `section « ${nom} » manquante` });
  }
  const tests = trouver(sections, "Tests");
  const codeTests = blocDeCode(tests);
  if (tests && !codeTests) {
    erreurs.push({ section: "Tests", ligne: tests.ligne, message: "aucun bloc de code dans la section" });
  }
  const solutions = sections.filter((s) => s.titre.startsWith("Solution:"));
  if (solutions.length === 0) {
    erreurs.push({ section: "—", ligne: 1, message: "aucune section « Solution: <fichier> »" });
  }
  if (!codeTests || solutions.length === 0) return { erreurs, avertissements };

  const solution = solutions.find((s) => s.titre === "Solution: index.html");
  const solutionJs = solutions.find((s) => s.titre === "Solution: script.js");
  if (!solution && !solutionJs) {
    // Seule une solution HTML ou JS se joue dans jsdom ; PHP demande un interpréteur PHP
    avertissements.push(`tests non exécutés : ${solutions.map((s) => s.titre).join(", ")} (il faut PHP sur la machine)`);
    return { erreurs, avertissements };
  }
  const cibleSolution = solution || solutionJs;
  const bloc = blocDeCode(cibleSolution);
  if (!bloc) {
    erreurs.push({ section: cibleSolution ? cibleSolution.titre : "Solution", ligne: cibleSolution ? cibleSolution.ligne : 1, message: "aucun bloc de code dans la solution" });
    return { erreurs, avertissements };
  }
  let resultats;
  try {
    const htmlDoc = solution
      ? bloc.code
      : `<!DOCTYPE html><html><head><script>window.__code = ${JSON.stringify(bloc.code)};\n${bloc.code}<\/script></head><body></body></html>`;
    resultats = await jouerTestsHtml(htmlDoc, codeTests.code);
  } catch (erreur) {
    erreurs.push({ section: "Tests", ligne: codeTests.ligne, message: `les tests n'ont pas pu tourner : ${erreur.message}` });
    return { erreurs, avertissements };
  }
  for (const r of resultats) {
    if (!r.ok) erreurs.push({ section: "Tests", ligne: codeTests.ligne, message: `test échoué sur la solution : ${r.message}` });
  }
  return { erreurs, avertissements };
}

// Règle « schema » : Énoncé, Schéma lisible (trous, choix et réponses cohérents)
function verifierSchemaSql(sections) {
  const erreurs = [];
  for (const nom of ["Énoncé", "Schéma"]) {
    if (!trouver(sections, nom)) erreurs.push({ section: "—", ligne: 1, message: `section « ${nom} » manquante` });
  }
  const schema = trouver(sections, "Schéma");
  if (schema) {
    try {
      lireSchemas(schema.corps.map((l) => l.texte).join("\n"));
    } catch (erreur) {
      erreurs.push({ section: "Schéma", ligne: schema.ligne, message: erreur.message });
    }
  }
  return erreurs;
}

// Règle « requetes » : Énoncé, Base et Solutions lisibles, chaque solution s'exécute sans erreur.
// En mode `verification: resultat`, une solution doit aussi renvoyer au moins une ligne et être
// acceptée par la vérification (sinon une requête vide passerait). Pour une requête d'écriture
// (mode `etat`, ou exo du dossier sql/ecriture), une solution doit modifier le contenu des tables.
// Pour une requête de création (mode `structure`, ou exo du dossier sql/tables), elle doit modifier la structure.
async function verifierRequetesSql(sections, verification = "texte", ecriture = false, creation = false) {
  const erreurs = [];
  const avertissements = [];
  for (const nom of ["Énoncé", "Base", "Solutions"]) {
    if (!trouver(sections, nom)) erreurs.push({ section: "—", ligne: 1, message: `section « ${nom} » manquante` });
  }
  if (erreurs.length > 0) return { erreurs, avertissements };

  const texte = (nom) => trouver(sections, nom).corps.map((l) => l.texte).join("\n");
  let sql;
  try {
    sql = lireSql({ Base: texte("Base"), Solutions: texte("Solutions") });
  } catch (erreur) {
    erreurs.push({ section: "Base / Solutions", ligne: trouver(sections, "Base").ligne, message: erreur.message });
    return { erreurs, avertissements };
  }

  let SQL;
  try {
    SQL = await createRequire(import.meta.url)("sql.js")();
  } catch {
    avertissements.push("solutions non exécutées (il faut le paquet sql.js)");
    return { erreurs, avertissements };
  }
  sql.solutions.forEach((solution, i) => {
    const r = executerRequete(SQL, sql.base, solution);
    if (r.erreur) {
      erreurs.push({ section: "Solutions", ligne: trouver(sections, "Solutions").ligne, message: `la solution ${i + 1} échoue : ${r.erreur}` });
    } else if (verification === "structure" || creation) {
      const ligne = trouver(sections, "Solutions").ligne;
      const avant = executerRequete(SQL, sql.base, "").structure;
      if (JSON.stringify(r.structure) === JSON.stringify(avant)) {
        erreurs.push({ section: "Solutions", ligne, message: `la solution ${i + 1} ne modifie la structure d'aucune table` });
      } else if (verification === "structure" && !verifierStructure({ SQL, base: sql.base, requete: solution, solutions: sql.solutions }).reussi) {
        erreurs.push({ section: "Solutions", ligne, message: `la solution ${i + 1} n'est pas acceptée par la vérification par la structure des tables` });
      }
    } else if (verification === "etat" || ecriture) {
      const ligne = trouver(sections, "Solutions").ligne;
      const avant = executerRequete(SQL, sql.base, "").tables;
      if (JSON.stringify(r.tables) === JSON.stringify(avant)) {
        erreurs.push({ section: "Solutions", ligne, message: `la solution ${i + 1} ne modifie aucune table` });
      } else if (verification === "etat" && !verifierEtat({ SQL, base: sql.base, requete: solution, solutions: sql.solutions }).reussi) {
        erreurs.push({ section: "Solutions", ligne, message: `la solution ${i + 1} n'est pas acceptée par la vérification par l'état des tables` });
      }
    } else if (verification === "resultat") {
      const ligne = trouver(sections, "Solutions").ligne;
      if (r.lignes.length === 0) {
        erreurs.push({ section: "Solutions", ligne, message: `la solution ${i + 1} ne renvoie aucune ligne (en mode resultat, une requête vide passerait)` });
      } else if (!verifierResultat({ SQL, base: sql.base, requete: solution, solutions: sql.solutions }).reussi) {
        erreurs.push({ section: "Solutions", ligne, message: `la solution ${i + 1} n'est pas acceptée par la vérification par le résultat` });
      }
    }
  });
  return { erreurs, avertissements };
}

// Règle « etapes » : Énoncé, Étapes (format et conditions valides), Solution qui coche toutes les étapes
function verifierEtapes(sections, sansDepot) {
  const erreurs = [];
  for (const nom of ["Énoncé", "Étapes", "Solution"]) {
    if (!trouver(sections, nom)) erreurs.push({ section: "—", ligne: 1, message: `section « ${nom} » manquante` });
  }
  const etapes = etapesDe(trouver(sections, "Étapes"));
  if (trouver(sections, "Étapes") && etapes.length === 0) {
    erreurs.push({ section: "Étapes", ligne: trouver(sections, "Étapes").ligne, message: "aucune étape (« - condition | texte | indice »)" });
  }
  for (const e of etapes) {
    if (!e.texte || !e.indice) {
      erreurs.push({ section: "Étapes", ligne: e.ligne, message: "une étape doit avoir une condition, un texte et un indice, séparés par « | »" });
    }
    if (!CONDITIONS_CONNUES.some((r) => r.test(e.condition))) {
      erreurs.push({ section: "Étapes", ligne: e.ligne, message: `condition « ${e.condition} » inconnue` });
    }
  }
  if (erreurs.length > 0) return erreurs;

  // Jouer le départ puis la solution, en cochant les étapes dans l'ordre comme la page
  const depart = commandes(trouver(sections, "Départ"));
  const solution = commandes(trouver(sections, "Solution"));
  // depot: aucun => pas de dépôt au départ ; seule « git init » est acceptée, comme sur la page
  let depot = sansDepot ? null : nouveauDepot();
  let avancement = 0;
  const avancer = () => {
    while (depot && avancement < etapes.length && condition(depot, etapes[avancement].condition)) avancement++;
  };
  // Joue une commande comme la page ; renvoie false si elle échoue
  const jouer = (c, section) => {
    if (!depot) {
      if (c.texte === "git init") {
        depot = nouveauDepot();
        return true;
      }
      erreurs.push({ section, ligne: c.ligne, message: `« ${c.texte} » : pas de dépôt Git, il faut « git init » d'abord` });
      return false;
    }
    const r = executerScript(depot, c.texte);
    depot = r.depot;
    // Un conflit fait partie de l'exo (exo 05) : ce n'est pas un échec de la solution
    const conflitAttendu = r.sortie.startsWith("CONFLIT");
    if (r.erreur && !conflitAttendu) {
      erreurs.push({ section, ligne: c.ligne, message: `« ${c.texte} » échoue : ${r.sortie.trim()}` });
      return false;
    }
    return true;
  };

  for (const c of depart) {
    if (!jouer(c, "Départ")) return erreurs;
  }
  avancer();

  for (const c of solution) {
    if (!jouer(c, "Solution")) return erreurs;
    avancer();
  }

  if (avancement < etapes.length) {
    const e = etapes[avancement];
    erreurs.push({
      section: "Étapes",
      ligne: e.ligne,
      message: `l'étape « ${e.texte} » n'est pas cochée après la solution (condition « ${e.condition} »)`,
    });
  }
  return erreurs;
}

// Valide un fichier ; renvoie ses erreurs et ses avertissements
async function validerFichier(chemin) {
  const texte = readFileSync(chemin, "utf8");
  const { front, sections } = lireFichier(texte);
  const avertissements = [];

  if (front.valeurs.type === "cours") return { cours: true, erreurs: verifierCours(front, sections), avertissements };
  const erreurs = verifierFront(front);

  const module = relative(RACINE, chemin).split(sep).slice(0, -1).join("/");
  // un exo à trous de sql/tables (panneau « schema ») se valide comme un exo de schéma
  const exoDeSchema = module === "sql/schema" || (module === "sql/tables" && /\bschema\b/.test(front.valeurs.panneaux ?? ""));
  if (exoDeSchema) {
    erreurs.push(...verifierSchemaSql(sections));
  } else if (module === "sql/requetes" || module === "sql/ecriture" || module === "sql/tables") {
    const resultat = await verifierRequetesSql(sections, front.valeurs.verification ?? "texte", module === "sql/ecriture", module === "sql/tables");
    erreurs.push(...resultat.erreurs);
    avertissements.push(...resultat.avertissements);
  } else if (module === "git/visuel") {
    erreurs.push(...verifierEtapes(sections, front.valeurs.depot === "aucun"));
  } else {
    const resultat = await verifierTests(sections);
    erreurs.push(...resultat.erreurs);
    avertissements.push(...resultat.avertissements);
  }
  return { cours: false, erreurs, avertissements };
}

const fichiers = fichiersMarkdown(RACINE);
let valides = 0;
let enErreur = 0;
let cours = 0;
let avertissements = 0;

for (const chemin of fichiers) {
  const rel = relative(process.cwd(), chemin).split(sep).join("/");
  const r = await validerFichier(chemin);
  if (r.cours) cours++;
  for (const a of r.avertissements) {
    avertissements++;
    console.log(`⚠ ${rel} : ${a}`);
  }
  if (r.erreurs.length === 0) {
    valides++;
    continue;
  }
  enErreur++;
  for (const e of r.erreurs) {
    console.log(`✗ ${rel} — section « ${e.section} », ligne ${e.ligne} : ${e.message}`);
  }
}

console.log(`\n${valides} exo(s) valide(s) (dont ${cours} cours), ${enErreur} en erreur, ${avertissements} avertissement(s).`);
process.exitCode = enErreur > 0 ? 1 : 0;
