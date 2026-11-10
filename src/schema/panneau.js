import { lireSchema } from "./lecture.js";
import { verifierSchema } from "./verification.js";

// Dessine une table avec des cases à choisir dans une liste, et un bouton « Vérifier ».
// section : texte de la section « ## Schéma » de l'exo. onSucces() est appelée quand tout est juste.
export function monterPanneauSchema({ conteneur, section, onSucces }) {
  conteneur.innerHTML = "";
  conteneur.classList.add("schema");

  let schema;
  try {
    schema = lireSchema(section || "");
  } catch (erreur) {
    const p = document.createElement("p");
    p.className = "schema-erreur";
    p.textContent = "Schéma illisible : " + erreur.message;
    conteneur.append(p);
    return null;
  }

  const table = document.createElement("table");
  table.className = "schema-table";

  const legende = document.createElement("caption");
  legende.textContent = schema.table;
  table.append(legende);

  const selects = [];

  const entete = document.createElement("thead");
  for (const rangee of schema.entetes) {
    const tr = document.createElement("tr");
    tr.title = rangee.nom;
    for (const c of rangee.cases) {
      const th = document.createElement("th");
      if (c.type === "trou") {
        const select = document.createElement("select");
        select.className = "schema-trou";
        select.setAttribute("aria-label", rangee.nom);
        const vide = new Option("?", "");
        select.append(vide);
        for (const choix of c.choix) select.append(new Option(choix, choix));
        th.append(select);
        selects.push(select);
      } else {
        th.textContent = c.texte;
      }
      tr.append(th);
    }
    entete.append(tr);
  }
  table.append(entete);

  const corps = document.createElement("tbody");
  for (const ligne of schema.lignes) {
    const tr = document.createElement("tr");
    for (const cellule of ligne) {
      const td = document.createElement("td");
      td.textContent = cellule;
      tr.append(td);
    }
    corps.append(tr);
  }
  table.append(corps);

  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = "schema-verifier";
  bouton.textContent = "Vérifier";

  const messages = document.createElement("ul");
  messages.className = "schema-messages";
  messages.setAttribute("aria-live", "polite");

  function verifier() {
    const { reussi, resultats } = verifierSchema(
      schema,
      selects.map((s) => s.value),
    );
    messages.innerHTML = "";
    resultats.forEach((r, i) => {
      selects[i].classList.toggle("juste", r.ok);
      selects[i].classList.toggle("faux", !r.ok);
      if (!r.ok) {
        const li = document.createElement("li");
        li.textContent = `Case ${i + 1} : ${r.message}`;
        messages.append(li);
      }
    });
    if (reussi) {
      const li = document.createElement("li");
      li.className = "schema-reussi";
      li.textContent = "Réussi : tout est juste.";
      messages.append(li);
      if (typeof onSucces === "function") onSucces();
    }
  }

  bouton.addEventListener("click", verifier);
  conteneur.append(table, bouton, messages);
  return { verifier };
}
