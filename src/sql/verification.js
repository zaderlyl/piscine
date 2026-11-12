// Vérifie la requête SQL d'un élève, de trois façons (champ `verification:` de l'exo) :
// - « texte » : on compare son texte aux solutions acceptées. Les différences de présentation
//   sont ignorées : majuscules/minuscules (hors texte entre guillemets), espaces (y compris autour
//   de `=`, `<`, `>`, `<=`, `>=`, `<>`, `!=`), retours à la ligne, commentaires `--` et `;` final.
// - « resultat » : on compare le tableau obtenu à celui d'une solution.
// - « etat » : pour les requêtes d'écriture, on compare le contenu des tables après la requête.

import { executerRequete } from "./moteur.js";

// Découpe en morceaux : texte entre guillemets, commentaire, ou le reste.
const MORCEAUX = /'(?:[^']|'')*'|"[^"]*"|--[^\n]*|[^'"-]+|-/g;

export function normaliserRequete(requete) {
  let texte = "";
  for (const m of (requete || "").matchAll(MORCEAUX)) {
    const morceau = m[0];
    if (morceau.startsWith("--")) continue;
    // hors guillemets : minuscules, et pas d'espace autour des opérateurs de comparaison
    texte +=
      morceau[0] === "'" || morceau[0] === '"'
        ? morceau
        : morceau.toLowerCase().replace(/\s*(<=|>=|<>|!=|=|<|>)\s*/g, "$1");
  }
  return texte
    .replace(/\s+/g, " ")
    .replace(/ ?([,()]) ?/g, "$1")
    .replace(/[\s;]+$/, "")
    .trim();
}

// Mode « resultat » : on compare le tableau obtenu à celui d'une solution.
// attendu et obtenu : { colonnes, lignes }. Si `ordonne` est faux, l'ordre des lignes est ignoré.
export function comparerResultats(attendu, obtenu, ordonne = false) {
  const colonnes = (r) => r.colonnes.map((c) => String(c).toLowerCase());
  if (colonnes(attendu).join("|") !== colonnes(obtenu).join("|")) {
    return { reussi: false, message: "Les colonnes de ton résultat ne sont pas celles attendues. Relis l'énoncé." };
  }
  if (attendu.lignes.length !== obtenu.lignes.length) {
    const n = attendu.lignes.length;
    return {
      reussi: false,
      message: `Ton résultat a ${obtenu.lignes.length} ligne(s), il en faut ${n}. Relis l'énoncé.`,
    };
  }
  const texte = (lignes) => lignes.map((l) => JSON.stringify(l));
  const a = texte(attendu.lignes);
  const o = texte(obtenu.lignes);
  if (!ordonne) {
    a.sort();
    o.sort();
  }
  if (a.some((ligne, i) => ligne !== o[i])) {
    return {
      reussi: false,
      message: ordonne
        ? "Les lignes de ton résultat ne sont pas celles attendues, ou pas dans le bon ordre."
        : "Les lignes de ton résultat ne sont pas celles attendues.",
    };
  }
  return { reussi: true, message: "Réussi : ton résultat est correct." };
}

// Mode « resultat » complet : exécute la requête de l'élève et les solutions sur la même base.
// Le résultat est accepté s'il est identique à celui d'une solution ; l'ordre des lignes compte
// seulement si cette solution contient un `ORDER BY`.
export function verifierResultat({ SQL, base, requete, solutions }) {
  if (!normaliserRequete(requete)) return { reussi: false, message: "Écris une requête avant de vérifier." };
  const eleve = executerRequete(SQL, base, requete);
  if (eleve.erreur) return { reussi: false, message: "Ta requête a une erreur : " + eleve.erreur };
  let premier = null;
  for (const solution of solutions) {
    const attendu = executerRequete(SQL, base, solution);
    if (attendu.erreur) continue;
    const r = comparerResultats(attendu, eleve, /\border\s+by\b/i.test(solution));
    if (r.reussi) return r;
    premier = premier || r;
  }
  return premier || { reussi: false, message: "Aucune solution n'a pu être exécutée." };
}

// Mode « etat » : on compare le contenu des tables (liste { nom, colonnes, lignes }) après la requête.
// L'ordre des lignes est ignoré : une table n'a pas d'ordre.
export function comparerEtats(attendu, obtenu) {
  const noms = (tables) => tables.map((t) => t.nom.toLowerCase()).join("|");
  if (noms(attendu) !== noms(obtenu)) {
    return { reussi: false, message: "Les tables ne sont pas celles attendues. Relis l'énoncé." };
  }
  for (let i = 0; i < attendu.length; i++) {
    const a = attendu[i];
    const o = obtenu[i];
    if (a.colonnes.join("|").toLowerCase() !== o.colonnes.join("|").toLowerCase()) {
      return { reussi: false, message: `Les colonnes de la table ${a.nom} ne sont pas celles attendues.` };
    }
    if (a.lignes.length !== o.lignes.length) {
      return {
        reussi: false,
        message: `La table ${a.nom} a ${o.lignes.length} ligne(s), il en faut ${a.lignes.length}. Relis l'énoncé.`,
      };
    }
    const texte = (lignes) => lignes.map((l) => JSON.stringify(l)).sort();
    const ta = texte(a.lignes);
    const to = texte(o.lignes);
    if (ta.some((ligne, j) => ligne !== to[j])) {
      return { reussi: false, message: `Le contenu de la table ${a.nom} n'est pas celui attendu. Relis l'énoncé.` };
    }
  }
  return { reussi: true, message: "Réussi : tes tables sont dans l'état attendu." };
}

// Mode « etat » complet : exécute la requête de l'élève et les solutions sur la même base,
// puis compare le contenu des tables. Accepté s'il est identique à celui d'une solution.
export function verifierEtat({ SQL, base, requete, solutions }) {
  if (!normaliserRequete(requete)) return { reussi: false, message: "Écris une requête avant de vérifier." };
  const eleve = executerRequete(SQL, base, requete);
  if (eleve.erreur) return { reussi: false, message: "Ta requête a une erreur : " + eleve.erreur };
  let premier = null;
  for (const solution of solutions) {
    const attendu = executerRequete(SQL, base, solution);
    if (attendu.erreur) continue;
    const r = comparerEtats(attendu.tables, eleve.tables);
    if (r.reussi) return r;
    premier = premier || r;
  }
  return premier || { reussi: false, message: "Aucune solution n'a pu être exécutée." };
}

// solutions : tableau de requêtes acceptées. Renvoie { reussi, message }.
export function verifierRequete(requete, solutions) {
  const eleve = normaliserRequete(requete);
  if (!eleve) return { reussi: false, message: "Écris une requête avant de vérifier." };
  const juste = solutions.some((s) => normaliserRequete(s) === eleve);
  return juste
    ? { reussi: true, message: "Réussi : ta requête est correcte." }
    : { reussi: false, message: "Ta requête ne correspond à aucune solution attendue. Relis l'énoncé et réessaie." };
}
