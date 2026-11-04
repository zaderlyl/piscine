// Dépôt Git simulé : pas de vrai Git, seulement de quoi montrer le graphe.
// Niveaux 1 à 7 : status, add, commit, log, branch, switch, merge (avec conflits), restore,
// reset, revert, remote, push, fetch, pull, et gh pr (pull request simulée).
// Les lignes « edit » et « autre-dev » ne servent qu'aux scripts des exos (executerScript).

// Un dépôt :
// - commits : identifiant → { id, message, parents, fichiers (modifiés dans ce commit), contenu (fichier → version) }
// - branches : nom → commit (les branches « origin/… » sont les copies locales du dépôt distant)
// - head : branche courante ; travail : fichiers modifiés ; index : fichiers prêts à être enregistrés
// - ordre : commits affichés, du plus ancien au plus récent ; compteur : sert à donner les identifiants
// - fusion : fusion en cours avec conflits ; distant : branches du dépôt distant « origin » (null = pas ajouté)
// - suivi : branches suivies (push -u) ; prs : pull requests simulées
export function nouveauDepot() {
  return {
    commits: {},
    branches: { main: null },
    head: "main",
    travail: ["index.html", "style.css"],
    index: [],
    ordre: [],
    compteur: 0,
    fusion: null,
    distant: null,
    suivi: {},
    prs: [],
  };
}

const HORS_NIVEAU = ["rebase", "stash", "cherry-pick", "tag", "bisect"];

// Exécute une commande tapée par l'élève. Renvoie le nouveau dépôt, le texte affiché et si c'est une erreur.
export function executer(depot, ligne) {
  const neuf = structuredClone(depot);
  const mots = ligne.trim().split(/\s+/);
  if (mots[0] === "edit" || mots[0] === "autre-dev") {
    return { depot, sortie: "Cette ligne ne sert qu'au script de l'exo.", erreur: true };
  }
  if (mots[0] !== "git" && mots[0] !== "gh") {
    return { depot, sortie: "Commande inconnue : une commande commence par « git » ou « gh ».", erreur: true };
  }
  const [, sous, ...args] = mots;
  const resultat = (sortie, erreur = false) => ({ depot: erreur ? depot : neuf, sortie, erreur });

  if (mots[0] === "gh") return ghCommande(neuf, mots.slice(1), resultat);
  if (HORS_NIVEAU.includes(sous)) {
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
    case "restore":
      return restaurer(neuf, args, resultat);
    case "reset":
      return reinitialiser(neuf, args, resultat);
    case "revert":
      return annuler(neuf, args, resultat);
    case "remote":
      return depotDistant(neuf, args, resultat);
    case "push":
      return pousser(neuf, args, resultat);
    case "fetch":
      return recuperer(neuf, resultat);
    case "pull":
      return tirer(neuf, resultat);
    default:
      return resultat(`« ${sous ?? ""} » n'est pas une commande reconnue.`, true);
  }
}

// Lignes de script des exos : « edit fichier » modifie un fichier ; « autre-dev push "msg" » ajoute un commit sur origin.
export function executerScript(depot, ligne) {
  const texte = ligne.trim();
  const mots = texte.split(/\s+/);
  const neuf = structuredClone(depot);
  if (mots[0] === "edit") {
    const f = mots[1];
    if (!neuf.travail.includes(f) && !neuf.index.includes(f)) neuf.travail.push(f);
    return { depot: neuf, sortie: "", erreur: false };
  }
  if (mots[0] === "autre-dev") {
    const message = texte.match(/"([^"]*)"/)?.[1] ?? "Autre commit";
    autreDev(neuf, message);
    return { depot: neuf, sortie: "", erreur: false };
  }
  return executer(depot, ligne);
}

// Un autre élève publie un commit sur origin (sans passer par notre dépôt local)
function autreDev(d, message) {
  if (!d.distant) return;
  const parent = d.distant.main ?? null;
  const id = creerCommit(d, message, parent ? [parent] : [], null, []);
  d.ordre = d.ordre.filter((x) => x !== id);
  d.distant.main = id;
}

function nouvelId(depot) {
  depot.compteur += 1;
  return (0x1a3f00 + depot.compteur).toString(16);
}

