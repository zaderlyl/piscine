// Page du module Git : un exo = un fichier Markdown dans exos/git/visuel/.
// Mode bac à sable (?libre) : pas d'exo, pas de cible, on part d'un dossier sans dépôt.
import { marked } from "https://esm.sh/marked@12.0.2";
import { nouveauDepot, executer, executerScript, signature, ecarts, condition } from "./depot/moteur.js";

const params = new URLSearchParams(location.search);
const LIBRE = params.has("libre");
const exoChoisi = params.get("exo");
const EXO = /^[\w/-]+$/.test(exoChoisi || "") ? exoChoisi : "git/visuel/01";
const auteur = params.has("auteur");

const commande = document.getElementById("commande");
const sortie = document.getElementById("sortie");
const verdict = document.getElementById("verdict");
const liste = document.getElementById("ecarts");
const suivant = document.getElementById("suivant");

// Ordre des exos Git : le bouton « Exo suivant » suit cette liste. À compléter à chaque nouvel exo.
const ORDRE = [
  "git/visuel/01", "git/visuel/02", "git/visuel/03", "git/visuel/04", "git/visuel/05", "git/visuel/06",
  "git/visuel/07", "git/visuel/08", "git/visuel/09", "git/visuel/10", "git/visuel/11",
];

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

// Les lignes de commande d'une section (Départ ou Solution) : git, gh, et les lignes de script edit / autre-dev
function lireCommandes(section = "") {
  return section
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter((ligne) => /^(git|gh|edit|autre-dev) /.test(ligne));
}

// Joue une suite de commandes sur un dépôt et renvoie le dépôt final
function jouer(depot, commandes) {
  for (const ligne of commandes) depot = executerScript(depot, ligne).depot;
  return depot;
}

let depot = null;
let cible = null;
let solution = [];
let depart = [];
let sansDepot = false; // l'exo commence dans un dossier sans dépôt (depot: aucun)
// Ce qui était affiché avant la dernière commande, pour mettre en évidence ce qui change
let precedent = { commits: new Set(), pointeurs: {} };
let derniereErreur = false; // la dernière commande a échoué (sortie en rouge)
let ecartsPrecedents = null; // nombre d'écarts à l'affichage précédent, pour voir si ça avance
let etapes = []; // étapes de l'exo : { condition, texte, indice }
let avancement = 0; // nombre d'étapes faites, dans l'ordre
let indiceGeneral = ""; // indice de tout l'exo, affiché quand il n'y a plus d'étape à faire

// Étapes : une par ligne « - condition | texte | indice »
function lireEtapes(section = "") {
  return section
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter((ligne) => ligne.startsWith("- "))
    .map((ligne) => {
      const [condition, texte = "", indice = ""] = ligne.slice(2).split(" | ").map((s) => s.trim());
      return { condition, texte, indice };
    });
}

// Coche les étapes atteintes, dans l'ordre : une étape ne se coche qu'après la précédente
function verifierEtapes() {
  while (depot && avancement < etapes.length && condition(depot, etapes[avancement].condition)) avancement++;
}

// Liste des étapes et indice de l'étape en cours
function afficherEtapes() {
  const liste = document.getElementById("etapes");
  liste.hidden = etapes.length === 0;
  liste.innerHTML = etapes
    .map((e, i) => {
      const repere = i < avancement ? "✓" : i === avancement ? "→" : "○";
      const texte = marked.parseInline(e.texte);
      return `<li>${repere} ${i === avancement ? `<b>${texte}</b>` : texte}</li>`;
    })
    .join("");
  const enCours = etapes[avancement];
  const indice = enCours && enCours.indice ? enCours.indice : indiceGeneral;
  document.getElementById("indice").innerHTML = marked.parse(indice);
}

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

// Arbre en SVG, noir et blanc : le plus ancien en haut, le plus récent en bas.
// Une colonne par branche ; une ligne relie chaque commit à ses parents (deux pour une fusion).
function dessinerArbre(d, marques = {}, reference = null) {
  if (!d) return `<p>Pas de dépôt Git dans ce dossier. Lance « git init ».</p>`;
  if (!d.ordre.length) return `<p>Aucun commit pour l'instant.</p>`;

  const noms = Object.keys(d.branches);
  const nouveaux = marques.commits ?? new Set();
  const bougees = marques.branches ?? new Set();
  // Repères des différences avec la cible : trait en pointillés pour ce qui ne correspond pas
  const messagesAttendus = reference ? new Set(Object.values(reference.commits).map((c) => c.message)) : null;
  const pointe = (x, nom) => (x.branches[nom] ? x.commits[x.branches[nom]].message : null);

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
      return `<path d="M${X(parent)} ${Y(parent)} C${X(parent)} ${milieu} ${X(id)} ${milieu} ${X(id)} ${Y(id)}" fill="none" stroke="#000" stroke-width="2"/>`;
    }),
  );

  const noeuds = d.ordre.map((id) => {
    const surHead = d.branches[d.head] === id;
    const epaisseur = nouveaux.has(id) ? 4 : 2;
    const rayon = nouveaux.has(id) ? 10 : 8;
    const pastilles = noms
      .filter((nom) => d.branches[nom] === id)
      .map((nom, i) => {
        const x = xEtiquettes + i * 100;
        const libelle = nom === d.head ? `HEAD → ${nom}` : nom;
        const epaisseurCadre = bougees.has(nom) ? 4 : 1.5;
        const differente = reference && pointe(d, nom) !== pointe(reference, nom);
        const pointilles = differente ? ` stroke-dasharray="4 3"` : "";
        return `<rect x="${x}" y="${Y(id) - 12}" width="92" height="24" fill="#fff" stroke="#000" stroke-width="${epaisseurCadre}"${pointilles}/>
      <text x="${x + 46}" y="${Y(id) + 4}" text-anchor="middle" font-size="12" font-weight="bold" fill="#000">${echapper(libelle)}</text>`;
      })
      .join("");
    const message = d.commits[id].message;
    const pointilleCommit = messagesAttendus && !messagesAttendus.has(message) ? ` stroke-dasharray="4 3"` : "";
    return `<circle cx="${X(id)}" cy="${Y(id)}" r="${rayon}" fill="${surHead ? "#000" : "#fff"}" stroke="#000" stroke-width="${epaisseur}"${pointilleCommit}/>
      <text x="${xTexte}" y="${Y(id) + 5}" font-size="14" fill="#000">${echapper(message)}</text>${pastilles}`;
  });

  return `<svg viewBox="0 0 ${largeur} ${hauteur}" width="100%" role="img" aria-label="Graphe des commits">${liens.join("")}${noeuds.join("")}</svg>`;
}

