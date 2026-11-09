// Protection anti-boucle infinie pour l'aperçu et les tests.
// Détecte les boucles (while, for, do...while) et insère un garde d'exécution
// qui interrompt la boucle si elle tourne plus de 3 secondes.

export const DELAI_BOUCLE_MS = 3000;
export const DELAI_TESTS_MS = 4000;
export const MESSAGE_BOUCLE_TROP_LONGUE =
  "L'exécution a pris trop de temps (vérifie tes boucles)";

export const GARDE_BOUCLE_CODE = `
window.__boucles = {};
window.__verifierBoucle = function (id) {
  const b = window.__boucles[id] || (window.__boucles[id] = { debut: Date.now(), dernier: Date.now(), cpt: 0 });
  if ((++b.cpt & 511) === 0) {
    const mnt = Date.now();
    if (mnt - b.dernier > 200) {
      b.debut = mnt;
    }
    b.dernier = mnt;
    if (mnt - b.debut > ${DELAI_BOUCLE_MS}) {
      delete window.__boucles[id];
      throw new Error("${MESSAGE_BOUCLE_TROP_LONGUE}");
    }
  }
};
function __verifierBoucle(id) {
  window.__verifierBoucle(id);
}
`;

// Transforme un code JavaScript en insérant __verifierBoucle(id) dans chaque boucle (while, for, do...while)
export function protegerBoucles(code) {
  if (!code || typeof code !== "string") return "";

  let resultat = "";
  let i = 0;
  const n = code.length;
  let boucleId = 0;

  const attentesDo = [];
  let attendWhileImmediat = false;
  let profondeurAccoladesGlobale = 0;

  function estCaractereIdentifiant(c) {
    return /[a-zA-Z0-9_$]/.test(c);
  }

  function trouverFinParenthèses(debut) {
    let profondeur = 1;
    let j = debut;
    while (j < n && profondeur > 0) {
      const c = code[j];
      if (c === "(") {
        profondeur++;
        j++;
      } else if (c === ")") {
        profondeur--;
        j++;
      } else if (c === '"' || c === "'") {
        j = sauterChaine(j);
      } else if (c === "`") {
        j = sauterTemplate(j);
      } else if (c === "/" && code[j + 1] === "/") {
        j = sauterCommentaireLigne(j);
      } else if (c === "/" && code[j + 1] === "*") {
        j = sauterCommentaireBloc(j);
      } else {
        j++;
      }
    }
    return j;
  }

  function sauterChaine(debut) {
    const quote = code[debut];
    let j = debut + 1;
    while (j < n) {
      if (code[j] === "\\") {
        j += 2;
      } else if (code[j] === quote) {
        return j + 1;
      } else {
        j++;
      }
    }
    return j;
  }

  function sauterTemplate(debut) {
    let j = debut + 1;
    while (j < n) {
      if (code[j] === "\\") {
        j += 2;
      } else if (code[j] === "$" && code[j + 1] === "{") {
        j += 2;
        let accolades = 1;
        while (j < n && accolades > 0) {
          if (code[j] === "{") accolades++;
          else if (code[j] === "}") accolades--;
          else if (code[j] === '"' || code[j] === "'") j = sauterChaine(j) - 1;
          else if (code[j] === "`") j = sauterTemplate(j) - 1;
          j++;
        }
      } else if (code[j] === "`") {
        return j + 1;
      } else {
        j++;
      }
    }
    return j;
  }

  function sauterCommentaireLigne(debut) {
    let j = debut + 2;
    while (j < n && code[j] !== "\n") j++;
    return j;
  }

  function sauterCommentaireBloc(debut) {
    let j = debut + 2;
    while (j < n && !(code[j] === "*" && code[j + 1] === "/")) j++;
    return j < n ? j + 2 : n;
  }

  function sauterEspacesEtCommentaires(debut) {
    let j = debut;
    while (j < n) {
      if (/\s/.test(code[j])) {
        j++;
      } else if (code[j] === "/" && code[j + 1] === "/") {
        j = sauterCommentaireLigne(j);
      } else if (code[j] === "/" && code[j + 1] === "*") {
        j = sauterCommentaireBloc(j);
      } else {
        break;
      }
    }
    return j;
  }

  function trouverFinInstruction(debut) {
    let j = debut;
    let parenthèses = 0;
    let crochets = 0;
    let accolades = 0;
    while (j < n) {
      const c = code[j];
      if (c === "(") parenthèses++;
      else if (c === ")") parenthèses--;
      else if (c === "[") crochets++;
      else if (c === "]") crochets--;
      else if (c === "{") accolades++;
      else if (c === "}") accolades--;
      else if (c === '"' || c === "'") {
        j = sauterChaine(j);
        continue;
      } else if (c === "`") {
        j = sauterTemplate(j);
        continue;
      } else if (c === "/" && code[j + 1] === "/") {
        j = sauterCommentaireLigne(j);
        continue;
      } else if (c === "/" && code[j + 1] === "*") {
        j = sauterCommentaireBloc(j);
        continue;
      }

      if (parenthèses === 0 && crochets === 0 && accolades === 0) {
        if (c === ";") return j + 1;
        if (c === "\n") return j;
      }
      j++;
    }
    return j;
  }

  let dernierNonEspace = "";

  while (i < n) {
    const c = code[i];

    // Accolades
    if (c === "{") {
      profondeurAccoladesGlobale++;
      dernierNonEspace = "{";
      resultat += c;
      i++;
      continue;
    }
    if (c === "}") {
      profondeurAccoladesGlobale--;
      dernierNonEspace = "}";
      resultat += c;
      i++;
      if (
        attentesDo.length > 0 &&
        attentesDo[attentesDo.length - 1] === profondeurAccoladesGlobale
      ) {
        attentesDo.pop();
        attendWhileImmediat = true;
      }
      continue;
    }

    // Commentaires
    if (c === "/" && code[i + 1] === "/") {
      const fin = sauterCommentaireLigne(i);
      resultat += code.slice(i, fin);
      i = fin;
      continue;
    }
    if (c === "/" && code[i + 1] === "*") {
      const fin = sauterCommentaireBloc(i);
      resultat += code.slice(i, fin);
      i = fin;
      continue;
    }

    // Chaînes de caractères
    if (c === '"' || c === "'") {
      const fin = sauterChaine(i);
      resultat += code.slice(i, fin);
      i = fin;
      dernierNonEspace = "val";
      attendWhileImmediat = false;
      continue;
    }
    if (c === "`") {
      const fin = sauterTemplate(i);
      resultat += code.slice(i, fin);
      i = fin;
      dernierNonEspace = "val";
      attendWhileImmediat = false;
      continue;
    }

    // Expressions régulières
    if (c === "/" && /[=([,{;:!?+*&|~^<>-]/.test(dernierNonEspace)) {
      let j = i + 1;
      let enClasse = false;
      while (j < n) {
        if (code[j] === "\\") j += 2;
        else if (code[j] === "[") {
          enClasse = true;
          j++;
        } else if (code[j] === "]") {
          enClasse = false;
          j++;
        } else if (code[j] === "/" && !enClasse) {
          j++;
          break;
        } else {
          j++;
        }
      }
      while (j < n && /[a-z]/i.test(code[j])) j++;
      resultat += code.slice(i, j);
      i = j;
      dernierNonEspace = "val";
      attendWhileImmediat = false;
      continue;
    }

    // Mots-clés de boucle (s'ils ne sont pas précédés d'un identifiant ni d'un point)
    if (!estCaractereIdentifiant(code[i - 1] || "") && dernierNonEspace !== ".") {
      // do
      if (code.startsWith("do", i) && !estCaractereIdentifiant(code[i + 2] || "")) {
        resultat += "do";
        i += 2;
        const apresEspaces = sauterEspacesEtCommentaires(i);
        resultat += code.slice(i, apresEspaces);
        i = apresEspaces;
        if (code[i] === "{") {
          attentesDo.push(profondeurAccoladesGlobale);
          profondeurAccoladesGlobale++;
          resultat += `{ __verifierBoucle(${boucleId++});`;
          i++;
        } else {
          const finInstr = trouverFinInstruction(i);
          const corps = code.slice(i, finInstr);
          resultat += `{ __verifierBoucle(${boucleId++}); ${corps} }`;
          i = finInstr;
          attendWhileImmediat = true;
        }
        dernierNonEspace = "{";
        continue;
      }

      // while
      if (code.startsWith("while", i) && !estCaractereIdentifiant(code[i + 5] || "")) {
        if (attendWhileImmediat) {
          attendWhileImmediat = false;
          resultat += "while";
          i += 5;
          dernierNonEspace = "while";
          continue;
        }
        resultat += "while";
        i += 5;
        const apresWhile = sauterEspacesEtCommentaires(i);
        resultat += code.slice(i, apresWhile);
        i = apresWhile;
        if (code[i] === "(") {
          const finParen = trouverFinParenthèses(i + 1);
          resultat += code.slice(i, finParen);
          i = finParen;
          const apresCondition = sauterEspacesEtCommentaires(i);
          resultat += code.slice(i, apresCondition);
          i = apresCondition;
          if (code[i] === "{") {
            profondeurAccoladesGlobale++;
            resultat += `{ __verifierBoucle(${boucleId++});`;
            i++;
          } else {
            const finInstr = trouverFinInstruction(i);
            const corps = code.slice(i, finInstr);
            resultat += `{ __verifierBoucle(${boucleId++}); ${corps} }`;
            i = finInstr;
          }
        }
        dernierNonEspace = ")";
        continue;
      }

      // for
      if (code.startsWith("for", i) && !estCaractereIdentifiant(code[i + 3] || "")) {
        attendWhileImmediat = false;
        resultat += "for";
        i += 3;
        const apresFor = sauterEspacesEtCommentaires(i);
        resultat += code.slice(i, apresFor);
        i = apresFor;
        if (code[i] === "(") {
          const finParen = trouverFinParenthèses(i + 1);
          resultat += code.slice(i, finParen);
          i = finParen;
          const apresCondition = sauterEspacesEtCommentaires(i);
          resultat += code.slice(i, apresCondition);
          i = apresCondition;
          if (code[i] === "{") {
            profondeurAccoladesGlobale++;
            resultat += `{ __verifierBoucle(${boucleId++});`;
            i++;
          } else {
            const finInstr = trouverFinInstruction(i);
            const corps = code.slice(i, finInstr);
            resultat += `{ __verifierBoucle(${boucleId++}); ${corps} }`;
            i = finInstr;
          }
        }
        dernierNonEspace = ")";
        continue;
      }
    }

    if (!/\s/.test(c)) {
      dernierNonEspace = c;
      attendWhileImmediat = false;
    }
    resultat += c;
    i++;
  }

  return resultat;
}
