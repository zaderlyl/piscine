// Moteur SQL : sql.js (SQLite compilé en WebAssembly) tourne dans le navigateur, sans serveur.

const VERSION = "1.8.0";
const BASE_URL = `https://cdnjs.cloudflare.com/ajax/libs/sql.js/${VERSION}/`;

let promesse = null;

// Charge sql.js une seule fois. Renvoie l'objet SQL (avec SQL.Database).
export function chargerSql() {
  if (!promesse) {
    promesse = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = BASE_URL + "sql-wasm.js";
      script.onload = () => window.initSqlJs({ locateFile: (f) => BASE_URL + f }).then(resolve, reject);
      script.onerror = () => reject(new Error("Impossible de charger le moteur SQL."));
      document.head.append(script);
    }).catch((erreur) => {
      promesse = null; // permet de réessayer
      throw erreur;
    });
  }
  return promesse;
}

// Crée une base neuve avec le script `base`, exécute `requete`, puis referme la base.
// Renvoie { colonnes, lignes } (résultat de la dernière instruction qui renvoie des lignes,
// sinon vide) ou { erreur } si le SQL est invalide.
export function executerRequete(SQL, base, requete) {
  const db = new SQL.Database();
  try {
    db.exec(base);
    const resultats = db.exec(requete);
    const dernier = resultats[resultats.length - 1];
    return dernier ? { colonnes: dernier.columns, lignes: dernier.values } : { colonnes: [], lignes: [] };
  } catch (erreur) {
    return { erreur: erreur.message };
  } finally {
    db.close();
  }
}
