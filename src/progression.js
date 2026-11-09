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
      version: 1,
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
    version: 1,
    dateExport: new Date().toISOString(),
    progression,
    brouillons,
    emmet,
  };
}

// Valide qu'un objet contient une structure de progression exploitable
export function validerDonneesProgression(donnees) {
  if (!donnees || typeof donnees !== "object") {
    throw new Error("Le fichier est vide ou n'est pas un objet JSON valide.");
  }

  // Format standard { version, progression, brouillons }
  if (donnees.progression && typeof donnees.progression === "object") {
    return true;
  }

  // Tableau d'identifiants ["html/vanilla/00", ...]
  if (Array.isArray(donnees)) {
    return true;
  }

  // Dictionnaire direct { "html/vanilla/00": { reussi: true } }
  const cles = Object.keys(donnees);
  const estDictionnaireValide =
    cles.length > 0 &&
    cles.some(
      (k) =>
        k.includes("/") ||
        (donnees[k] && typeof donnees[k] === "object" && "reussi" in donnees[k]),
    );
  if (estDictionnaireValide) {
    return true;
  }

  throw new Error("Le fichier ne contient pas de données de progression valides.");
}

// Fusionne les données importées dans le stockage local
export function fusionnerProgression(donnees, stockage = null) {
  const s = obtenirStockage(stockage);
  if (!s) {
    throw new Error("Espace de stockage local inaccessible.");
  }

  validerDonneesProgression(donnees);

  let sourceProgression = {};
  if (Array.isArray(donnees)) {
    for (const id of donnees) {
      if (typeof id === "string") {
        sourceProgression[id] = { reussi: true, date: new Date().toISOString() };
      }
    }
  } else if (donnees.progression && typeof donnees.progression === "object") {
    sourceProgression = donnees.progression;
  } else {
    sourceProgression = donnees;
  }

  const actuelle = lireProgression(s);
  let nbNouveauxExos = 0;

  for (const [nomExo, info] of Object.entries(sourceProgression)) {
    if (!info || typeof info !== "object") continue;
    if (info.reussi === true) {
      if (!actuelle[nomExo] || !actuelle[nomExo].reussi) {
        nbNouveauxExos++;
      }
      actuelle[nomExo] = {
        reussi: true,
        date: info.date || actuelle[nomExo]?.date || new Date().toISOString(),
      };
    }
  }

  s.setItem(CLE_PROGRESSION, JSON.stringify(actuelle));

  let nbBrouillons = 0;
  if (donnees.brouillons && typeof donnees.brouillons === "object") {
    for (const [nomExo, contenu] of Object.entries(donnees.brouillons)) {
      if (contenu && typeof contenu === "object") {
        s.setItem("piscine-brouillon:" + nomExo, JSON.stringify(contenu));
        nbBrouillons++;
      }
    }
  }

  if (Array.isArray(donnees.emmet)) {
    try {
      const emmetActuel = JSON.parse(s.getItem("piscine-emmet")) || [];
      const fusion = Array.from(new Set([...emmetActuel, ...donnees.emmet]));
      s.setItem("piscine-emmet", JSON.stringify(fusion));
    } catch {
      // ignore
    }
  }

  const nbTotalReussis = Object.values(actuelle).filter((e) => e?.reussi).length;

  return {
    nbTotalReussis,
    nbNouveauxExos,
    nbBrouillons,
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
