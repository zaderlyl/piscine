import test from "node:test";
import assert from "node:assert/strict";
import { formaterNomExo, determinerEtatExo } from "./navigation.js";

test("formaterNomExo masque vanilla et met en majuscules", () => {
  assert.equal(formaterNomExo("html/vanilla/00"), "HTML 00");
  assert.equal(formaterNomExo("html/vanilla/04"), "HTML 04");
  assert.equal(formaterNomExo("php/vanilla/00"), "PHP 00");
  assert.equal(formaterNomExo("js/alpine/03"), "JS ALPINE 03");
  assert.equal(formaterNomExo("invalide"), "invalide");
});

test("determinerEtatExo gère l'exo courant, validé, accessible et verrouillé", () => {
  const listeExos = [
    "html/vanilla/00",
    "html/vanilla/01",
    "html/vanilla/02",
    "html/vanilla/03",
  ];
  const progression = {
    "html/vanilla/00": { reussi: true },
    "html/vanilla/01": { reussi: true },
  };

  // Exo courant
  const etatCourant = determinerEtatExo({
    id: "html/vanilla/02",
    exoCourant: "html/vanilla/02",
    listeExos,
    progression,
  });
  assert.equal(etatCourant.etat, "courant");
  assert.equal(etatCourant.etiquette, "En cours");
  assert.equal(etatCourant.accessible, true);

  // Exo déjà réussi
  const etatValide = determinerEtatExo({
    id: "html/vanilla/00",
    exoCourant: "html/vanilla/02",
    listeExos,
    progression,
  });
  assert.equal(etatValide.etat, "valide");
  assert.equal(etatValide.etiquette, "Validé");
  assert.equal(etatValide.accessible, true);

  // Exo verrouillé (non validé et situé après le premier non validé)
  const etatVerrouille = determinerEtatExo({
    id: "html/vanilla/03",
    exoCourant: "html/vanilla/02",
    listeExos,
    progression,
  });
  assert.equal(etatVerrouille.etat, "verrouille");
  assert.equal(etatVerrouille.etiquette, "Verrouillé");
  assert.equal(etatVerrouille.accessible, false);
});

test("determinerEtatExo en mode auteur déverrouille tous les exos", () => {
  const listeExos = ["html/vanilla/00", "html/vanilla/01", "html/vanilla/02"];
  const progression = {};

  const etatAuteur = determinerEtatExo({
    id: "html/vanilla/02",
    exoCourant: "html/vanilla/00",
    listeExos,
    progression,
    estAuteur: true,
  });
  assert.equal(etatAuteur.accessible, true);
  assert.equal(etatAuteur.etiquette, "Disponible");
});
