// Vérifie que les exos sont bien formés, avant fusion (README §11).
// Usage : node scripts/valider-exos.js [dossier]   (par défaut : exos/)
//
// Deux façons de valider un exo, selon son module :
// - exos/git/visuel : pas de section « Tests ». On joue la solution dans le moteur
//   Git et on vérifie que toutes les étapes (## Étapes) se cochent dans l'ordre.
// - les autres modules (HTML, PHP) : section « Tests » obligatoire. Les tests sont joués
//   sur la solution HTML dans un DOM (jsdom). Une solution PHP n'est pas exécutée
//   (il faut un interpréteur PHP) : le script l'signale par un avertissement.
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import * as moteur from "../src/depot/moteur.js";
const { nouveauDepot, executerScript, condition } = moteur;
// Les étapes Git ne se vérifient que si le moteur les connaît (fonctions de la PR #37)
const ETAPES_DISPONIBLES = typeof condition === "function" && typeof executerScript === "function";

const RACINE = process.argv[2] ?? fileURLToPath(new URL("../exos", import.meta.url));
const CHAMPS_OBLIGATOIRES = ["type", "titre", "annee", "ptp", "notions", "panneaux"];
const TYPES = ["intro", "classique", "palier", "projet"];
const VALEURS_PTP = ["oui", "non", "simple", "riche"];

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
  const dom = new JSDOM(solution, { runScripts: "outside-only", pretendToBeVisual: true });
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
  if (!solution) {
    // Seule une solution HTML se joue dans jsdom ; PHP demande un interpréteur PHP
    avertissements.push(`tests non exécutés : ${solutions.map((s) => s.titre).join(", ")} (il faut PHP sur la machine)`);
    return { erreurs, avertissements };
  }
  const bloc = blocDeCode(solution);
  if (!bloc) {
    erreurs.push({ section: solution ? solution.titre : "Solution", ligne: solution ? solution.ligne : 1, message: "aucun bloc de code dans la solution" });
    return { erreurs, avertissements };
  }
  let resultats;
  try {
    resultats = await jouerTestsHtml(bloc.code, codeTests.code);
  } catch (erreur) {
    erreurs.push({ section: "Tests", ligne: codeTests.ligne, message: `les tests n'ont pas pu tourner : ${erreur.message}` });
    return { erreurs, avertissements };
  }
  for (const r of resultats) {
    if (!r.ok) erreurs.push({ section: "Tests", ligne: codeTests.ligne, message: `test échoué sur la solution : ${r.message}` });
  }
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
  const erreurs = verifierFront(front);
  const avertissements = [];

  if (front.valeurs.type === "cours") return { cours: true, erreurs: [], avertissements };

  const module = relative(RACINE, chemin).split(sep).slice(0, -1).join("/");
  if (module === "git/visuel") {
    if (ETAPES_DISPONIBLES) erreurs.push(...verifierEtapes(sections, front.valeurs.depot === "aucun"));
    else avertissements.push("étapes non vérifiées : le moteur Git de cette branche ne les connaît pas (voir PR #37)");
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
  if (r.cours) {
    cours++;
    continue;
  }
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

console.log(`\n${valides} exo(s) valide(s), ${enErreur} en erreur, ${cours} cours ignoré(s), ${avertissements} avertissement(s).`);
process.exitCode = enErreur > 0 ? 1 : 0;
