import { EditorView, basicSetup } from "https://esm.sh/codemirror@6.0.1";
import { html } from "https://esm.sh/@codemirror/lang-html@6.4.9";

const theme = EditorView.theme({
  "&": {
    height: "100%",
    width: "100%",
  },
});

new EditorView({
  extensions: [basicSetup, html(), theme],
  parent: document.getElementById("editeur"),
});