// Crée un commit et l'ajoute à l'ordre. Ne touche pas aux branches : c'est à l'appelant de le faire.
function creerCommit(d, message, parents, contenuFixe, fichiers) {
  const id = nouvelId(d);
  const contenu = contenuFixe ? { ...contenuFixe } : parents[0] ? { ...d.commits[parents[0]].contenu } : {};
  for (const f of fichiers) contenu[f] = id;
  d.commits[id] = { id, message, parents, fichiers, contenu };
  d.ordre.push(id);
  return id;
}

function statut(depot) {
  const lignes = [`Sur la branche ${depot.head}`];
  if (depot.fusion) {
    lignes.push(`Fusion de « ${depot.fusion.de} » en cours.`);
    if (depot.fusion.conflits.length) lignes.push(`Conflits à résoudre : ${depot.fusion.conflits.join(", ")}`);
    else lignes.push("Tous les conflits sont résolus : fais git commit.");
  }
  if (depot.index.length) lignes.push(`Modifications prêtes à être enregistrées : ${depot.index.join(", ")}`);
  if (depot.travail.length) lignes.push(`Modifications non indexées : ${depot.travail.join(", ")}`);
  if (!depot.index.length && !depot.travail.length && !depot.fusion) {
    lignes.push("rien à enregistrer, la copie de travail est propre");
  }
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
  if (depot.fusion) depot.fusion.conflits = depot.fusion.conflits.filter((f) => !fichiers.includes(f));
  return resultat("");
}

function commit(depot, ligne, resultat) {
  const m = ligne.match(/-m\s+"([^"]*)"|-m\s+'([^']*)'/);
  const message = m ? (m[1] ?? m[2]) : null;

  if (depot.fusion) {
    const { de, autre, conflits, contenu, tous } = depot.fusion;
    if (conflits.length) {
      return resultat(`Conflit non résolu : ${conflits.join(", ")}. Corrige-le, puis ajoute-le avec git add.`, true);
    }
    const actuel = depot.branches[depot.head];
    const id = creerCommit(depot, message ?? `Fusionne « ${de} »`, [actuel, autre], contenu, tous);
    depot.branches[depot.head] = id;
    depot.index = [];
    depot.fusion = null;
    return resultat(`[${depot.head} ${id}] ${depot.commits[id].message}`);
  }

  if (!message) return resultat("Il faut un message : git commit -m \"...\"", true);
  if (!depot.index.length) return resultat("rien à enregistrer : utilise git add d'abord.", true);
  const parent = depot.branches[depot.head];
  const id = creerCommit(depot, message, parent ? [parent] : [], null, [...depot.index]);
  depot.branches[depot.head] = id;
  depot.index = [];
  return resultat(`[${depot.head} ${id}] ${message}`);
}

// Tous les commits accessibles depuis un commit (lui compris)
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

// Le commit commun le plus récent à deux branches
function ancetreCommun(depot, a, b) {
  const sb = ancetres(depot, b);
  let meilleur = null;
  let position = -1;
  for (const id of ancetres(depot, a)) {
    if (!sb.has(id)) continue;
    const p = depot.ordre.indexOf(id);
    if (p > position) {
      position = p;
      meilleur = id;
    }
  }
  return meilleur;
}

// Fusion des contenus de deux commits : un fichier modifié d'un seul côté prend cette version ;
// modifié des deux côtés différemment, c'est un conflit.
function fusionnerContenus(depot, a, b) {
  const base = ancetreCommun(depot, a, b);
  const ca = depot.commits[a].contenu;
  const cb = depot.commits[b].contenu;
  const cbase = base ? depot.commits[base].contenu : {};
  const contenu = {};
  const conflits = [];
  for (const f of new Set([...Object.keys(ca), ...Object.keys(cb)])) {
    const o = ca[f];
    const t = cb[f];
    const avant = cbase[f];
    if (o === t) {
      if (o !== undefined) contenu[f] = o;
    } else if (o === avant) {
      if (t !== undefined) contenu[f] = t;
    } else if (t === avant) {
      if (o !== undefined) contenu[f] = o;
    } else {
      conflits.push(f);
      contenu[f] = o ?? t;
    }
  }
  return { contenu, conflits };
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
    .filter((nom) => !nom.startsWith("origin/"))
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
  if (nom.startsWith("origin/")) return resultat("HEAD détaché : pas encore au programme.", true);
  depot.head = nom;
  return resultat(`Basculement sur la branche « ${nom} »`);
}

