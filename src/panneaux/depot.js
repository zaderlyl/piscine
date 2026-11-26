// Panneau « dépôt » : l'éditeur classique, la doc et l'aperçu laissent la place au dépôt Git
import { monterPanneauDepot } from "../depot.js";

export function monterPanneauDepotExo({
  exo,
  nomExo,
  apercu,
  docOnglet,
  panneauEnonce,
  zones,
  panneauResultats,
  onSucces,
  onOuvert,
}) {
  // Masque l'éditeur classique, doc et aperçu
  docOnglet.classList.add("cache");
  panneauEnonce.classList.add("cache");
  zones.classList.add("cache");
  apercu.classList.add("cache");
  document.getElementById("separateur-a").classList.add("cache");
  document.getElementById("variables").classList.add("cache");
  document.getElementById("separateur-b").classList.add("cache");
  panneauResultats.classList.add("cache");

  const depotGauche = document.createElement("div");
  depotGauche.id = "depot-gauche";
  document.getElementById("editeur").append(depotGauche);

  const depotDroite = document.createElement("div");
  depotDroite.id = "depot-droite";
  document.getElementById("droite").append(depotDroite);

  monterPanneauDepot({
    conteneurGauche: depotGauche,
    conteneurDroite: depotDroite,
    exo,
    nomExo,
    auteur: new URLSearchParams(location.search).has("auteur"),
    onSucces,
  });

  onOuvert();
}
