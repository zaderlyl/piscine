// Lecture de la section « ## Schéma » d'un exo de schéma de base de données.
//
// Format :
//   table: eleves
//   colonnes: ?[id|nom|age|classe]  ?[id|nom|age|classe]  age
//   lignes:
//   - 1 | Alice | 17
//   - 2 | Bruno | 18
//   reponses: id, nom
//
// - Une ligne « nom: ... » avant « lignes: » est une rangée d'en-tête (colonnes, types, clés...).
//   Chaque élément est un mot fixe, ou un trou `?[choix1|choix2|...]`.
// - « reponses: » donne la bonne réponse de chaque trou, dans l'ordre de lecture.
// Une erreur claire est levée si le schéma est mal écrit.

const ELEMENT = /\?\[([^\]]*)\]|\S+/g;

function lireElements(texte) {
  const cases = [];
  for (const m of texte.matchAll(ELEMENT)) {
    if (m[1] !== undefined) {
      const choix = m[1].split("|").map((c) => c.trim()).filter(Boolean);
      cases.push({ type: "trou", choix, reponse: null });
    } else {
      cases.push({ type: "fixe", texte: m[0] });
    }
  }
  return cases;
}

export function lireSchema(section) {
  const schema = { table: "", entetes: [], lignes: [], trous: 0 };
  let reponses = null;
  let dansLignes = false;

  for (const brut of section.split("\n")) {
    const ligne = brut.trim();
    if (!ligne) continue;

    if (dansLignes && ligne.startsWith("-")) {
      const cellules = ligne.slice(1).split("|").map((c) => c.trim());
      schema.lignes.push(cellules);
      continue;
    }

    const cle = ligne.match(/^([\wéèêàùç ]+?):\s*(.*)$/);
    if (!cle) {
      throw new Error(`Ligne du schéma illisible : « ${ligne} »`);
    }
    const nom = cle[1].trim().toLowerCase();
    const valeur = cle[2];
    dansLignes = false;

    if (nom === "table") {
      schema.table = valeur.trim();
    } else if (nom === "lignes") {
      dansLignes = true;
    } else if (nom === "reponses" || nom === "réponses") {
      reponses = valeur.split(",").map((r) => r.trim()).filter(Boolean);
    } else {
      schema.entetes.push({ nom, cases: lireElements(valeur) });
    }
  }

  const trous = schema.entetes.flatMap((e) => e.cases).filter((c) => c.type === "trou");
  schema.trous = trous.length;

  if (!schema.table) throw new Error("Le schéma n'a pas de ligne « table: ».");
  if (schema.entetes.length === 0) throw new Error("Le schéma n'a aucune rangée d'en-tête.");
  if (reponses === null) throw new Error("Le schéma n'a pas de ligne « reponses: ».");
  if (reponses.length !== trous.length) {
    throw new Error(
      `Le schéma a ${trous.length} trou(s) mais ${reponses.length} réponse(s).`,
    );
  }

  trous.forEach((trou, i) => {
    if (!trou.choix.includes(reponses[i])) {
      throw new Error(
        `La réponse « ${reponses[i]} » du trou ${i + 1} n'est pas dans ses choix (${trou.choix.join(", ")}).`,
      );
    }
    trou.reponse = reponses[i];
  });

  return schema;
}
