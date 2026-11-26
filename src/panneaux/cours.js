// Panneau « cours seul » : pas d'exercice, le cours occupe toute la page
import { afficherPanneauDoc } from "../doc.js";
import { marquerReussi } from "../progression.js";

// L'exo compte comme fait dès l'ouverture, puis onOuvert met à jour « Exo suivant » et le menu.
export function monterPanneauCours({ exo, nomExo, panneauEnonce, docOnglet, zones, onOuvert }) {
  document.body.classList.add("cours-seul");
  docOnglet.classList.add("cache");
  zones.classList.add("cache");
  afficherPanneauDoc(exo, panneauEnonce, docOnglet, "Cours");
  marquerReussi(nomExo);
  onOuvert();
}
