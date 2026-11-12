// Page et panneau du module Git : un exo = un fichier Markdown dans exos/git/visuel/.
// Mode bac à sable (?libre) : pas d'exo, pas de cible, on part d'un dossier sans dépôt.
import { nouveauDepot, executer, executerScript, signature, ecarts, condition } from "./depot/moteur.js";

let marked = { parse: (s) => s ?? "", parseInline: (s) => s ?? "" };
try {
  const mod = await import("https://esm.sh/marked@12.0.2");
  if (mod?.marked) marked = mod.marked;
} catch {
  // Environnement Node de test ou hors ligne : repli sans plantage
}

// Ordre des exos Git : liste de secours statique (la référence dynamique est exos/index.json).
export const ORDRE = [
  "git/visuel/01", "git/visuel/02", "git/visuel/03", "git/visuel/04",
  "git/visuel/05", "git/visuel/06", "git/visuel/07", "git/visuel/08",
  "git/visuel/09", "git/visuel/10", "git/visuel/11",
];

const COURS_LIBRE = `Dans ce bac à sable, il n'y a pas d'exo. Tu pars d'un dossier qui contient
\`index.html\` et \`style.css\`, sans dépôt Git. Crée ton dépôt avec \`git init\`, puis essaie ce que tu veux.`;

