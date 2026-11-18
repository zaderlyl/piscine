// Affiche un message clair quand une bibliothèque (CodeMirror, marked, Emmet…)
// ne peut pas être chargée depuis son CDN, par exemple sans internet.
// Script classique, chargé AVANT les modules : si un module échoue, les modules
// suivants ne s'exécutent pas et la page resterait blanche sans explication.

function afficherMessageReseau() {
  if (document.getElementById("message-reseau")) return;

  const boite = document.createElement("div");
  boite.id = "message-reseau";
  boite.setAttribute("role", "alert");

  const texte = document.createElement("p");
  texte.textContent =
    "La plateforme a besoin d'internet pour charger ses bibliothèques (éditeur, documentation, PHP). " +
    "Vérifie ta connexion, puis recharge la page.";

  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.textContent = "Recharger la page";
  bouton.addEventListener("click", () => location.reload());

  boite.append(texte, bouton);
  document.body.prepend(boite);
}

// Un module qui ne se charge pas déclenche « error » sur sa balise <script>.
// L'événement ne remonte pas : on l'écoute en phase de capture.
window.addEventListener(
  "error",
  (e) => {
    if (e.target instanceof HTMLScriptElement) afficherMessageReseau();
  },
  true,
);
