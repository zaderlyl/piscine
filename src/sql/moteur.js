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

// Structure de toutes les tables : [{ nom, colonnes, etrangeres }], triées par nom.
// - colonnes : [{ nom, type, cle, nonNul }] ; type en majuscules, cle = rang dans la clé primaire (0 si aucune) ;
// - etrangeres : [{ de, table, vers }] ; « vers » vaut la clé primaire de la table visée si elle n'est pas précisée.
function lireStructure(db) {
  const noms = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  const entre = (nom) => '"' + nom.replaceAll('"', '""') + '"';
  const cle = (nom) =>
    db
      .exec(`PRAGMA table_info(${entre(nom)})`)[0]
      .values.filter((c) => c[5] > 0)
      .sort((a, b) => a[5] - b[5])
      .map((c) => c[1]);
  return (noms[0] ? noms[0].values : []).map(([nom]) => {
    const colonnes = db.exec(`PRAGMA table_info(${entre(nom)})`)[0].values.map((c) => ({
      nom: c[1],
      type: String(c[2]).toUpperCase(),
      cle: c[5],
      nonNul: c[3] === 1,
    }));
    const liste = db.exec(`PRAGMA foreign_key_list(${entre(nom)})`);
    const etrangeres = (liste[0] ? liste[0].values : []).map((f) => ({
      de: f[3],
      table: f[2],
      vers: f[4] ?? cle(f[2])[0] ?? null,
    }));
    return { nom, colonnes, etrangeres };
  });
}

// Vrai si la requête contient une instruction qui modifie la structure (CREATE, ALTER, DROP), hors commentaires.
function modifieLaStructure(requete) {
  const sansCommentaires = requete.replace(/--[^\n]*/g, "");
  return /(^|;)\s*(create|alter|drop)\b/i.test(sansCommentaires);
}

// Vrai si la requête contient une instruction qui modifie les données (hors commentaires `--`).
function modifieLesDonnees(requete) {
  const sansCommentaires = requete.replace(/--[^\n]*/g, "");
  return /(^|;)\s*(insert|update|delete|replace)\b/i.test(sansCommentaires);
}

// Crée une base neuve avec le script `base`, exécute `requete`, puis referme la base.
// Renvoie { colonnes, lignes, tables, ecriture, structure, structureModifiee } ou { erreur } si le SQL est invalide :
// - colonnes, lignes : résultat de la dernière instruction qui renvoie des lignes (sinon vide) ;
// - tables : le contenu de toutes les tables après la requête ;
// - ecriture : vrai si la requête modifie des données (INSERT, UPDATE, DELETE) ;
// - structure : la structure de toutes les tables après la requête (colonnes, types, clés) ;
// - structureModifiee : vrai si la requête modifie la structure (CREATE, ALTER, DROP).
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
      structure: lireStructure(db),
      structureModifiee: modifieLaStructure(requete),
    };
  } catch (erreur) {
    return { erreur: erreur.message };
  } finally {
    db.close();
  }
}