// Découpe l'exo en sections : « ## Titre » → texte
export function lireExo(texte) {
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
export function lireCommandes(section = "") {
  return section
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter((ligne) => /^(git|gh|edit|autre-dev) /.test(ligne));
}

// Joue une suite de commandes sur un dépôt et renvoie le dépôt final
export function jouer(depot, commandes) {
  for (const ligne of commandes) depot = executerScript(depot, ligne).depot;
  return depot;
}

// Étapes : une par ligne « - condition | texte | indice »
export function lireEtapes(section = "") {
  return section
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter((ligne) => ligne.startsWith("- "))
    .map((ligne) => {
      const [cond, texte = "", indice = ""] = ligne.slice(2).split(" | ").map((s) => s.trim());
      return { condition: cond, texte, indice };
    });
}

// Échappe le texte avant de l'insérer dans le HTML ou le SVG
export function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Instantané de ce qui est affiché : les commits et l'endroit où pointe chaque branche
export function instantane(d) {
  return { commits: new Set(d?.ordre ?? []), pointeurs: { ...(d?.branches ?? {}) } };
}

// Arbre en SVG, noir et blanc : le plus ancien en haut, le plus récent en bas.
export function dessinerArbre(d, marques = {}, reference = null) {
  if (!d) return `<p>Pas de dépôt Git dans ce dossier. Lance « git init ».</p>`;
  if (!d.ordre.length) return `<p>Aucun commit pour l'instant.</p>`;

  const noms = Object.keys(d.branches);
  const nouveaux = marques.commits ?? new Set();
  const bougees = marques.branches ?? new Set();
  const messagesAttendus = reference ? new Set(Object.values(reference.commits).map((c) => c.message)) : null;
  const pointe = (x, nom) => (x.branches[nom] ? x.commits[x.branches[nom]].message : null);

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

// Ligne de statut : une phrase
export function statutTexte(d) {
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

// Relie l'état interactif du dépôt aux éléments DOM d'un conteneur
export function attacherDepot(racine, {
  depart = [],
  solution = [],
  etapes = [],
  sansDepot = false,
  indiceGeneral = "",
  cible = null,
  libre = false,
  onSucces = () => {},
  nomExo = "",
  listeOrdre = ORDRE,
} = {}) {
  const commande = racine.querySelector("#commande, #depot-commande");
  const sortie = racine.querySelector("#sortie, #depot-sortie");
  const verdict = racine.querySelector("#verdict, #depot-verdict");
  const liste = racine.querySelector("#ecarts, #depot-ecarts");
  const etapesEl = racine.querySelector("#etapes, #depot-etapes");
  const indiceEl = racine.querySelector("#indice, #depot-indice");
  const statutEl = racine.querySelector("#statut, #depot-statut");
  const grapheEl = racine.querySelector("#graphe, #depot-graphe");
  const cibleEl = racine.querySelector("#cible, #depot-cible");
  const titreCibleEl = racine.querySelector("#titre-cible, #depot-titre-cible");
  const suivant = racine.querySelector("#suivant, #depot-suivant");
  const formulaire = racine.querySelector("#formulaire, #depot-formulaire");
  const recommencerBtn = racine.querySelector("#recommencer, #depot-recommencer");
  const solutionBtn = racine.querySelector("#solution, #depot-solution");

  let depot = null;
  let precedent = { commits: new Set(), pointeurs: {} };
  let derniereErreur = false;
  let ecartsPrecedents = null;
  let avancement = 0;
  let dejaReussi = false;

  function verifierEtapes() {
    while (depot && avancement < etapes.length && condition(depot, etapes[avancement].condition)) avancement++;
  }

  function afficherEtapes() {
    if (!etapesEl) return;
    etapesEl.hidden = etapes.length === 0;
    etapesEl.innerHTML = etapes
      .map((e, i) => {
        const repere = i < avancement ? "✓" : i === avancement ? "→" : "○";
        const texte = marked.parseInline(e.texte);
        return `<li>${repere} ${i === avancement ? `<b>${texte}</b>` : texte}</li>`;
      })
      .join("");
    if (indiceEl) {
      const enCours = etapes[avancement];
      const indice = enCours && enCours.indice ? enCours.indice : indiceGeneral;
      indiceEl.innerHTML = marked.parse(indice);
    }
  }

  function calculerMarques() {
    if (!depot) return {};
    return {
      commits: new Set(depot.ordre.filter((id) => !precedent.commits.has(id))),
      branches: new Set(Object.keys(depot.branches).filter((nom) => depot.branches[nom] !== precedent.pointeurs[nom])),
    };
  }

  function afficher({ marquer = true } = {}) {
    const marques = marquer ? calculerMarques() : {};
    if (statutEl) statutEl.textContent = statutTexte(depot);
    if (grapheEl) grapheEl.innerHTML = dessinerArbre(depot, marques, cible);
    precedent = instantane(depot);

    const reussi = Boolean(cible && depot && signature(depot) === signature(cible));
    let messages = [];
    if (cible && !depot) messages = ["Il n'y a pas encore de dépôt : lance « git init »."];
    else if (cible && !reussi) messages = ecarts(depot, cible);
    if (cible && !reussi && !messages.length) messages = ["Le graphe n'est pas encore celui attendu."];

    const distance = messages.length + (cible && !depot ? 1 : 0);
    const avance = ecartsPrecedents !== null && distance < ecartsPrecedents;
    ecartsPrecedents = distance;

    if (sortie) sortie.className = derniereErreur ? "mauvais" : avance || reussi ? "bon" : "";
    if (liste) liste.className = derniereErreur && !reussi ? "mauvais" : "";

    verifierEtapes();
    afficherEtapes();

    if (verdict) {
      verdict.className = reussi ? "bon" : "";
      verdict.textContent = reussi ? "Réussi : ton graphe correspond à la cible." : "";
    }
    if (liste) {
      liste.innerHTML = messages.map((m) => `<li>${echapper(m)}</li>`).join("");
    }

    if (suivant) {
      const suite = listeOrdre[listeOrdre.indexOf(nomExo) + 1];
      suivant.hidden = !(reussi && suite && !libre);
      suivant.dataset.exo = suite ?? "";
    }

    if (reussi && !dejaReussi) {
      dejaReussi = true;
      onSucces();
    }
  }

  function recommencer() {
    depot = libre || sansDepot ? null : jouer(nouveauDepot(), depart);
    if (sortie) sortie.textContent = "";
    derniereErreur = false;
    ecartsPrecedents = null;
    avancement = 0;
    dejaReussi = false;
    afficher({ marquer: false });
  }

  if (titreCibleEl) titreCibleEl.hidden = !cible;
  if (cibleEl) {
    cibleEl.hidden = !cible;
    if (cible) cibleEl.innerHTML = dessinerArbre(cible);
  }

  if (formulaire) {
    formulaire.addEventListener("submit", (e) => {
      e.preventDefault();
      const ligne = commande ? commande.value.trim() : "";
      if (!ligne) return;
      if (!depot) {
        if (ligne === "git init") {
          depot = nouveauDepot();
          if (sortie) sortie.textContent = `$ ${ligne}\nDépôt Git vide initialisé dans ce dossier.`;
          derniereErreur = false;
        } else {
          if (sortie) sortie.textContent = `$ ${ligne}\nfatal : pas de dépôt Git ici. Lance « git init » d'abord.`;
          derniereErreur = true;
        }
      } else {
        const resultat = executer(depot, ligne);
        depot = resultat.depot;
        if (sortie) sortie.textContent = `$ ${ligne}\n${resultat.sortie}`;
        derniereErreur = resultat.erreur;
      }
      if (commande) commande.value = "";
      afficher();
    });
  }

  if (recommencerBtn) {
    recommencerBtn.addEventListener("click", recommencer);
  }

  if (solutionBtn) {
    solutionBtn.addEventListener("click", () => {
      depot = jouer(depot ?? nouveauDepot(), solution);
      if (sortie) sortie.textContent = "Solution chargée.";
      derniereErreur = false;
      afficher();
    });
  }

  if (suivant) {
    suivant.addEventListener("click", () => {
      if (suivant.dataset.exo) {
        const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        params.set("exo", suivant.dataset.exo);
        if (typeof window !== "undefined") window.location.search = params.toString();
      }
    });
  }

  recommencer();
}

// Monte le panneau Git dans l'application principale (src/index.html)
export function monterPanneauDepot({
  conteneurGauche,
  conteneurDroite,
  exo,
  nomExo,
  auteur = false,
  onSucces = () => {},
}) {
  conteneurGauche.innerHTML = `
    <section class="carte">
      <h2>Ta mission</h2>
      <div id="depot-enonce"></div>
      <ol id="depot-etapes"></ol>
      <details>
        <summary>Le cours en bref</summary>
        <div id="depot-cours"></div>
      </details>
      <details>
        <summary>Besoin d'un indice ?</summary>
        <div id="depot-indice"></div>
      </details>
    </section>

    <section class="carte">
      <h2>Terminal</h2>
      <form id="depot-formulaire">
        <input id="depot-commande" placeholder="git status" autocomplete="off" aria-label="Commande git">
        <button type="submit">Lancer</button>
        <button type="button" id="depot-recommencer">Recommencer</button>
        <button type="button" id="depot-solution" ${auteur ? "" : "hidden"}>Charger la solution</button>
      </form>
      <pre id="depot-sortie"></pre>
      <p id="depot-verdict"></p>
      <ul id="depot-ecarts"></ul>
    </section>
  `;

  conteneurDroite.innerHTML = `
    <div class="depot-graphes">
      <section class="carte">
        <p id="depot-statut"></p>
      </section>
      <section class="carte">
        <h2>Ton dépôt</h2>
        <div id="depot-graphe"></div>
      </section>
      <section class="carte">
        <h2 id="depot-titre-cible">Ce qu'on attend</h2>
        <div id="depot-cible"></div>
      </section>
    </div>
  `;

  const depart = lireCommandes(exo["Départ"]);
  const solution = lireCommandes(exo["Solution"]);
  const texteBrut = exo.texteBrut ?? "";
  const sansDepot = /^depot:\s*aucun/m.test(texteBrut);
  const etapes = lireEtapes(exo["Étapes"]);
  const indiceGeneral = (exo["Indice"] ?? "").trim();
  const cible = jouer(jouer(nouveauDepot(), depart), solution);

  const enonceEl = conteneurGauche.querySelector("#depot-enonce");
  const coursEl = conteneurGauche.querySelector("#depot-cours");
  if (enonceEl) enonceEl.innerHTML = marked.parse((exo["Énoncé"] ?? "").trim());
  if (coursEl) coursEl.innerHTML = marked.parse((exo["Cours"] ?? "").trim());

  attacherDepot(document.body, {
    depart,
    solution,
    etapes,
    sansDepot,
    indiceGeneral,
    cible,
    libre: false,
    nomExo,
    onSucces,
  });
}

// Mode page autonome pour src/depot.html (par exemple bac à sable ?libre=1)
if (typeof document !== "undefined" && document.getElementById("formulaire") && !document.getElementById("editeur")) {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const LIBRE = params.has("libre");
  const exoChoisi = params.get("exo");
  const EXO = /^[\w/-]+$/.test(exoChoisi || "") ? exoChoisi : "git/visuel/01";
  const auteur = params.has("auteur");

  async function charger() {
    if (LIBRE) {
      document.getElementById("titre").textContent = "Bac à sable";
      document.getElementById("cours").innerHTML = marked.parse(COURS_LIBRE);
      document.getElementById("enonce").textContent = "Pas de consigne : essaie les commandes à ton rythme.";
      document.getElementById("indice").closest("details").hidden = true;

      attacherDepot(document.body, {
        libre: true,
        nomExo: "",
      });
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

    // Récupération de l'ordre dynamique depuis exos/index.json avec repli sur ORDRE
    let listeOrdre = ORDRE;
    try {
      const reponseIndex = await fetch("../exos/index.json");
      if (reponseIndex.ok) {
        const liste = await reponseIndex.json();
        const listeGit = liste.filter((x) => x.startsWith("git/visuel/"));
        if (listeGit.length) listeOrdre = listeGit;
      }
    } catch {
      // Repli sur ORDRE statique si fetch indisponible
    }

    const exo = lireExo(texte);
    const titre = texte.match(/^titre:\s*(.*)$/m)?.[1] ?? EXO;
    const sansDepot = /^depot:\s*aucun/m.test(texte);
    document.getElementById("titre").textContent = titre;
    document.getElementById("cours").innerHTML = marked.parse((exo["Cours"] ?? "").trim());
    document.getElementById("enonce").innerHTML = marked.parse((exo["Énoncé"] ?? "").trim());

    const depart = lireCommandes(exo["Départ"]);
    const solution = lireCommandes(exo["Solution"]);
    const etapes = lireEtapes(exo["Étapes"]);
    const indiceGeneral = (exo["Indice"] ?? "").trim();
    const cible = jouer(jouer(nouveauDepot(), depart), solution);

    if (auteur) document.getElementById("solution").hidden = false;

    attacherDepot(document.body, {
      depart,
      solution,
      etapes,
      sansDepot,
      indiceGeneral,
      cible,
      libre: false,
      nomExo: EXO,
      listeOrdre,
    });
  }

  charger();
}
