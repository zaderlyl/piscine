// Vérifie les réponses d'un exo de schéma.
// schema : résultat de lireSchema(). choix : tableau des valeurs choisies, dans l'ordre des trous.
// Renvoie { reussi, resultats: [{ ok, message }] }, un résultat par trou.

// Message court qui dit quoi faire, selon la rangée où se trouve le trou.
const CONSEILS = {
  colonnes: "Regarde les valeurs de cette colonne : quel nom les décrit le mieux ?",
  types: "Regarde les valeurs : ce sont des nombres, du texte ou des dates ?",
  cles: "Quelle colonne identifie chaque ligne de façon unique ?",
  clés: "Quelle colonne identifie chaque ligne de façon unique ?",
};
const CONSEIL_PAR_DEFAUT = "Relis l'énoncé et choisis une autre réponse.";

export function verifierSchema(schema, choix) {
  const resultats = [];
  let index = 0;

  for (const entete of schema.entetes) {
    for (const c of entete.cases) {
      if (c.type !== "trou") continue;
      const valeur = choix[index] ?? "";
      index++;

      if (!valeur) {
        resultats.push({ ok: false, message: "Choisis une réponse." });
      } else if (valeur === c.reponse) {
        resultats.push({ ok: true, message: "" });
      } else {
        resultats.push({ ok: false, message: CONSEILS[entete.nom] || CONSEIL_PAR_DEFAUT });
      }
    }
  }

  return { reussi: resultats.every((r) => r.ok), resultats };
}
