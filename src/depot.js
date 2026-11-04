// Page du module Git : un exo = un fichier Markdown dans exos/git/visuel/.
// Mode bac à sable (?libre) : pas d'exo, pas de cible, on part d'un dossier sans dépôt.
import { marked } from "https://esm.sh/marked@12.0.2";
import { nouveauDepot, executer, signature, ecarts } from "./depot/moteur.js";

const params = new URLSearchParams(location.search);
const LIBRE = params.has("libre");
const exoChoisi = params.get("exo");
const EXO = /^[\w/-]+$/.test(exoChoisi || "") ? exoChoisi : "git/visuel/01";
const auteur = params.has("auteur");

const commande = document.getElementById("commande");
const sortie = document.getElementById("sortie");
const verdict = document.getElementById("verdict");
const liste = document.getElementById("ecarts");

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
// Ce qui était affiché avant la dernière commande, pour mettre en évidence ce qui change
let precedent = { commits: new Set(), pointeurs: {} };

// Échappe le texte avant de l'insérer dans le HTML ou le SVG
function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Instantané de ce qui est affiché : les commits et l'endroit où pointe chaque branche
function instantane(d) {
  return { commits: new Set(d?.ordre ?? []), pointeurs: { ...(d?.branches ?? {}) } };
}

// Ce qui vient de changer depuis l'affichage précédent
function calculerMarques() {
  if (!depot) return {};
  return {
    commits: new Set(depot.ordre.filter((id) => !precedent.commits.has(id))),
    branches: new Set(Object.keys(depot.branches).filter((nom) => depot.branches[nom] !== precedent.pointeurs[nom])),
  };
}

// Arbre en SVG : le plus ancien en haut, le plus récent en bas.
// Une colonne par branche ; une courbe relie chaque commit à ses parents (deux pour une fusion).
function dessinerArbre(d, marques = {}) {
  if (!d) return `<p class="discret">Pas de dépôt Git dans ce dossier. Lance « git init ».</p>`;
  if (!d.ordre.length) return `<p class="discret">Aucun commit pour l'instant.</p>`;

  const noms = Object.keys(d.branches);
  const nouveaux = marques.commits ?? new Set();
  const bougees = marques.branches ?? new Set();

  // Colonne d'un commit : celle de la branche qui pointe dessus, sinon celle de son premier parent
  const colonne = {};
  for (const id of d.ordre) {
    const branche = noms.find((nom) => d.branches[nom] === id);
    colonne[id] = branche !== undefined ? noms.indexOf(branche) : (colonne[d.commits[id].parents[0]] ?? 0);
  }

  const X = (id) => 30 + colonne[id] * 44;
  const Y = (id) => 30 + d.ordre.indexOf(id) * 58;
  const xTexte = 30 + noms.length * 44 + 14;
  const xEtiquettes = xTexte + 250;
  const largeur = xEtiquettes + 200;
  const hauteur = Y(d.ordre[d.ordre.length - 1]) + 34;

  const liens = d.ordre.flatMap((id) =>
    d.commits[id].parents.map((parent) => {
      const milieu = (Y(parent) + Y(id)) / 2;
      return `<path d="M${X(parent)} ${Y(parent)} C${X(parent)} ${milieu} ${X(id)} ${milieu} ${X(id)} ${Y(id)}" fill="none" style="stroke:var(--discret)" stroke-width="2"/>`;
    }),
  );

  const noeuds = d.ordre.map((id) => {
    const surHead = d.branches[d.head] === id;
    const nouveau = nouveaux.has(id);
    const remplissage = surHead ? "var(--succes)" : "var(--carte)";
    const contour = nouveau ? "var(--attention)" : "var(--texte)";
    const rayon = nouveau ? 10 : 8;
    const pastilles = noms
      .filter((nom) => d.branches[nom] === id)
      .map((nom, i) => {
        const x = xEtiquettes + i * 100;
        const libelle = nom === d.head ? `HEAD → ${nom}` : nom;
        const contourPastille = bougees.has(nom) ? "var(--attention)" : "var(--accent)";
        return `<rect x="${x}" y="${Y(id) - 12}" width="92" height="24" rx="6" style="fill:var(--fond);stroke:${contourPastille}" stroke-width="2"/>
      <text x="${x + 46}" y="${Y(id) + 4}" text-anchor="middle" font-size="12" font-weight="600" style="fill:var(--texte)">${echapper(libelle)}</text>`;
      })
      .join("");
    return `<circle cx="${X(id)}" cy="${Y(id)}" r="${rayon}" style="fill:${remplissage};stroke:${contour}" stroke-width="2.5"/>
      <text x="${xTexte}" y="${Y(id) + 5}" font-size="14" style="fill:var(--texte)">${echapper(d.commits[id].message)}</text>${pastilles}`;
  });

  return `<svg viewBox="0 0 ${largeur} ${hauteur}" role="img" aria-label="Graphe des commits">${liens.join("")}${noeuds.join("")}</svg>`;
}

// Ligne de statut : remplace l'affichage des zones de travail
function statutHtml(d) {
  if (!d) return `<span class="puce">Pas de dépôt</span>`;
  const modifies = d.travail.length;
  const prets = d.index.length;
  return [
    `<span class="puce">Branche : <b>${echapper(d.head)}</b></span>`,
    `<span class="puce ${modifies ? "attention" : ""}">Modifiés : ${modifies}</span>`,
    `<span class="puce ${prets ? "attention" : ""}">Prêts (ajoutés) : ${prets}</span>`,
  ].join("");
}

// Affiche l'état courant. marquer = false pour un nouveau départ, sans rien mettre en évidence.
function afficher({ marquer = true } = {}) {
  const marques = marquer ? calculerMarques() : {};
  document.getElementById("statut").innerHTML = statutHtml(depot);
  document.getElementById("graphe").innerHTML = dessinerArbre(depot, marques);
  precedent = instantane(depot);

  const reussi = cible && depot && signature(depot) === signature(cible);
  let messages = [];
  if (cible && !depot) messages = ["Il n'y a pas encore de dépôt : lance « git init »."];
  else if (cible && !reussi) messages = ecarts(depot, cible);
  if (cible && !reussi && !messages.length) messages = ["Le graphe n'est pas encore celui attendu."];

  verdict.classList.toggle("reussi", Boolean(reussi));
  verdict.textContent = reussi ? "✅ Ton graphe correspond à la cible" : "";
  liste.innerHTML = messages.map((m) => `<li>${echapper(m)}</li>`).join("");
}

// Remet le dépôt dans l'état de départ : aucun dépôt en bac à sable, le départ de l'exo sinon
function recommencer() {
  depot = LIBRE || sansDepot ? null : jouer(nouveauDepot(), depart);
  sortie.textContent = "";
  afficher({ marquer: false });
}

function afficherCible() {
  document.getElementById("bloc-cible").hidden = !cible;
  if (cible) document.getElementById("cible").innerHTML = dessinerArbre(cible);
}

async function charger() {
  if (LIBRE) {
    document.getElementById("titre").textContent = "Bac à sable";
    document.getElementById("cours").innerHTML = marked.parse(COURS_LIBRE);
    document.getElementById("enonce").textContent = "Pas de consigne : essaie les commandes à ton rythme.";
    document.querySelector("details:has(#indice)").hidden = true;
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
  document.getElementById("indice").innerHTML = marked.parse((exo["Indice"] ?? "").trim());

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
