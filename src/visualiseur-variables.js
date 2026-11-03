import * as acorn from "https://esm.sh/acorn@8.12.1";

// Panneau « Variables » : pour chaque variable déclarée au niveau du script,
// affiche son nom, sa valeur et si elle est connectée (lue) quelque part.

const panneau = document.getElementById("variables");

// Code ajouté au début du script de l'élève, dans l'aperçu.
// Il envoie chaque valeur au parent avec postMessage.
const AIDE_APERCU = `
window.__visu = (nom, valeur) => {
  const formater = (v) => {
    if (v === undefined) return "undefined";
    if (typeof v === "function") return "fonction";
    try { return JSON.stringify(v) ?? String(v); } catch { return String(v); }
  };
  parent.postMessage({ type: "variable", nom, valeur: formater(valeur) }, "*");
};
`;

// Ajoute les noms lus dans un nœud de l'arbre (pas les noms écrits ni les déclarations)
function lectures(noeud, noms) {
  if (!noeud || typeof noeud.type !== "string") return;
  if (noeud.type === "Identifier") {
    noms.add(noeud.name);
    return;
  }
  if (noeud.type === "VariableDeclarator") return lectures(noeud.init, noms);
  if (
    noeud.type === "AssignmentExpression" &&
    noeud.operator === "=" &&
    noeud.left.type === "Identifier"
  ) {
    return lectures(noeud.right, noms);
  }
  for (const cle of Object.keys(noeud)) {
    if (!noeud.computed && (cle === "key" || cle === "property")) continue;
    const valeur = noeud[cle];
    if (Array.isArray(valeur)) valeur.forEach((enfant) => lectures(enfant, noms));
    else if (valeur && typeof valeur === "object") lectures(valeur, noms);
  }
}

// Analyse le script de l'élève.
// Renvoie le code à exécuter dans l'aperçu, la liste des variables et une erreur éventuelle.
export function analyserScript(code) {
  let programme;
  try {
    programme = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "script",
      locations: true,
    });
  } catch (erreur) {
    return { code: AIDE_APERCU + code, variables: [], erreur: erreur.message };
  }

  const variables = [];
  const declarees = new Set();
  for (const instruction of programme.body) {
    if (instruction.type !== "VariableDeclaration") continue;
    for (const declarateur of instruction.declarations) {
      if (declarateur.id.type !== "Identifier") continue;
      declarees.add(declarateur.id.name);
      variables.push({
        nom: declarateur.id.name,
        ligne: instruction.loc.start.line,
      });
    }
  }

  const lues = new Set();
  lectures(programme, lues);
  for (const variable of variables) {
    variable.connectee = lues.has(variable.nom);
  }

  // Ajoute un appel de suivi après chaque instruction qui déclare ou modifie une variable
  const ajouts = [];
  for (const instruction of programme.body) {
    let noms = [];
    if (instruction.type === "VariableDeclaration") {
      noms = instruction.declarations
        .filter((d) => d.id.type === "Identifier")
        .map((d) => d.id.name);
    } else if (
      instruction.type === "ExpressionStatement" &&
      instruction.expression.type === "AssignmentExpression" &&
      instruction.expression.operator === "=" &&
      instruction.expression.left.type === "Identifier" &&
      declarees.has(instruction.expression.left.name)
    ) {
      noms = [instruction.expression.left.name];
    }
    if (noms.length === 0) continue;
    const appels = noms.map((nom) => `;__visu("${nom}", ${nom});`).join("");
    ajouts.push({ position: instruction.end, texte: appels });
  }

  let instrumente = code;
  for (const ajout of ajouts.reverse()) {
    instrumente =
      instrumente.slice(0, ajout.position) + ajout.texte + instrumente.slice(ajout.position);
  }

  return { code: AIDE_APERCU + instrumente, variables, erreur: null };
}

// Dessine une carte par variable, en attendant les valeurs
export function afficherVariables(analyse) {
  panneau.replaceChildren();

  if (analyse.erreur) {
    const message = document.createElement("p");
    message.className = "message";
    message.textContent = "Code incomplet : le panneau attend un script valide.";
    panneau.append(message);
    return;
  }

  for (const variable of analyse.variables) {
    const carte = document.createElement("div");
    carte.className = "variable " + (variable.connectee ? "connectee" : "non-connectee");
    carte.dataset.nom = variable.nom;

    const nom = document.createElement("strong");
    nom.textContent = variable.nom;

    const valeur = document.createElement("span");
    valeur.className = "valeur";
    valeur.textContent = "—";

    const etat = document.createElement("small");
    etat.textContent =
      (variable.connectee ? "connectée" : "non connectée") + " · ligne " + variable.ligne;

    carte.append(nom, " = ", valeur, " ", etat);
    panneau.append(carte);
  }
}

// Met à jour la valeur affichée quand l'aperçu envoie une nouvelle valeur
export function ecouterValeurs(apercu) {
  window.addEventListener("message", (e) => {
    if (e.source !== apercu.contentWindow || e.data.type !== "variable") return;
    const carte = panneau.querySelector(`[data-nom="${e.data.nom}"]`);
    if (!carte) return;
    carte.querySelector(".valeur").textContent = e.data.valeur;
  });
}
