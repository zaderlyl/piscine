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

// Contenu de toutes les tables de la base : [{ nom, colonnes, lignes }], triées par nom.
function lireTables(db) {
  const noms = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  return (noms[0] ? noms[0].values : []).map(([nom]) => {
    const guillemets = '"' + nom.replaceAll('"', '""') + '"';
    const colonnes = db.exec(`PRAGMA table_info(${guillemets})`)[0].values.map((c) => c[1]);
    const lignes = db.exec(`SELECT * FROM ${guillemets}`);
    return { nom, colonnes, lignes: lignes[0] ? lignes[0].values : [] };
  });
}

// Vrai si la requête contient une instruction qui modifie les données (hors commentaires `--`).
function modifieLesDonnees(requete) {
  const sansCommentaires = requete.replace(/--[^\n]*/g, "");
  return /(^|;)\s*(insert|update|delete|replace)\b/i.test(sansCommentaires);
}

// Crée une base neuve avec le script `base`, exécute `requete`, puis referme la base.
// Renvoie { colonnes, lignes, tables, ecriture } ou { erreur } si le SQL est invalide :
// - colonnes, lignes : résultat de la dernière instruction qui renvoie des lignes (sinon vide) ;
// - tables : le contenu de toutes les tables après la requête ;
// - ecriture : vrai si la requête modifie des données (INSERT, UPDATE, DELETE).
export function executerRequete(SQL, base, requete) {
  const db = new SQL.Database();
  try {
    db.exec(base);
    const resultats = db.exec(requete);
    const dernier = resultats[resultats.length - 1];
    return {
      colonnes: dernier ? dernier.columns : [],
      lignes: dernier ? dernier.values : [],
      tables: lireTables(db),
      ecriture: modifieLesDonnees(requete),
    };
  } catch (erreur) {
    return { erreur: erreur.message };
  } finally {
    db.close();
  }
}