// Fusion de la branche donnée dans la branche courante.
// Avance rapide si la courante est un ancêtre de l'autre ; sinon fusion à trois, qui peut créer des conflits.
function fusionner(depot, args, resultat) {
  if (args[0] === "--abort") {
    if (!depot.fusion) return resultat("Aucune fusion en cours.", true);
    depot.fusion = null;
    depot.index = [];
    return resultat("Fusion annulée.");
  }
  if (depot.fusion) {
    return resultat("Une fusion est déjà en cours : termine-la avec git commit, ou annule-la avec git merge --abort.", true);
  }
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

  const { contenu, conflits } = fusionnerContenus(depot, actuel, autre);
  if (conflits.length) {
    depot.fusion = { de: nom, autre, conflits: [...conflits], tous: [...conflits], contenu };
    depot.travail = [...new Set([...depot.travail, ...conflits])];
    return {
      depot,
      sortie: `CONFLIT (contenu) dans : ${conflits.join(", ")}\nCorrige ces fichiers, ajoute-les avec git add, puis fais git commit.`,
      erreur: true,
    };
  }
  const id = creerCommit(depot, `Fusionne « ${nom} »`, [actuel, autre], contenu, []);
  depot.branches[depot.head] = id;
  return resultat(`Fusion faite : [${depot.head} ${id}] Fusionne « ${nom} »`);
}

// git restore f : annule la modification de f. git restore --staged f : sort f de la zone de préparation.
function restaurer(depot, args, resultat) {
  if (args[0] === "--staged") {
    const f = args[1];
    if (!f) return resultat("Précise le fichier, par exemple : git restore --staged style.css", true);
    if (!depot.index.includes(f)) return resultat(`« ${f} » n'est pas dans la zone de préparation.`, true);
    depot.index = depot.index.filter((x) => x !== f);
    depot.travail.push(f);
    return resultat(`« ${f} » sorti de la zone de préparation.`);
  }
  const f = args[0];
  if (!f) return resultat("Précise le fichier à restaurer, par exemple : git restore style.css", true);
  if (!depot.travail.includes(f)) return resultat(`« ${f} » n'a pas de modification à annuler.`, true);
  depot.travail = depot.travail.filter((x) => x !== f);
  return resultat(`« ${f} » restauré : ses modifications sont annulées.`);
}

// git reset --soft HEAD~n : recule la branche, les modifications restent prêtes (zone de préparation).
// git reset HEAD~n (mixte) : recule la branche, les modifications deviennent non indexées.
function reinitialiser(depot, args, resultat) {
  if (args.includes("--hard")) return resultat("« --hard » n'est pas encore au programme : il efface des modifications.", true);
  const mode = args.includes("--soft") ? "soft" : "mixed";
  const cible = args.find((a) => /^HEAD(~\d+)?$/.test(a));
  if (!cible) return resultat("Précise le commit, par exemple : git reset --soft HEAD~1", true);
  const n = cible === "HEAD" ? 0 : Number(cible.split("~")[1]);

  let id = depot.branches[depot.head];
  if (!id) return resultat("Il n'y a pas de commit à annuler.", true);
  const annules = [];
  for (let i = 0; i < n; i++) {
    annules.push(id);
    id = depot.commits[id].parents[0];
    if (!id) return resultat("Impossible : il n'y a pas assez de commits.", true);
  }

  const fichiers = annules.flatMap((c) => depot.commits[c].fichiers);
  if (mode === "soft") {
    depot.index = [...new Set([...depot.index, ...fichiers])];
  } else {
    depot.travail = [...new Set([...depot.travail, ...depot.index, ...fichiers])];
    depot.index = [];
  }
  depot.branches[depot.head] = id;
  nettoyer(depot);
  return resultat(`HEAD est maintenant sur « ${depot.head} » (reset ${mode}).`);
}

// Retire les commits qu'aucune branche ni aucun dépôt distant n'atteint (après un reset)
function nettoyer(depot) {
  const racines = [
    ...Object.values(depot.branches),
    ...Object.values(depot.distant ?? {}),
    ...(depot.fusion ? [depot.fusion.autre] : []),
  ].filter(Boolean);
  const vivants = new Set();
  for (const r of racines) for (const id of ancetres(depot, r)) vivants.add(id);
  for (const id of Object.keys(depot.commits)) if (!vivants.has(id)) delete depot.commits[id];
  depot.ordre = depot.ordre.filter((id) => vivants.has(id));
}

