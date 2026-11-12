import { lireSql } from "./lecture.js";
import { verifierRequete, verifierResultat, verifierEtat } from "./verification.js";
import { chargerSql, executerRequete } from "./moteur.js";

// Remplit `conteneur` avec le tableau d'un résultat { colonnes, lignes }.
export function afficherTableau(conteneur, { colonnes, lignes }) {
  conteneur.innerHTML = "";
  if (colonnes.length === 0) {
    const p = document.createElement("p");
    p.textContent = "La requête n'a renvoyé aucune ligne.";
    conteneur.append(p);
    return;
  }
  const table = document.createElement("table");
  table.className = "sql-table";
  const tr = document.createElement("tr");
  for (const c of colonnes) {
    const th = document.createElement("th");
    th.textContent = c;
    tr.append(th);
  }
  const thead = document.createElement("thead");
  thead.append(tr);
  const tbody = document.createElement("tbody");
  for (const ligne of lignes) {
    const l = document.createElement("tr");
    for (const v of ligne) {
      const td = document.createElement("td");
      td.textContent = v === null ? "NULL" : String(v);
      l.append(td);
    }
    tbody.append(l);
  }
  table.append(thead, tbody);
  conteneur.append(table);
}

// Remplit `conteneur` avec le contenu de chaque table : [{ nom, colonnes, lignes }].
export function afficherTables(conteneur, tables) {
  conteneur.innerHTML = "";
  const intro = document.createElement("p");
  intro.textContent = "Tables après ta requête :";
  conteneur.append(intro);
  for (const table of tables) {
    const titre = document.createElement("h3");
    titre.className = "sql-table-nom";
    titre.textContent = table.nom;
    const zone = document.createElement("div");
    afficherTableau(zone, table);
    conteneur.append(titre, zone);
  }
}

// Panneau d'un exo de requêtes : boutons « Exécuter » et « Vérifier », tableau de résultat.
// exo : sections de l'exo (Base, Solutions). lireRequete() renvoie le texte de l'éditeur.
// verification : « texte » (la requête ressemble à une solution), « resultat » (le tableau obtenu
// est celui d'une solution) ou « etat » (les tables après la requête sont celles d'une solution).
// Une requête d'écriture (INSERT, UPDATE, DELETE) affiche le contenu des tables après son exécution.
// onSucces() est appelée quand la requête est jugée correcte.
// charger : fournit l'objet sql.js (remplaçable dans les tests).
export function monterPanneauSql({ conteneur, exo, lireRequete, onSucces, verification = "texte", charger = chargerSql }) {
  conteneur.innerHTML = "";
  conteneur.classList.add("schema");

  let sql;
  try {
    sql = lireSql(exo);
  } catch (erreur) {
    const p = document.createElement("p");
    p.className = "schema-erreur";
    p.textContent = "Exercice illisible : " + erreur.message;
    conteneur.append(p);
    return null;
  }

  const executer = document.createElement("button");
  executer.type = "button";
  executer.className = "sql-executer";
  executer.textContent = "Exécuter";

  const verifier = document.createElement("button");
  verifier.type = "button";
  verifier.className = "sql-verifier";
  verifier.textContent = "Vérifier";

  const resultat = document.createElement("div");
  resultat.className = "sql-resultat";

  const messages = document.createElement("ul");
  messages.className = "schema-messages";
  messages.setAttribute("aria-live", "polite");

  function message(texte, classe) {
    messages.innerHTML = "";
    const li = document.createElement("li");
    if (classe) li.className = classe;
    li.textContent = texte;
    messages.append(li);
  }

  async function lancer() {
    messages.innerHTML = "";
    let SQL;
    try {
      SQL = await charger();
    } catch (erreur) {
      resultat.innerHTML = "";
      message(erreur.message);
      return;
    }
    const r = executerRequete(SQL, sql.base, lireRequete());
    if (r.erreur) {
      resultat.innerHTML = "";
      message("Erreur SQL : " + r.erreur);
    } else if (r.ecriture) {
      afficherTables(resultat, r.tables);
    } else {
      afficherTableau(resultat, r);
    }
  }

  async function verifierLaRequete() {
    let r;
    if (verification === "resultat" || verification === "etat") {
      let SQL;
      try {
        SQL = await charger();
      } catch (erreur) {
        message(erreur.message);
        return;
      }
      const verifier = verification === "etat" ? verifierEtat : verifierResultat;
      r = verifier({ SQL, base: sql.base, requete: lireRequete(), solutions: sql.solutions });
    } else {
      r = verifierRequete(lireRequete(), sql.solutions);
    }
    message(r.message, r.reussi ? "schema-reussi" : "");
    if (r.reussi && typeof onSucces === "function") onSucces();
  }

  executer.addEventListener("click", lancer);
  verifier.addEventListener("click", verifierLaRequete);
  conteneur.append(executer, " ", verifier, resultat, messages);
  return { lancer, verifierLaRequete };
}
