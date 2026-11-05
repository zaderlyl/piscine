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

export async function chargerExo(fichier){
  const reponse = await fetch(fichier);
  return lireExo((await reponse.text()).replace(/\r\n/g, "\n"));
}

