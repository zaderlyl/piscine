// Page du module Git : un exo = un fichier Markdown dans exos/git/visuel/.
import { marked } from "https://esm.sh/marked@12.0.2";
import { nouveauDepot, executer, signature, rendre } from "./depot/moteur.js";

const exoChoisi = new URLSearchParams(location.search).get("exo");
const EXO = /^[\w/-]+$/.test(exoChoisi || "") ? exoChoisi : "git/visuel/01";
const auteur = new URLSearchParams(location.search).has("auteur");

const commande = document.getElementById("commande");
const sortie = document.getElementById("sortie");
const verdict = document.getElementById("verdict");

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

let depot;
let cible;
let solution = [];
let depart = [];

function afficher() {
  document.getElementById("graphe").textContent = rendre(depot);
  verdict.textContent = signature(depot) === signature(cible) ? "✅ Le graphe correspond à la cible" : "";
}

async function charger() {
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
  document.getElementById("titre").textContent = titre;
  document.getElementById("enonce").innerHTML = marked.parse((exo["Énoncé"] ?? "").trim());

  depart = lireCommandes(exo["Départ"]);
  solution = lireCommandes(exo["Solution"]);
  cible = jouer(jouer(nouveauDepot(), depart), solution);
  document.getElementById("cible").textContent = rendre(cible);

  if (auteur) document.getElementById("solution").hidden = false;
  recommencer();
}

// Remet le dépôt dans l'état de départ de l'exo
function recommencer() {
  depot = jouer(nouveauDepot(), depart);
  sortie.textContent = "";
  afficher();
}

document.getElementById("recommencer").addEventListener("click", recommencer);

document.getElementById("formulaire").addEventListener("submit", (e) => {
  e.preventDefault();
  const ligne = commande.value.trim();
  if (!ligne) return;
  const resultat = executer(depot, ligne);
  depot = resultat.depot;
  sortie.textContent = `$ ${ligne}\n${resultat.sortie}`;
  sortie.classList.toggle("erreur", resultat.erreur);
  commande.value = "";
  afficher();
});

document.getElementById("solution").addEventListener("click", () => {
  depot = jouer(depot, solution);
  sortie.textContent = "Solution chargée.";
  afficher();
});

charger();
