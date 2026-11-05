const CLE_PROGRESSION = "piscine-progression" ;

export function lireProgression(){
  try{
    const donnees = JSON.parse(localStorage.getItem(CLE_PROGRESSION));
    return donnees && typeof donnees === "object" ? donnees : {};
  } catch {
    return {};
  }
}

export function marquerReussi(exo){
  const progression = lireProgression();
  if(progression[exo]?.reussi) return;
  progression[exo] = { reussi: true, date: new Date().toISOString() };
  try{
    localStorage.setItem(CLE_PROGRESSION, JSON.stringify(progression));
  } catch {
    console.error("Erreur lors de la sauvegarde de la prog");
  }
}


export async function chargerListeExos(){
  try {
    const reponse = await fetch("../exos/index.json");
  } catch {
    return[];
  }
}

export function exoSuivant(exo, liste){
  const position = liste.indexOf(exo);
  return position === -1 ? null : (liste[position + 1] ?? null);
}