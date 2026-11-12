// Détermine le type de données JavaScript d'une valeur.
// Fonction autonome (sans dépendance) : elle est aussi injectée telle quelle
// dans l'aperçu via toString(), pour qu'il n'y ait qu'une seule version.
export function determinerType(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}