// git revert HEAD : nouveau commit qui annule le dernier commit, sans effacer l'historique
function annuler(depot, args, resultat) {
  if (args[0] !== "HEAD") return resultat("Précise le commit à annuler : git revert HEAD", true);
  const id = depot.branches[depot.head];
  if (!id) return resultat("Rien à annuler.", true);
  const c = depot.commits[id];
  if (!c.parents[0]) return resultat("Impossible d'annuler le premier commit dans ce module.", true);
  const parent = depot.commits[c.parents[0]];
  const contenu = { ...c.contenu };
  for (const f of c.fichiers) {
    if (f in parent.contenu) contenu[f] = parent.contenu[f];
    else delete contenu[f];
  }
  const nouveau = creerCommit(depot, `Revert « ${c.message} »`, [id], contenu, []);
  depot.branches[depot.head] = nouveau;
  return resultat(`[${depot.head} ${nouveau}] Revert « ${c.message} »`);
}

// Le dépôt distant « origin » : ajout, puis branches envoyées avec push
function depotDistant(depot, args, resultat) {
  if (!args.length) return resultat(depot.distant ? "origin" : "(aucun dépôt distant)");
  if (args[0] === "add") {
    if (args[1] !== "origin") return resultat("Ce module ne connaît que « origin ».", true);
    if (depot.distant) return resultat("fatal : le dépôt distant « origin » existe déjà.", true);
    depot.distant = {};
    return resultat("Dépôt distant « origin » ajouté.");
  }
  return resultat(`« remote ${args[0]} » n'est pas encore au programme.`, true);
}

function pousser(depot, args, resultat) {
  if (!depot.distant) return resultat("fatal : aucun dépôt distant. Ajoute-le avec git remote add origin <adresse>.", true);
  const suivi = args.includes("-u");
  const restants = args.filter((a) => a !== "-u");
  if (restants[0] === "origin") restants.shift();
  const nom = restants[0] ?? depot.head;
  const local = depot.branches[nom];
  if (!local) return resultat(`fatal : la branche « ${nom} » n'existe pas.`, true);
  const surDistant = depot.distant[nom];
  if (surDistant === local) return resultat("Déjà à jour.");
  if (surDistant && !ancetres(depot, local).has(surDistant)) {
    return resultat(`rejected : « ${nom} » contient des commits que tu n'as pas. Récupère-les (git fetch), puis fusionne-les.`, true);
  }
  depot.distant[nom] = local;
  depot.branches[`origin/${nom}`] = local;
  if (suivi) depot.suivi[nom] = true;
  return resultat(`Envoi de « ${nom} » vers origin.`);
}

// Ajoute au graphe local les commits que la branche distante atteint
function integrer(depot, id) {
  for (const c of ancetres(depot, id)) if (!depot.ordre.includes(c)) depot.ordre.push(c);
  depot.ordre.sort((a, b) => parseInt(a, 16) - parseInt(b, 16));
}

// Met à jour les copies origin/… ; renvoie true si quelque chose a changé
function actualiserDistant(depot) {
  let change = false;
  for (const [nom, id] of Object.entries(depot.distant)) {
    if (depot.branches[`origin/${nom}`] !== id) {
      depot.branches[`origin/${nom}`] = id;
      integrer(depot, id);
      change = true;
    }
  }
  return change;
}

function recuperer(depot, resultat) {
  if (!depot.distant) return resultat("fatal : aucun dépôt distant.", true);
  return resultat(actualiserDistant(depot) ? "Récupération faite depuis origin." : "Déjà à jour.");
}

// git pull : récupère origin/<branche> puis fusionne-la dans la branche courante
function tirer(depot, resultat) {
  if (!depot.distant) return resultat("fatal : aucun dépôt distant.", true);
  if (!depot.suivi[depot.head]) {
    return resultat(`Aucune branche suivie pour « ${depot.head} ». Envoie-la d'abord : git push -u origin ${depot.head}`, true);
  }
  actualiserDistant(depot);
  const distante = `origin/${depot.head}`;
  if (!depot.branches[distante]) return resultat(`Rien à récupérer : « ${distante} » n'existe pas.`, true);
  return fusionner(depot, [distante], resultat);
}

