// Vérifie la requête SQL d'un élève, de quatre façons (champ `verification:` de l'exo) :
// - « texte » : on compare son texte aux solutions acceptées. Les différences de présentation
//   sont ignorées : majuscules/minuscules (hors texte entre guillemets), espaces (y compris autour
//   de `=`, `<`, `>`, `<=`, `>=`, `<>`, `!=`), retours à la ligne, commentaires `--` et `;` final.
// - « resultat » : on compare le tableau obtenu à celui d'une solution.
// - « etat » : pour les requêtes d'écriture, on compare le contenu des tables après la requête ;
// - « structure » : pour les requêtes qui créent des tables, on compare la structure obtenue
//   (tables, colonnes, types, clé primaire, clés étrangères). NOT NULL n'est pas comparé.

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

// Mode « structure » : on compare la structure des tables (liste { nom, colonnes, etrangeres }, voir moteur.js).
// Les noms et les types sont comparés sans tenir compte de la casse ; l'ordre des colonnes compte
// (l'énoncé l'impose), celui des clés étrangères non.
export function comparerStructures(attendu, obtenu) {
  const bas = (s) => String(s).toLowerCase();
  const nomsAttendus = attendu.map((t) => bas(t.nom));
  const nomsObtenus = obtenu.map((t) => bas(t.nom));
  const manquante = attendu.find((t) => !nomsObtenus.includes(bas(t.nom)));
  if (manquante) return { reussi: false, message: `Il manque la table ${manquante.nom}. Relis l'énoncé.` };
  const enTrop = obtenu.find((t) => !nomsAttendus.includes(bas(t.nom)));
  if (enTrop) return { reussi: false, message: `La table ${enTrop.nom} n'est pas demandée. Relis l'énoncé.` };
  for (const a of attendu) {
    const o = obtenu.find((t) => bas(t.nom) === bas(a.nom));
    if (a.colonnes.map((c) => bas(c.nom)).join("|") !== o.colonnes.map((c) => bas(c.nom)).join("|")) {
      return { reussi: false, message: `Les colonnes de la table ${a.nom} ne sont pas celles attendues (noms ou ordre).` };
    }
    for (let i = 0; i < a.colonnes.length; i++) {
      if (bas(a.colonnes[i].type) !== bas(o.colonnes[i].type)) {
        return { reussi: false, message: `La colonne ${a.colonnes[i].nom} de la table ${a.nom} n'a pas le bon type.` };
      }
    }
    const cle = (t) => t.colonnes.filter((c) => c.cle > 0).sort((x, y) => x.cle - y.cle).map((c) => bas(c.nom)).join(",");
    if (cle(a) !== cle(o)) {
      return { reussi: false, message: `La clé primaire de la table ${a.nom} n'est pas celle attendue.` };
    }
    const etrangeres = (t) => t.etrangeres.map((f) => bas(`${f.de}>${f.table}.${f.vers}`)).sort().join("|");
    if (etrangeres(a) !== etrangeres(o)) {
      return { reussi: false, message: `Les clés étrangères de la table ${a.nom} ne sont pas celles attendues.` };
    }
  }
  return { reussi: true, message: "Réussi : tes tables ont la structure attendue." };
}

// Mode « structure » complet : exécute la requête de l'élève et les solutions sur la même base,
// puis compare la structure des tables. Accepté si elle est identique à celle d'une solution.
export function verifierStructure({ SQL, base, requete, solutions }) {
  if (!normaliserRequete(requete)) return { reussi: false, message: "Écris une requête avant de vérifier." };
  const eleve = executerRequete(SQL, base, requete);
  if (eleve.erreur) return { reussi: false, message: "Ta requête a une erreur : " + eleve.erreur };
  let premier = null;
  for (const solution of solutions) {
    const attendu = executerRequete(SQL, base, solution);
    if (attendu.erreur) continue;
    const r = comparerStructures(attendu.structure, eleve.structure);
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
