// Exo projet : la section facultative « ## Squelette » contient les fichiers de départ que l'élève peut
// charger d'un clic. Un bloc de code par fichier, dont l'info donne le langage puis le nom du fichier
// (```html index.html). Voir docs/ecrire-un-exo.md.

// Les trois fichiers de l'éditeur d'un projet
export const FICHIERS_PROJET = ["index.html", "style.css", "script.js"];

// Fichiers du squelette : { "index.html": "...", ... } (objet vide si la section est absente ou sans bloc).
export function lireSquelette(section) {
  const fichiers = {};
  const blocs = (section ?? "").matchAll(/```[\w-]*[ \t]+(\S+)[ \t]*\n([\s\S]*?)```/g);
  for (const [, nom, code] of blocs) fichiers[nom] = code;
  return fichiers;
}

// Liste des problèmes de la section « Squelette » (vide si tout va bien). `section` est le texte de la section,
// ou undefined si elle est absente : elle est facultative, donc aucun problème.
export function problemesSquelette(section) {
  if (section === undefined) return [];
  const problemes = [];
  const noms = [...section.matchAll(/```[\w-]*[ \t]+(\S+)[ \t]*\n/g)].map((m) => m[1]);
  if (noms.length === 0) {
    problemes.push("la section « Squelette » n'a aucun bloc de code (attendu : ```html index.html, ```css style.css, ```js script.js)");
    return problemes;
  }
  for (const nom of noms) {
    if (!FICHIERS_PROJET.includes(nom)) {
      problemes.push(`fichier « ${nom} » inconnu dans le squelette (attendu : ${FICHIERS_PROJET.join(", ")})`);
    }
  }
  const doublons = noms.filter((nom, i) => noms.indexOf(nom) !== i);
  for (const nom of new Set(doublons)) problemes.push(`le fichier « ${nom} » est présent plusieurs fois dans le squelette`);
  return problemes;
}
