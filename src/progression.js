const CLE_PROGRESSION = "piscine-progression";

function obtenirStockage(stockage) {
  if (stockage) return stockage;
  if (typeof localStorage !== "undefined") return localStorage;
  return null;
}

export function lireProgression(stockage = null) {
  const s = obtenirStockage(stockage);
  if (!s) return {};
  try {
    const donnees = JSON.parse(s.getItem(CLE_PROGRESSION));
    return donnees && typeof donnees === "object" ? donnees : {};
  } catch {
    return {};
  }
}

export function marquerReussi(exo, stockage = null) {
  const s = obtenirStockage(stockage);
  if (!s) return;
  const progression = lireProgression(s);
  if (progression[exo]?.reussi) return;
  progression[exo] = { reussi: true, date: new Date().toISOString() };
  try {
    s.setItem(CLE_PROGRESSION, JSON.stringify(progression));
  } catch {
    console.error("Erreur lors de la sauvegarde de la prog");
  }
}

export async function chargerListeExos() {
  try {
    const reponse = await fetch("../exos/index.json");
    return await reponse.json();
  } catch {
    console.warn(
      "Liste des exos introuvable (exos/index.json) : le bouton « Exo suivant » est désactivé.",
    );
    return [];
  }
}

export function exoSuivant(exo, liste) {
  const position = liste.indexOf(exo);
  return position === -1 ? null : (liste[position + 1] ?? null);
}

export function estReussi(exo, stockage = null) {
  return Boolean(lireProgression(stockage)[exo]?.reussi);
}

// Construit l'objet d'export complet contenant la progression, les brouillons et Emmet
export function construireExport(stockage = null) {
  const s = obtenirStockage(stockage);
  if (!s) {
    return {
      version: VERSION_EXPORT,
      dateExport: new Date().toISOString(),
      progression: {},
      brouillons: {},
      emmet: [],
    };
  }

  const progression = lireProgression(s);
  const brouillons = {};

  try {
    const n = typeof s.length === "number" ? s.length : 0;
    for (let i = 0; i < n; i++) {
      const cle = s.key(i);
      if (cle && cle.startsWith("piscine-brouillon:")) {
        const exo = cle.slice("piscine-brouillon:".length);
        try {
          brouillons[exo] = JSON.parse(s.getItem(cle));
        } catch {
          // ignore brouillon corrompu
        }
      }
    }
  } catch {
    // stockage non énumérable
  }

  let emmet = [];
  try {
    emmet = JSON.parse(s.getItem("piscine-emmet")) || [];
  } catch {
    emmet = [];
  }

  return {
    version: VERSION_EXPORT,
    dateExport: new Date().toISOString(),
    progression,
    brouillons,
    emmet,
  };
}

