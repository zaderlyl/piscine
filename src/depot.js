// Page du module Git : un exo = un fichier Markdown dans exos/git/visuel/.
// Mode bac à sable (?libre) : pas d'exo, pas de cible, on part d'un dossier sans dépôt.
import { marked } from "https://esm.sh/marked@12.0.2";
import { nouveauDepot, executer, signature } from "./depot/moteur.js";

const params = new URLSearchParams(location.search);
const LIBRE = params.has("libre");
const exoChoisi = params.get("exo");
const EXO = /^[\w/-]+$/.test(exoChoisi || "") ? exoChoisi : "git/visuel/01";
const auteur = params.has("auteur");

const commande = document.getElementById("commande");
const sortie = document.getElementById("sortie");
const verdict = document.getElementById("verdict");

const COURS_LIBRE = `Dans ce bac à sable, il n'y a pas d'exo. Tu pars d'un dossier qui contient
\`index.html\` et \`style.css\`, sans dépôt Git. Crée ton dépôt avec \`git init\`, puis essaie ce que tu veux.`;

// Découpe l'exo en sections : « ## Titre » → texte
function lireExo(texte) {
  const section = {};
  let courant = null;
  for (const ligne of texte.split("\n")) {
    const titre = ligne.match(/^##\s*(.*)/);
    if (titre) {
      courant = titre[1].trim();
      section[courant] = "";
    } else if (courant) {
      section[courant] += ligne + "\n";
    }
  }
  return section;
}

// Les lignes « git … » d'une section (Départ ou Solution)
function lireCommandes(section = "") {
  return section
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter((ligne) => ligne.startsWith("git "));
}

// Joue une suite de commandes sur un dépôt et renvoie le dépôt final
function jouer(depot, commandes) {
  for (const ligne of commandes) depot = executer(depot, ligne).depot;
  return depot;
}

let depot = null;
let cible = null;
let solution = [];
let depart = [];
let sansDepot = false; // l'exo commence dans un dossier sans dépôt (depot: aucun)

// Échappe le texte saisi par l'élève avant de l'insérer dans le SVG
function echapper(texte) {
  return texte.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Dessin du graphe en SVG : un commit par ligne (le plus récent en haut), une colonne par branche.
// Une branche garde la même colonne que ses commits ; une ligne relie chaque commit à son parent.
function dessinerArbre(depot) {
  if (!depot) return `<p>(pas de dépôt Git dans ce dossier)</p>`;
  if (!depot.ordre.length) return `<p>(aucun commit)</p>`;

  const noms = Object.keys(depot.branches);
  const colonne = {};
  for (const id of depot.ordre) {
    const branche = noms.find((nom) => depot.branches[nom] === id);
    const parent = depot.commits[id].parents[0];
    colonne[id] = branche !== undefined ? noms.indexOf(branche) : colonne[parent] ?? 0;
  }

  const ordre = [...depot.ordre].reverse();
  const X = (id) => 20 + colonne[id] * 36;
  const Y = (id) => 20 + ordre.indexOf(id) * 40;
  const largeur = 20 + noms.length * 36 + 300;
  const hauteur = Y(ordre[ordre.length - 1]) + 30;
  const xTexte = 20 + noms.length * 36;

  const lignes = ordre
    .filter((id) => depot.commits[id].parents[0])
    .map((id) => {
      const p = depot.commits[id].parents[0];
      return `<line x1="${X(id)}" y1="${Y(id)}" x2="${X(p)}" y2="${Y(p)}" stroke="#555" stroke-width="2"/>`;
    });

  const noeuds = ordre.map((id) => {
    const commit = depot.commits[id];
    const surHead = depot.branches[depot.head] === id;
    const etiquettes = noms
      .filter((nom) => depot.branches[nom] === id)
      .map((nom) => (nom === depot.head ? `HEAD -> ${nom}` : nom));
    const badge = etiquettes.length ? ` (${etiquettes.join(", ")})` : "";
    return `
      <circle cx="${X(id)}" cy="${Y(id)}" r="7" fill="${surHead ? "#2a7a2a" : "#fff"}" stroke="#333" stroke-width="2"/>
      <text x="${xTexte}" y="${Y(id) + 5}" font-family="monospace" font-size="13">${echapper(commit.message)}${echapper(badge)}</text>`;
  });

  return `<svg width="100%" viewBox="0 0 ${largeur} ${hauteur}" role="img" aria-label="Graphe des commits">${lignes.join("")}${noeuds.join("")}</svg>`;
}

function afficher() {
  document.getElementById("graphe").innerHTML = dessinerArbre(depot);
  const reussi = cible && depot && signature(depot) === signature(cible);
  verdict.textContent = reussi ? "✅ Le graphe correspond à la cible" : "";
}

// Remet le dépôt dans l'état de départ : aucun dépôt en bac à sable, le départ de l'exo sinon
function recommencer() {
  depot = LIBRE || sansDepot ? null : jouer(nouveauDepot(), depart);
  sortie.textContent = "";
  afficher();
}

function afficherCible() {
  document.getElementById("titre-cible").hidden = !cible;
  document.getElementById("cible").hidden = !cible;
  if (cible) document.getElementById("cible").innerHTML = dessinerArbre(cible);
}

async function charger() {
  if (LIBRE) {
    document.getElementById("titre").textContent = "Bac à sable";
    document.getElementById("cours").innerHTML = marked.parse(COURS_LIBRE);
    document.getElementById("enonce").textContent = "";
    recommencer();
    afficherCible();
    return;
  }

  let texte;
  try {
    const reponse = await fetch(`../exos/${EXO}.md`);
    if (!reponse.ok) throw new Error(reponse.statusText);
    texte = (await reponse.text()).replace(/\r\n/g, "\n");
  } catch {
    document.getElementById("enonce").textContent = `Exo introuvable : ${EXO}`;
    return;
  }
  const exo = lireExo(texte);
  const titre = texte.match(/^titre:\s*(.*)$/m)?.[1] ?? EXO;
  sansDepot = /^depot:\s*aucun/m.test(texte);
  document.getElementById("titre").textContent = titre;
  document.getElementById("cours").innerHTML = marked.parse((exo["Cours"] ?? "").trim());
  document.getElementById("enonce").innerHTML = marked.parse((exo["Énoncé"] ?? "").trim());

  depart = lireCommandes(exo["Départ"]);
  solution = lireCommandes(exo["Solution"]);
  cible = jouer(jouer(nouveauDepot(), depart), solution);
  afficherCible();

  if (auteur) document.getElementById("solution").hidden = false;
  recommencer();
}

document.getElementById("formulaire").addEventListener("submit", (e) => {
  e.preventDefault();
  const ligne = commande.value.trim();
  if (!ligne) return;
  if (!depot) {
    // Pas de dépôt : seule la commande git init est acceptée
    sortie.classList.toggle("erreur", ligne !== "git init");
    if (ligne === "git init") {
      depot = nouveauDepot();
      sortie.textContent = `$ ${ligne}\nDépôt Git vide initialisé dans ce dossier.`;
    } else {
      sortie.textContent = `$ ${ligne}\nfatal : pas de dépôt Git ici. Lance « git init » d'abord.`;
    }
  } else {
    const resultat = executer(depot, ligne);
    depot = resultat.depot;
    sortie.textContent = `$ ${ligne}\n${resultat.sortie}`;
    sortie.classList.toggle("erreur", resultat.erreur);
  }
  commande.value = "";
  afficher();
});

document.getElementById("recommencer").addEventListener("click", recommencer);

document.getElementById("solution").addEventListener("click", () => {
  depot = jouer(depot ?? nouveauDepot(), solution);
  sortie.textContent = "Solution chargée.";
  afficher();
});

charger();
