// Vérifie la requête SQL d'un élève en comparant son texte aux solutions acceptées.
// Les différences de présentation sont ignorées : majuscules/minuscules (hors texte entre
// guillemets), espaces, retours à la ligne, commentaires `--` et `;` final.

// Découpe en morceaux : texte entre guillemets, commentaire, ou le reste.
const MORCEAUX = /'(?:[^']|'')*'|"[^"]*"|--[^\n]*|[^'"-]+|-/g;

export function normaliserRequete(requete) {
  let texte = "";
  for (const m of (requete || "").matchAll(MORCEAUX)) {
    const morceau = m[0];
    if (morceau.startsWith("--")) continue;
    texte += morceau[0] === "'" || morceau[0] === '"' ? morceau : morceau.toLowerCase();
  }
  return texte
    .replace(/\s+/g, " ")
    .replace(/ ?([,()]) ?/g, "$1")
    .replace(/[\s;]+$/, "")
    .trim();
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
