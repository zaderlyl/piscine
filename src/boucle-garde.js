// Protection anti-boucle infinie pour l'aperçu et les tests.
// Détecte les boucles (while, for, do...while) et insère un garde d'exécution
// qui interrompt la boucle si elle tourne plus de 3 secondes.

export const DELAI_BOUCLE_MS = 3000;
export const DELAI_TESTS_MS = 4000;
export const MESSAGE_BOUCLE_TROP_LONGUE =
  "L'exécution a pris trop de temps (vérifie tes boucles)";

// Code du garde injecté dans la page. Le délai est un paramètre pour pouvoir le réduire dans les tests.
//  - Le temps est mesuré sur l'exécution synchrone : le chronomètre repart à zéro dès que la page
//    rend la main au navigateur (await, setTimeout...), donc une boucle qui attend vraiment n'est pas coupée.
//  - Une fois le délai dépassé, TOUS les appels suivants lèvent l'erreur : un try/catch placé autour
//    d'une boucle ne peut plus la relancer indéfiniment.
//  - L'erreur porte `garde: true`, ce qui permet de la reconnaître sans lire son texte.
export function creerGardeCode(delai = DELAI_BOUCLE_MS) {
  return `
window.__boucles = {};
window.__epoque = 0;
window.__epoquePlanifiee = false;
window.__gardeDeclenche = false;
window.__verifierBoucle = function (id) {
  if (window.__gardeDeclenche) {
    const e = new Error("${MESSAGE_BOUCLE_TROP_LONGUE}");
    e.garde = true;
    throw e;
  }
  let b = window.__boucles[id];
  if (!b || b.epoque !== window.__epoque) {
    b = window.__boucles[id] = { debut: Date.now(), cpt: 0, epoque: window.__epoque };
    if (!window.__epoquePlanifiee) {
      window.__epoquePlanifiee = true;
      setTimeout(function () { window.__epoque++; window.__epoquePlanifiee = false; }, 0);
    }
  }
  if ((++b.cpt & 15) === 0 && Date.now() - b.debut > ${delai}) {
    window.__gardeDeclenche = true;
    const e = new Error("${MESSAGE_BOUCLE_TROP_LONGUE}");
    e.garde = true;
    throw e;
  }
};
function __verifierBoucle(id) {
  window.__verifierBoucle(id);
}
`;
}

export const GARDE_BOUCLE_CODE = creerGardeCode();

// Transforme un code JavaScript en insérant __verifierBoucle(id) dans chaque boucle (while, for, do...while)
export function protegerBoucles(code) {
  return proteger(code, { n: 0 });
}

