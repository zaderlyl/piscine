// Panneau « schéma » : énoncé à gauche, table de base de données à compléter à droite
import { afficherPanneauDoc } from "../doc.js";
import { monterPanneauSchema } from "../schema/panneau.js";

export function monterPanneauSchemaExo({
  exo,
  apercu,
  docOnglet,
  panneauEnonce,
  zones,
  panneauResultats,
  onSucces,
  onOuvert,
}) {
  zones.classList.add("cache");
  apercu.classList.add("cache");
  document.getElementById("separateur-a").classList.add("cache");
  document.getElementById("variables").classList.add("cache");
  document.getElementById("separateur-b").classList.add("cache");
  panneauResultats.classList.add("cache");

  afficherPanneauDoc(exo, panneauEnonce, docOnglet);

  const conteneurSchema = document.createElement("div");
  document.getElementById("droite").append(conteneurSchema);

  monterPanneauSchema({
    conteneur: conteneurSchema,
    section: exo["Schéma"],
    onSucces,
  });

  onOuvert();
}
