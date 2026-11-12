// localStorage dans l'aperçu.
// L'aperçu est une iframe isolée (sandbox="allow-scripts", sans allow-same-origin) : le vrai
// localStorage y est interdit, et l'ouvrir donnerait au code de l'élève accès à celui de l'app.
// On le remplace donc par un faux, rempli au chargement avec les données de l'exo ; chaque
// modification est envoyée à l'app (postMessage), qui la range dans son propre stockage, par exo.
// sessionStorage est remplacé lui aussi, mais il repart à vide à chaque chargement de l'aperçu.

const PREFIXE = "piscine-apercu-stockage:";

// Script à placer en tête de la page de l'aperçu, avant tout script de l'élève
export function scriptStockage(donnees = {}) {
  const json = JSON.stringify(donnees).replace(/</g, "\\u003c");
  return `<script>(() => {
  const creer = (depart, envoyer) => {
    const d = new Map(Object.entries(depart));
    const changer = () => envoyer && parent.postMessage({ type: "stockage", donnees: Object.fromEntries(d) }, "*");
    return {
      get length() { return d.size; },
      key: (i) => [...d.keys()][i] ?? null,
      getItem: (cle) => (d.has(String(cle)) ? d.get(String(cle)) : null),
      setItem: (cle, valeur) => { d.set(String(cle), String(valeur)); changer(); },
      removeItem: (cle) => { d.delete(String(cle)); changer(); },
      clear: () => { d.clear(); changer(); },
    };
  };
  const definir = (nom, valeur) => Object.defineProperty(window, nom, { value: valeur, configurable: true });
  definir("localStorage", creer(${json}, true));
  definir("sessionStorage", creer({}, false));
})();<\/script>`;
}

// Place le script juste après le doctype (avant, la page passerait en mode « quirks »)
export function injecterStockage(code, donnees) {
  const script = scriptStockage(donnees);
  const doctype = code.match(/^\s*<!doctype[^>]*>/i);
  return doctype ? doctype[0] + script + code.slice(doctype[0].length) : script + code;
}

// Données enregistrées par l'aperçu de cet exo
export function lireStockageApercu(exo, stockage = localStorage) {
  try {
    const brut = JSON.parse(stockage.getItem(PREFIXE + exo) ?? "{}");
    return brut && typeof brut === "object" && !Array.isArray(brut) ? brut : {};
  } catch {
    return {};
  }
}

export function ecrireStockageApercu(exo, donnees, stockage = localStorage) {
  if (!donnees || typeof donnees !== "object" || Array.isArray(donnees)) return;
  // On ne garde que des chaînes, comme un vrai localStorage
  const propre = Object.fromEntries(
    Object.entries(donnees).filter(([, v]) => typeof v === "string"),
  );
  try {
    stockage.setItem(PREFIXE + exo, JSON.stringify(propre));
  } catch {
    // stockage plein ou indisponible : l'aperçu continue sans mémoire
  }
}