// `compteur` est partagé avec les appels récursifs (corps sans accolades, expressions de template)
// pour que chaque boucle garde un identifiant unique.
function proteger(code, compteur) {
  if (!code || typeof code !== "string") return "";

  let resultat = "";
  let i = 0;
  const n = code.length;

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

  // Fin d'un bloc { ... } qui commence en `debut`
  function trouverFinBloc(debut) {
    let profondeur = 0;
    let j = debut;
    while (j < n) {
      const c = code[j];
      if (c === "{") profondeur++;
      else if (c === "}") {
        profondeur--;
        if (profondeur === 0) return j + 1;
      } else if (c === '"' || c === "'") {
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
      j++;
    }
    return j;
  }

  function motClef(mot, j) {
    return code.startsWith(mot, j) && !estCaractereIdentifiant(code[j + mot.length] || "");
  }

  // Fin d'une instruction complète sans accolades : gère if/else, boucles imbriquées, try/catch/finally
  function trouverFinStatement(debut) {
    let j = sauterEspacesEtCommentaires(debut);
    if (code[j] === "{") return trouverFinBloc(j);

    if (motClef("if", j)) {
      j = sauterEspacesEtCommentaires(j + 2);
      if (code[j] === "(") j = trouverFinParenthèses(j + 1);
      j = trouverFinStatement(j);
      const k = sauterEspacesEtCommentaires(j);
      if (motClef("else", k)) return trouverFinStatement(k + 4);
      return j;
    }

    if (motClef("for", j) || motClef("while", j)) {
      j += motClef("for", j) ? 3 : 5;
      j = sauterEspacesEtCommentaires(j);
      if (motClef("await", j)) j = sauterEspacesEtCommentaires(j + 5);
      if (code[j] === "(") j = trouverFinParenthèses(j + 1);
      return trouverFinStatement(j);
    }

    if (motClef("do", j)) {
      j = trouverFinStatement(j + 2);
      let k = sauterEspacesEtCommentaires(j);
      if (motClef("while", k)) {
        k = sauterEspacesEtCommentaires(k + 5);
        if (code[k] === "(") k = trouverFinParenthèses(k + 1);
        const apres = sauterEspacesEtCommentaires(k);
        return code[apres] === ";" ? apres + 1 : k;
      }
      return j;
    }

    if (motClef("try", j)) {
      j = trouverFinBloc(sauterEspacesEtCommentaires(j + 3));
      let k = sauterEspacesEtCommentaires(j);
      if (motClef("catch", k)) {
        k = sauterEspacesEtCommentaires(k + 5);
        if (code[k] === "(") k = sauterEspacesEtCommentaires(trouverFinParenthèses(k + 1));
        j = trouverFinBloc(k);
        k = sauterEspacesEtCommentaires(j);
      }
      if (motClef("finally", k)) j = trouverFinBloc(sauterEspacesEtCommentaires(k + 7));
      return j;
    }

    return trouverFinInstruction(j);
  }

  // Copie un template littéral en protégeant aussi les boucles écrites dans ses ${ ... }
  function traiterTemplate(debut) {
    let sortie = "`";
    let j = debut + 1;
    while (j < n) {
      if (code[j] === "\\") {
        sortie += code.slice(j, j + 2);
        j += 2;
      } else if (code[j] === "$" && code[j + 1] === "{") {
        let k = j + 2;
        let accolades = 1;
        while (k < n) {
          const c = code[k];
          if (c === "{") accolades++;
          else if (c === "}") {
            accolades--;
            if (accolades === 0) break;
          } else if (c === '"' || c === "'") k = sauterChaine(k) - 1;
          else if (c === "`") k = sauterTemplate(k) - 1;
          k++;
        }
        sortie += "${" + proteger(code.slice(j + 2, k), compteur) + "}";
        j = k + 1;
      } else if (code[j] === "`") {
        return { texte: sortie + "`", fin: j + 1 };
      } else {
        sortie += code[j];
        j++;
      }
    }
    return { texte: sortie, fin: j };
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
      const t = traiterTemplate(i);
      resultat += t.texte;
      i = t.fin;
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
          resultat += `{ __verifierBoucle(${compteur.n++});`;
          i++;
        } else {
          const finInstr = trouverFinStatement(i);
          const corps = code.slice(i, finInstr);
          resultat += `{ __verifierBoucle(${compteur.n++}); ${proteger(corps, compteur)} }`;
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
            resultat += `{ __verifierBoucle(${compteur.n++});`;
            i++;
          } else {
            const finInstr = trouverFinStatement(i);
            const corps = code.slice(i, finInstr);
            resultat += `{ __verifierBoucle(${compteur.n++}); ${proteger(corps, compteur)} }`;
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
            resultat += `{ __verifierBoucle(${compteur.n++});`;
            i++;
          } else {
            const finInstr = trouverFinStatement(i);
            const corps = code.slice(i, finInstr);
            resultat += `{ __verifierBoucle(${compteur.n++}); ${proteger(corps, compteur)} }`;
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

// Vrai si les attributs d'une balise <script> désignent du JavaScript (pas de type, module, javascript).
// Les blocs JSON, importmap, templates... ne doivent pas être modifiés.
export function scriptEstJavaScript(attrs) {
  const m = attrs.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (!m) return true;
  const type = (m[1] ?? m[2] ?? m[3] ?? "").trim().toLowerCase();
  return (
    type === "" ||
    type === "module" ||
    /^(text|application)\/(x-)?(java|ecma)script$/.test(type)
  );
}
