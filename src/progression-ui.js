// Boutons d'export et d'import de la progression, avec leur message de confirmation
import { construireExport, telechargerExport, fusionnerProgression } from "./progression.js";

// avantExport : fonction appelée juste avant l'export (pour enregistrer le brouillon en cours)
export function monterProgressionUi({ avantExport } = {}) {
  const btnExporter = document.getElementById("btn-exporter");
  const btnImporter = document.getElementById("btn-importer");
  const inputImporter = document.getElementById("input-importer");
  const msgProgression = document.getElementById("msg-progression");

  let minuteurMsgProgression = null;

  function afficherMessageProgression(texte, estErreur = false) {
    if (!msgProgression) return;
    msgProgression.textContent = texte;
    msgProgression.classList.remove("cache", "succes", "erreur");
    msgProgression.classList.add(estErreur ? "erreur" : "succes");
    clearTimeout(minuteurMsgProgression);
    minuteurMsgProgression = setTimeout(() => {
      msgProgression.classList.add("cache");
    }, 4000);
  }

  // Affiche le message de confirmation après rechargement si présent
  try {
    const msgEnAttente = sessionStorage.getItem("piscine-message-import");
    if (msgEnAttente) {
      sessionStorage.removeItem("piscine-message-import");
      afficherMessageProgression(msgEnAttente, false);
    }
  } catch {
    // sessionStorage inaccessible
  }

  if (btnExporter) {
    btnExporter.addEventListener("click", () => {
      if (typeof avantExport === "function") avantExport();
      const exportDonnees = construireExport();
      telechargerExport(exportDonnees, "progression-piscine.json");
      afficherMessageProgression("Progression exportée avec succès !");
    });
  }

  if (btnImporter && inputImporter) {
    btnImporter.addEventListener("click", () => {
      inputImporter.value = "";
      inputImporter.click();
    });

    inputImporter.addEventListener("change", async (e) => {
      const fichier = e.target.files?.[0];
      if (!fichier) return;

      try {
        const texte = await fichier.text();
        const donnees = JSON.parse(texte);
        const { nbTotalReussis, nbBrouillonsConserves } = fusionnerProgression(donnees);
        const conserves = nbBrouillonsConserves
          ? ` ${nbBrouillonsConserves} brouillon(s) déjà présent(s) sur ce poste conservé(s).`
          : "";
        try {
          sessionStorage.setItem(
            "piscine-message-import",
            `Progression importée avec succès (${nbTotalReussis} exercice(s) validé(s)).${conserves}`,
          );
        } catch {
          // ignore
        }
        location.reload();
      } catch (erreur) {
        afficherMessageProgression("Erreur lors de l'import : " + erreur.message, true);
      }
    });
  }
}
