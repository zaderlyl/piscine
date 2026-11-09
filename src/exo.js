export function lireExo(texte) {
  const section = {};
  let courant = null;
  for (const ligne of texte.split("\n")) {
    const titre = ligne.match(/^##\s*(.*)/);
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

export async function chargerExo(fichier){
  const reponse = await fetch(fichier);
  const texte = (await reponse.text()).replace(/\r\n/g, "\n");
  const exo = lireExo(texte);
  // propriété non énumérable : ce n'est pas une section de l'exo
  Object.defineProperty(exo, "emmetDebloque", { value: lireEmmetExo(texte) });
  return exo;
}

