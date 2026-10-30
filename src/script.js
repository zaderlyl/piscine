import { EditorView, basicSetup } from "https://esm.sh/codemirror@6.0.1";
import { html } from "https://esm.sh/@codemirror/lang-html@6.4.9";


const apercu = document.getElementById("apercu");
let urlActuel = null;

// affichage du code dans iframe avec URL temporaire

function afficherApercu(code) {
  if (urlActuel) URL.revokeObjectURL(urlActuel);
  const blob = new Blob([code], { type: "text/html" });
  urlActuel = URL.createObjectURL(blob);
  apercu.src = urlActuel;
}




const theme = EditorView.theme({
  "&": {
    height: "100%",
    width: "100%",
  },
});


// mise a jour a chaque modif

const ecoute = EditorView.updateListener.of((update) => {
  if (update.docChanged){
  afficherApercu(update.state.doc.toString());}
});


new EditorView({
  doc:"",
  extensions: [basicSetup, html(), theme, ecoute],
  parent: document.getElementById("editeur"),
});