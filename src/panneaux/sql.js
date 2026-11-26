// Panneau « SQL » : énoncé et éditeur à gauche, résultat de la requête à droite
import { afficherPanneauDoc } from "../doc.js";
import { lireBrouillon, sauvegarderBrouillon } from "../brouillon.js";
import { creerEditeurSql } from "../editeur.js";
import { monterPanneauSql } from "../sql/panneau.js";

export function monterPanneauSqlExo({
  exo,
  cleBrouillon,
  apercu,
  docOnglet,
  panneauEnonce,
  zones,
  panneauResultats,
  onSucces,
  onOuvert,
}) {
  apercu.classList.add("cache");
  document.getElementById("separateur-a").classList.add("cache");
  document.getElementById("variables").classList.add("cache");
  document.getElementById("separateur-b").classList.add("cache");
  panneauResultats.classList.add("cache");

  afficherPanneauDoc(exo, panneauEnonce, docOnglet);

  const zoneSql = document.createElement("div");
  zoneSql.className = "zone";
  zones.append(zoneSql);

  let minuteurSql = null;
  const editeurSql = creerEditeurSql({
    parent: zoneSql,
    doc: lireBrouillon(cleBrouillon)["requete.sql"],
    surChangement(vue) {
      clearTimeout(minuteurSql);
      minuteurSql = setTimeout(
        () => sauvegarderBrouillon(cleBrouillon, { "requete.sql": vue.state.doc.toString() }),
        1000,
      );
    },
  });

  const conteneurSql = document.createElement("div");
  document.getElementById("droite").append(conteneurSql);

  monterPanneauSql({
    conteneur: conteneurSql,
    exo,
    lireRequete: () => editeurSql.state.doc.toString(),
    onSucces,
    verification: exo.verification,
  });

  onOuvert();
}
