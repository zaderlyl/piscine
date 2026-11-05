export function lireBrouillon(cle){
  try{
    return JSON.parse(localStorage.getItem(cle)) || {};
  } catch {
    return {};
  }
}


export function sauvegardeBrouillon(cle, contenus) {
  try {
    localStorage.setItem(cle, JSON.stringify(contenus));
  } catch {
    console.error("Erreur lors de la sauvegarde du brouillon");
  }
}