// Commandes gh pr : pull request simulée (ouverte, relue, fusionnée sur origin)
function ghCommande(depot, args, resultat) {
  if (args[0] !== "pr") return resultat(`« gh ${args[0] ?? ""} » n'est pas encore au programme.`, true);
  const action = args[1];
  const ouverte = depot.prs.find((p) => p.de === depot.head && p.etat === "ouverte");

  if (action === "create") {
    if (!depot.distant?.[depot.head]) {
      return resultat(`fatal : la branche « ${depot.head} » n'est pas sur origin. Envoie-la d'abord.`, true);
    }
    if (ouverte) return resultat("Une pull request est déjà ouverte pour cette branche.", true);
    depot.prs.push({ de: depot.head, vers: "main", etat: "ouverte", approuvee: false });
    return resultat(`Pull request ouverte : ${depot.head} → main`);
  }

  if (action === "review") {
    if (!ouverte) return resultat("Pas de pull request ouverte pour cette branche.", true);
    ouverte.approuvee = true;
    return resultat(`Pull request « ${depot.head} → main » approuvée.`);
  }

  if (action === "merge") {
    if (!ouverte) return resultat("Pas de pull request ouverte pour cette branche.", true);
    if (!ouverte.approuvee) return resultat("Relis la pull request avant de la fusionner : gh pr review --approve", true);
    const source = depot.distant[ouverte.de];
    const cible = depot.distant[ouverte.vers];
    if (!cible || ancetres(depot, source).has(cible)) {
      depot.distant[ouverte.vers] = source;
    } else if (!ancetres(depot, cible).has(source)) {
      const { contenu, conflits } = fusionnerContenus(depot, cible, source);
      if (conflits.length) {
        return resultat(`Conflit sur origin : ${conflits.join(", ")}. Résous-le en local, puis renvoie la branche.`, true);
      }
      depot.distant[ouverte.vers] = creerCommit(depot, `Fusionne « ${ouverte.de} »`, [cible, source], contenu, []);
      depot.ordre = depot.ordre.filter((x) => x !== depot.distant[ouverte.vers]);
    }
    ouverte.etat = "fusionnée";
    return resultat(`Pull request fusionnée sur origin dans « ${ouverte.vers} ».`);
  }

  return resultat("Action inconnue : gh pr create, gh pr review --approve, gh pr merge.", true);
}

// Ce qui compte pour réussir : la forme du graphe, les copies distantes et l'état des fichiers.
// Les identifiants et l'ordre des branches ne comptent pas.
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
  const distants = Object.keys(depot.distant ?? {})
    .sort()
    .map((nom) => [nom, sig(depot.distant[nom])]);
  return JSON.stringify({
    commits: Object.keys(depot.commits).map((id) => sig(id)).sort(),
    branches,
    distants,
    head: depot.head,
    travail: [...depot.travail].sort(),
    index: [...depot.index].sort(),
  });
}

// Ce qui sépare le dépôt de la cible, en phrases simples (vide si c'est bon).
export function ecarts(depot, cible) {
  const messages = [];
  const nb = (d) => Object.keys(d.commits).length;
  const manque = nb(cible) - nb(depot);
  if (manque > 0) messages.push(`Il manque ${manque} commit${manque > 1 ? "s" : ""}.`);
  if (manque < 0) messages.push(`Il y a ${-manque} commit${manque < -1 ? "s" : ""} de trop.`);

  const pointe = (d, id) => (id ? d.commits[id].message : null);
  for (const nom of Object.keys(cible.branches)) {
    if (!(nom in depot.branches)) {
      messages.push(`La branche « ${nom} » n'existe pas encore.`);
      continue;
    }
    if (pointe(depot, depot.branches[nom]) !== pointe(cible, cible.branches[nom])) {
      messages.push(`La branche « ${nom} » ne pointe pas au bon commit.`);
    }
  }
  for (const nom of Object.keys(cible.distant ?? {})) {
    if (!depot.distant) {
      messages.push("Le dépôt distant « origin » n'est pas ajouté.");
      break;
    }
    if (pointe(depot, depot.distant[nom]) !== pointe(cible, cible.distant[nom])) {
      messages.push(`origin ne contient pas le bon commit pour « ${nom} ».`);
    }
  }
  if (depot.head !== cible.head) messages.push(`Tu devrais être sur la branche « ${cible.head} ».`);
  if (cible.fusion === null && depot.fusion) messages.push("Une fusion est encore en cours.");
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
