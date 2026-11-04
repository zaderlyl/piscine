// Dépôt Git simulé : pas de vrai Git, seulement de quoi montrer le graphe.
// Niveaux 1 à 3 : status, add, commit, log, branch, switch, switch -c, checkout -b, merge.

// Un dépôt : commits (par identifiant), branches (nom → commit), head (nom de la branche courante),
// travail (fichiers modifiés), index (fichiers prêts à être enregistrés), ordre (ordre de création).
export function nouveauDepot() {
  return {
    commits: {},
    branches: { main: null },
    head: "main",
    travail: ["index.html", "style.css"],
    index: [],
    ordre: [],
  };
}

const COMMANDES_HORS_NIVEAU = ["rebase", "reset", "restore", "revert", "remote", "push", "pull", "fetch"];

// Exécute une ligne « git … ». Renvoie le nouveau dépôt, le texte affiché et si c'est une erreur.
export function executer(depot, ligne) {
  const neuf = structuredClone(depot);
  const mots = ligne.trim().split(/\s+/);
  if (mots[0] !== "git") {
    return { depot, sortie: "Commande inconnue : une commande commence par « git ».", erreur: true };
  }
  const [, sous, ...args] = mots;
  const resultat = (sortie, erreur = false) => ({ depot: erreur ? depot : neuf, sortie, erreur });

  if (COMMANDES_HORS_NIVEAU.includes(sous)) {
    return resultat(`« ${sous} » n'est pas encore au programme de ce module.`, true);
  }
  switch (sous) {
    case "init":
      return resultat("Dépôt Git déjà présent ici.");
    case "status":
      return resultat(statut(neuf));
    case "add":
      return add(neuf, args, resultat);
    case "commit":
      return commit(neuf, ligne, resultat);
    case "log":
      return resultat(journal(neuf));
    case "branch":
      return args.length ? creerBranche(neuf, args[0], resultat) : resultat(listeBranches(neuf));
    case "switch":
      if (args[0] === "-c") return creerBranche(neuf, args[1], resultat, true);
      return changerBranche(neuf, args[0], resultat);
    case "checkout":
      if (args[0] === "-b") return creerBranche(neuf, args[1], resultat, true);
      return changerBranche(neuf, args[0], resultat);
    case "merge":
      return fusionner(neuf, args, resultat);
    default:
      return resultat(`« ${sous ?? ""} » n'est pas une commande reconnue.`, true);
  }
}

function statut(depot) {
  const lignes = [`Sur la branche ${depot.head}`];
  if (depot.index.length) lignes.push(`Modifications prêtes à être enregistrées : ${depot.index.join(", ")}`);
  if (depot.travail.length) lignes.push(`Modifications non indexées : ${depot.travail.join(", ")}`);
  if (!depot.index.length && !depot.travail.length) lignes.push("rien à enregistrer, la copie de travail est propre");
  return lignes.join("\n");
}

function add(depot, args, resultat) {
  if (!args.length) return resultat("Précise les fichiers à ajouter, ou « . » pour tous.", true);
  const fichiers = args[0] === "." ? [...depot.travail] : args;
  for (const fichier of fichiers) {
    if (!depot.travail.includes(fichier)) {
      return resultat(`fatal : le chemin « ${fichier} » ne correspond à aucun fichier modifié.`, true);
    }
  }
  depot.travail = depot.travail.filter((f) => !fichiers.includes(f));
  depot.index.push(...fichiers.filter((f) => !depot.index.includes(f)));
  return resultat("");
}

// Identifiant du prochain commit, dans l'ordre de création
function nouvelId(depot) {
  return (0x1a3f00 + depot.ordre.length + 1).toString(16);
}

function commit(depot, ligne, resultat) {
  const m = ligne.match(/-m\s+"([^"]*)"|-m\s+'([^']*)'/);
  if (!m) return resultat("Il faut un message : git commit -m \"...\"", true);
  if (!depot.index.length) {
    return resultat("rien à enregistrer : utilise git add d'abord.", true);
  }
  const message = m[1] ?? m[2];
  const id = nouvelId(depot);
  const parent = depot.branches[depot.head];
  depot.commits[id] = { id, message, parents: parent ? [parent] : [], fichiers: [...depot.index] };
  depot.ordre.push(id);
  depot.branches[depot.head] = id;
  depot.index = [];
  return resultat(`[${depot.head} ${id}] ${message}`);
}

// Tous les commits accessibles depuis la branche courante (y compris ceux qui viennent d'une fusion)
function ancetres(depot, id) {
  const vus = new Set();
  const pile = id ? [id] : [];
  while (pile.length) {
    const courant = pile.pop();
    if (vus.has(courant)) continue;
    vus.add(courant);
    pile.push(...depot.commits[courant].parents);
  }
  return vus;
}

function journal(depot) {
  const tete = depot.branches[depot.head];
  if (!tete) return "Aucun commit pour l'instant.";
  const accessibles = ancetres(depot, tete);
  return [...depot.ordre]
    .reverse()
    .filter((id) => accessibles.has(id))
    .map((id) => `commit ${id}${etiquettes(depot, id)}\n    ${depot.commits[id].message}`)
    .join("\n\n");
}

