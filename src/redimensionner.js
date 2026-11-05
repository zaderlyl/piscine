// Barre à glisser pour agrandir ou réduire un panneau.
// Glisser la barre change une variable CSS sur <html>, par exemple --h-variables.
// axe "x" : largeur, axe "y" : hauteur.
// sens : 1 si glisser vers la droite ou le bas agrandit le panneau, -1 sinon.
export function glissable(barre, panneau, { axe, variable, sens = 1, min = 60 }) {
  barre.addEventListener("pointerdown", (depart) => {
    depart.preventDefault();
    barre.setPointerCapture(depart.pointerId);

    const rect = panneau.getBoundingClientRect();
    const taille = axe === "x" ? rect.width : rect.height;
    const origine = axe === "x" ? depart.clientX : depart.clientY;

    const bouger = (e) => {
      const position = axe === "x" ? e.clientX : e.clientY;
      const nouvelle = Math.max(min, taille + (position - origine) * sens);
      document.documentElement.style.setProperty(variable, nouvelle + "px");
    };

    const relacher = () => {
      barre.removeEventListener("pointermove", bouger);
      barre.removeEventListener("pointerup", relacher);
    };

    barre.addEventListener("pointermove", bouger);
    barre.addEventListener("pointerup", relacher);
  });
}