// Ligne de statut : une phrase, sans mise en forme
function statutTexte(d) {
  if (!d) return "Pas de dépôt.";
  const morceaux = [`Branche : ${d.head}`, `Modifiés : ${d.travail.length}`, `Prêts (ajoutés) : ${d.index.length}`];
  if (d.fusion) {
    const conflits = d.fusion.conflits.length ? d.fusion.conflits.join(", ") : "aucun";
    morceaux.push(`Fusion de « ${d.fusion.de} » en cours, conflits : ${conflits}`);
  }
  if (d.distant) morceaux.push(`origin : ${Object.keys(d.distant).join(", ") || "vide"}`);
  for (const pr of d.prs.filter((p) => p.etat === "ouverte")) {
    morceaux.push(`Pull request : ${pr.de} → ${pr.vers}${pr.approuvee ? " (approuvée)" : ""}`);
  }
  return morceaux.join(" · ");
}

// Affiche l'état courant. marquer = false pour un nouveau départ, sans rien mettre en évidence.
function afficher({ marquer = true } = {}) {
  const marques = marquer ? calculerMarques() : {};
  document.getElementById("statut").textContent = statutTexte(depot);
  document.getElementById("graphe").innerHTML = dessinerArbre(depot, marques, cible);
  precedent = instantane(depot);

  const reussi = Boolean(cible && depot && signature(depot) === signature(cible));
  let messages = [];
  if (cible && !depot) messages = ["Il n'y a pas encore de dépôt : lance « git init »."];
  else if (cible && !reussi) messages = ecarts(depot, cible);
  if (cible && !reussi && !messages.length) messages = ["Le graphe n'est pas encore celui attendu."];

  // Vert quand ça avance (moins d'écarts qu'avant) ou que c'est bon, rouge quand la commande a échoué
  // Sans dépôt, la distance compte un écart de plus, pour que « git init » soit vu comme un progrès
  const distance = messages.length + (cible && !depot ? 1 : 0);
  const avance = ecartsPrecedents !== null && distance < ecartsPrecedents;
  ecartsPrecedents = distance;
  sortie.className = derniereErreur ? "mauvais" : avance || reussi ? "bon" : "";
  liste.className = derniereErreur && !reussi ? "mauvais" : "";

  verifierEtapes();
  afficherEtapes();

  verdict.className = reussi ? "bon" : "";
  verdict.textContent = reussi ? "Réussi : ton graphe correspond à la cible." : "";
  liste.innerHTML = messages.map((m) => `<li>${echapper(m)}</li>`).join("");

  // Bouton vers l'exo suivant, seulement après la réussite
  const suite = ORDRE[ORDRE.indexOf(EXO) + 1];
  suivant.hidden = !(reussi && suite && !LIBRE);
  suivant.dataset.exo = suite ?? "";
}

// Remet le dépôt dans l'état de départ : aucun dépôt en bac à sable, le départ de l'exo sinon
function recommencer() {
  depot = LIBRE || sansDepot ? null : jouer(nouveauDepot(), depart);
  sortie.textContent = "";
  derniereErreur = false;
  ecartsPrecedents = null;
  avancement = 0;
  afficher({ marquer: false });
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
    document.getElementById("enonce").textContent = "Pas de consigne : essaie les commandes à ton rythme.";
    document.getElementById("indice").closest("details").hidden = true;
    etapes = [];
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
  etapes = lireEtapes(exo["Étapes"]);
  indiceGeneral = (exo["Indice"] ?? "").trim();

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
    if (ligne === "git init") {
      depot = nouveauDepot();
      sortie.textContent = `$ ${ligne}\nDépôt Git vide initialisé dans ce dossier.`;
      derniereErreur = false;
    } else {
      sortie.textContent = `$ ${ligne}\nfatal : pas de dépôt Git ici. Lance « git init » d'abord.`;
      derniereErreur = true;
    }
  } else {
    const resultat = executer(depot, ligne);
    depot = resultat.depot;
    sortie.textContent = `$ ${ligne}\n${resultat.sortie}`;
    derniereErreur = resultat.erreur;
  }
  commande.value = "";
  afficher();
});

document.getElementById("recommencer").addEventListener("click", recommencer);

document.getElementById("solution").addEventListener("click", () => {
  depot = jouer(depot ?? nouveauDepot(), solution);
  sortie.textContent = "Solution chargée.";
  derniereErreur = false;
  afficher();
});

suivant.addEventListener("click", () => {
  if (suivant.dataset.exo) location.search = `?exo=${suivant.dataset.exo}`;
});

charger();
