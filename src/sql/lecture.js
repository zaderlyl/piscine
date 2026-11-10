// Lecture des sections d'un exo de requêtes SQL.
//
// Format :
//   ## Base
//   ```sql
//   CREATE TABLE eleves (id INTEGER, nom TEXT);
//   INSERT INTO eleves VALUES (1, 'Alice');
//   ```
//   ## Solutions
//   ```sql
//   SELECT nom FROM eleves;
//   ```
//   ```sql
//   SELECT eleves.nom FROM eleves;
//   ```
//
// - « Base » : le script exécuté pour créer la base de départ (un seul bloc).
// - « Solutions » : une requête acceptée par bloc de code. La requête de l'élève passe
//   si elle ressemble à l'une d'elles (voir verification.js).
// Une erreur claire est levée si une section manque ou est vide.

function lireBlocs(section) {
  return [...(section || "").matchAll(/```(?:\w+)?\n([\s\S]*?)```/g)]
    .map((m) => m[1].trim())
    .filter(Boolean);
}

export function lireSql(exo) {
  const bases = lireBlocs(exo["Base"]);
  if (bases.length === 0) throw new Error("La section « Base » n'a pas de bloc de code.");
  if (bases.length > 1) throw new Error("La section « Base » doit avoir un seul bloc de code.");

  const solutions = lireBlocs(exo["Solutions"]);
  if (solutions.length === 0) {
    throw new Error("La section « Solutions » n'a aucun bloc de code.");
  }

  return { base: bases[0], solutions };
}
