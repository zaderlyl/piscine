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

export const emmetTab = EditorView.domEventHandlers({
  keydown(event, view){
    if (event.key !== "tab" || event.shiftKey) return false;
    const { from, to } = view.state.selection.main;
    if ( from !== to) return false;

    const ligne = view.state.doc.lineAt(from);
    const abreviation = ligne.text.slice(0, from - ligne.from).match(/\S+$/)?.[0];
    if (!abreviation) return false;
    if (!emmetDebloque.includes(abreviation)) return false;

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