// Étiquettes d'un commit : branches qui pointent dessus, et HEAD si c'est la branche courante.
function etiquettes(depot, id) {
  const noms = Object.keys(depot.branches).filter((nom) => depot.branches[nom] === id);
  if (!noms.length) return "";
  const liste = noms.map((nom) => (nom === depot.head ? `HEAD -> ${nom}` : nom));
  return ` (${liste.join(", ")})`;
}

function listeBranches(depot) {
  return Object.keys(depot.branches)
    .map((nom) => (nom === depot.head ? `* ${nom}` : `  ${nom}`))
    .join("\n");
}

function creerBranche(depot, nom, resultat, changer = false) {
  if (!nom) return resultat("Il faut un nom de branche.", true);
  if (nom in depot.branches) return resultat(`fatal : la branche « ${nom} » existe déjà.`, true);
  depot.branches[nom] = depot.branches[depot.head];
  if (changer) depot.head = nom;
  return resultat(changer ? `Basculement sur la nouvelle branche « ${nom} »` : "");
}

function changerBranche(depot, nom, resultat) {
  if (!(nom in depot.branches)) return resultat(`fatal : la branche « ${nom} » n'existe pas.`, true);
  depot.head = nom;
  return resultat(`Basculement sur la branche « ${nom} »`);
}

// Fusion de la branche donnée dans la branche courante.
// Avance rapide si la courante est un ancêtre de l'autre ; sinon fusion à trois (commit à deux parents).
function fusionner(depot, args, resultat) {
  const nom = args[0];
  if (!nom) return resultat("Précise la branche à fusionner, par exemple : git merge menu", true);
  if (!(nom in depot.branches)) return resultat(`merge : « ${nom} » n'est pas une branche.`, true);
  if (nom === depot.head) return resultat(`Impossible de fusionner « ${nom} » dans elle-même.`, true);
  if (depot.index.length) {
    return resultat("Enregistre d'abord tes modifications (add, commit) avant de fusionner.", true);
  }
  const autre = depot.branches[nom];
  const actuel = depot.branches[depot.head];
  if (!autre || ancetres(depot, actuel).has(autre)) return resultat("Déjà à jour.");

  if (!actuel || ancetres(depot, autre).has(actuel)) {
    depot.branches[depot.head] = autre;
    return resultat(`Fusion en avance rapide : « ${depot.head} » avance jusqu'au commit de « ${nom} ».`);
  }

  const id = nouvelId(depot);
  depot.commits[id] = { id, message: `Fusionne « ${nom} »`, parents: [actuel, autre], fichiers: [] };
  depot.ordre.push(id);
  depot.branches[depot.head] = id;
  return resultat(`Fusion faite : [${depot.head} ${id}] Fusionne « ${nom} »`);
}

// Ce qui compte pour réussir : la forme du graphe. Les identifiants et l'ordre des branches ne comptent pas.
export function signature(depot) {
  const memo = {};
  const sig = (id) => {
    if (!id) return "∅";
    if (!memo[id]) {
      const c = depot.commits[id];
      memo[id] = `${c.message}(${c.parents.map(sig).join(",")})`;
    }
    return memo[id];
  };
  const branches = Object.keys(depot.branches)
    .sort()
    .map((nom) => [nom, sig(depot.branches[nom])]);
  return JSON.stringify({
    commits: Object.keys(depot.commits).map((id) => sig(id)).sort(),
    branches,
    head: depot.head,
  });
}

// Ce qui sépare le dépôt de la cible, en phrases simples (vide si c'est bon).
export function ecarts(depot, cible) {
  const messages = [];
  const nb = (d) => Object.keys(d.commits).length;
  const manque = nb(cible) - nb(depot);
  if (manque > 0) messages.push(`Il manque ${manque} commit${manque > 1 ? "s" : ""}.`);
  if (manque < 0) messages.push(`Il y a ${-manque} commit${manque < -1 ? "s" : ""} de trop.`);

  for (const nom of Object.keys(cible.branches)) {
    if (!(nom in depot.branches)) {
      messages.push(`La branche « ${nom} » n'existe pas encore.`);
      continue;
    }
    const pointe = (d, id) => (id ? d.commits[id].message : null);
    if (pointe(depot, depot.branches[nom]) !== pointe(cible, cible.branches[nom])) {
      messages.push(`La branche « ${nom} » ne pointe pas au bon commit.`);
    }
  }
  if (depot.head !== cible.head) messages.push(`Tu devrais être sur la branche « ${cible.head} ».`);
  return messages;
}

// Affichage texte du graphe : un commit par ligne, du plus récent au plus ancien.
export function rendre(depot) {
  if (!depot.ordre.length) return "(aucun commit)";
  return [...depot.ordre]
    .reverse()
    .map((id) => `* ${id} ${depot.commits[id].message}${etiquettes(depot, id)}`)
    .join("\n");
}