const VERSION_EXPORT = 1;
const FORMAT_ID_EXO = /^[a-z0-9_-]+(\/[a-z0-9_-]+)+$/i; // ex. html/vanilla/04
const FORMAT_EMMET = /^[\w.#>+*^$@!:-]{1,64}$/;

function estObjetSimple(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// Nettoie un fichier importé : ne garde que ce qui a la bonne forme, ignore le reste.
// Retourne { progression, brouillons, emmet } ou lève une erreur claire si rien n'est exploitable.
export function normaliserDonnees(donnees) {
  if (!donnees || typeof donnees !== "object") {
    throw new Error("Le fichier est vide ou n'est pas un objet JSON valide.");
  }

  const progression = {};
  const ajouterReussi = (id, date) => {
    if (typeof id !== "string" || !FORMAT_ID_EXO.test(id)) return;
    const dateValide =
      typeof date === "string" && !Number.isNaN(Date.parse(date)) ? date : null;
    progression[id] = { reussi: true, date: dateValide };
  };

  let formatStandard = false;
  if (Array.isArray(donnees)) {
    // Tableau d'identifiants ["html/vanilla/00", ...]
    for (const id of donnees) ajouterReussi(id, null);
  } else {
    if (typeof donnees.version === "number" && donnees.version > VERSION_EXPORT) {
      throw new Error(
        "Ce fichier vient d'une version plus récente de la piscine : mets l'application à jour avant de l'importer.",
      );
    }
    if (estObjetSimple(donnees.progression)) {
      // Format standard { version, progression, brouillons, emmet }
      formatStandard = true;
      for (const [id, info] of Object.entries(donnees.progression)) {
        if (estObjetSimple(info) && info.reussi === true) ajouterReussi(id, info.date);
      }
    } else if (!("progression" in donnees)) {
      // Dictionnaire direct { "html/vanilla/00": { reussi: true } }
      for (const [id, info] of Object.entries(donnees)) {
        if (estObjetSimple(info) && info.reussi === true) ajouterReussi(id, info.date);
      }
    }
  }

  const brouillons = {};
  if (estObjetSimple(donnees.brouillons)) {
    for (const [id, fichiers] of Object.entries(donnees.brouillons)) {
      if (!FORMAT_ID_EXO.test(id) || !estObjetSimple(fichiers)) continue;
      const propres = {};
      for (const [nom, contenu] of Object.entries(fichiers)) {
        if (typeof contenu === "string" && !/[\/]|^\.\.?$/.test(nom)) propres[nom] = contenu;
      }
      if (Object.keys(propres).length > 0) brouillons[id] = propres;
    }
  }

  const emmet = Array.isArray(donnees.emmet)
    ? donnees.emmet.filter((e) => typeof e === "string" && FORMAT_EMMET.test(e))
    : [];

  const nbElements =
    Object.keys(progression).length + Object.keys(brouillons).length + emmet.length;
  if (!formatStandard && nbElements === 0) {
    throw new Error("Le fichier ne contient pas de données de progression valides.");
  }

  return { progression, brouillons, emmet };
}

// Valide qu'un objet contient une structure de progression exploitable (lève une erreur sinon)
export function validerDonneesProgression(donnees) {
  normaliserDonnees(donnees);
  return true;
}

// Fusionne les données importées dans le stockage local.
// Rien n'est écrasé : un exercice déjà validé garde sa date, un brouillon local existant est conservé.
// Les écritures sont annulées si le stockage refuse l'une d'elles (ex. stockage plein).
export function fusionnerProgression(donnees, stockage = null) {
  const s = obtenirStockage(stockage);
  if (!s) {
    throw new Error("Espace de stockage local inaccessible.");
  }

  const { progression, brouillons, emmet } = normaliserDonnees(donnees);

  const actuelle = lireProgression(s);
  let nbNouveauxExos = 0;
  for (const [id, info] of Object.entries(progression)) {
    if (actuelle[id]?.reussi) continue;
    nbNouveauxExos++;
    actuelle[id] = { reussi: true, date: info.date || new Date().toISOString() };
  }

  const ecritures = [[CLE_PROGRESSION, JSON.stringify(actuelle)]];

  let nbBrouillons = 0;
  let nbBrouillonsConserves = 0;
  for (const [id, fichiers] of Object.entries(brouillons)) {
    const cle = "piscine-brouillon:" + id;
    if (s.getItem(cle) !== null) {
      nbBrouillonsConserves++;
      continue;
    }
    ecritures.push([cle, JSON.stringify(fichiers)]);
    nbBrouillons++;
  }

  if (emmet.length > 0) {
    let emmetActuel = [];
    try {
      const lu = JSON.parse(s.getItem("piscine-emmet"));
      if (Array.isArray(lu)) emmetActuel = lu;
    } catch {
      // emmet local illisible : on repart d'une liste vide
    }
    ecritures.push([
      "piscine-emmet",
      JSON.stringify(Array.from(new Set([...emmetActuel, ...emmet]))),
    ]);
  }

  const anciennes = ecritures.map(([cle]) => [cle, s.getItem(cle)]);
  try {
    for (const [cle, valeur] of ecritures) s.setItem(cle, valeur);
  } catch {
    for (const [cle, ancienne] of anciennes) {
      try {
        if (ancienne === null) s.removeItem(cle);
        else s.setItem(cle, ancienne);
      } catch {
        // on fait au mieux pour revenir à l'état précédent
      }
    }
    throw new Error(
      "Impossible d'enregistrer l'import : l'espace de stockage du navigateur est plein ou bloqué. Rien n'a été modifié.",
    );
  }

  const nbTotalReussis = Object.values(actuelle).filter((e) => e?.reussi).length;

  return {
    nbTotalReussis,
    nbNouveauxExos,
    nbBrouillons,
    nbBrouillonsConserves,
  };
}

// Déclenche le téléchargement du fichier JSON dans le navigateur
export function telechargerExport(
  donnees,
  nomFichier = "progression-piscine.json",
) {
  const json = JSON.stringify(donnees, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}
