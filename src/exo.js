export function lireExo(texte) {
  const section = {};
  let courant = null;
  for (const ligne of texte.split("\n")) {
    const titre = ligne.match(/^##(?!#)\s*(.*)/);
    if (titre) {
      courant = titre[1].trim();
      section[courant] = "";
    } else if (courant) {
      section[courant] += ligne + "\n";
    }
  }
  return section;
}

export function lireCode(section) {
  const bloc = section.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return bloc ? bloc[1] : "";
}

// Raccourcis Emmet débloqués à la réussite : `emmet_debloque: ["lorem"]` dans l'en-tête de l'exo.
export function lireEmmetExo(texte) {
  const ligne = texte.match(/^emmet_debloque:\s*(\[.*\])/m);
  try {
    return ligne ? JSON.parse(ligne[1]) : [];
  } catch {
    return [];
  }
}

// Panneaux déclarés dans l'en-tête : `panneaux: [enonce, depot]` ou `[enonce, editeur, apercu]`
export function lirePanneaux(texte) {
  const ligne = texte.match(/^panneaux:\s*\[(.*?)\]/m);
  if (!ligne) return ["enonce", "editeur", "apercu"];
  return ligne[1].split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
}

// Propriété PTP dans l'en-tête : `ptp: oui | non | simple | riche` (défaut : oui)
export function lirePtp(texte) {
  const ligne = texte.match(/^ptp:\s*(oui|non|simple|riche)/m);
  return ligne ? ligne[1] : "oui";
}

// Mode de vérification d'un exo SQL dans l'en-tête : `verification: texte | resultat | etat`
// (défaut : texte). « texte » compare la requête aux solutions, « resultat » compare le tableau obtenu,
// « etat » compare le contenu des tables après une requête d'écriture.
export function lireVerification(texte) {
  const ligne = texte.match(/^verification:\s*(texte|resultat|etat)/m);
  return ligne ? ligne[1] : "texte";
}

// Type de l'exo dans l'en-tête : `type: cours` désigne un cours seul, sans exercice (par exemple les exos 00).
export function lireType(texte) {
  const ligne = texte.match(/^type:\s*([\w-]+)/m);
  return ligne ? ligne[1] : "classique";
}

export async function chargerExo(fichier) {
  const reponse = await fetch(fichier);
  const texte = (await reponse.text()).replace(/\r\n/g, "\n");
  const exo = lireExo(texte);
  // propriétés non énumérables : ce ne sont pas des sections de l'exo
  Object.defineProperty(exo, "emmetDebloque", { value: lireEmmetExo(texte) });
  Object.defineProperty(exo, "panneaux", { value: lirePanneaux(texte) });
  Object.defineProperty(exo, "ptp", { value: lirePtp(texte) });
  Object.defineProperty(exo, "verification", { value: lireVerification(texte) });
  Object.defineProperty(exo, "type", { value: lireType(texte) });
  Object.defineProperty(exo, "texteBrut", { value: texte });
  return exo;
}
