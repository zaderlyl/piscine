import { marked } from "https://esm.sh/marked@12.0.2";

const SECTION_DOC = ["Énoncé", "Cours", "Méthode", "Indice"];

export function afficherPanneauDoc(exo, panneau, barreOnglets)
{
  const boutonsDoc = {};

  function afficherDoc(nom) {
    panneau.innerHTML = marked.parse((exo[nom] || "").trim());
    for (const [n, bouton] of Object.entries(boutonsDoc)) {
      bouton.classList.toggle("actif", n === nom);
    }
  }

  for (const nom of SECTION_DOC) {
    if (!exo[nom]) continue;
    const bouton = document.createElement("button");
    bouton.textContent = nom;
    bouton.addEventListener("click", () => afficherDoc(nom));
    barreOnglets.append(bouton);
    boutonsDoc[nom] = bouton;
  }

  afficherDoc("Énoncé");
}