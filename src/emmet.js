import { EditorView } from "https://esm.sh/codemirror@6.0.1";
import expand from "https://esm.sh/emmet@2.4.11";

const CLE_EMMET = "piscine-emmet";

function lireEmmet() {
  try{
    return JSON.parse(localStorage.getItem(CLE_EMMET)) || []; 
  } catch {
    return [];
  }
}

const emmetDebloque = lireEmmet();

// Ajoute des raccourcis à ceux déjà débloqués et les garde pour les prochaines visites
export function debloquerEmmet(raccourcis) {
  const nouveaux = raccourcis.filter((raccourci) => !emmetDebloque.includes(raccourci));
  if (!nouveaux.length) return;
  emmetDebloque.push(...nouveaux);
  localStorage.setItem(CLE_EMMET, JSON.stringify(emmetDebloque));
}

export const emmetTab = EditorView.domEventHandlers({
  keydown(event, view){
    if (event.key !== "Tab" || event.shiftKey) return false;
    const { from, to } = view.state.selection.main;
    if ( from !== to) return false;

    const ligne = view.state.doc.lineAt(from);
    const avant = ligne.text.slice(0, from - ligne.from);
    const mot = avant.match(/\S+$/)?.[0];
    if (!mot) return false;
    // « <h1>lorem » : l'abréviation commence après la dernière balise
    const abreviation = [mot, mot.slice(mot.lastIndexOf(">") + 1)].find((a) =>
      emmetDebloque.includes(a),
    );
    if (!abreviation) return false;

    let resultat;
    try{
      resultat = expand(abreviation);
    }catch{
      return false;
    }

    event.preventDefault();
    const debut = from - abreviation.length;
    view.dispatch({
      changes: {from: debut, to: from, insert: resultat},
      selection: {anchor: debut + resultat.length},
    })
    return true;
  },
});