<?php
declare(strict_types=1);

// Vérifie les champs envoyés à l'inscription.
// Usage :
//     $resultat = validerInscription($donnees, $codeAttendu);
//     $resultat['erreurs']  : [champ => message], vide si tout est bon
//     $resultat['compte']   : email, prenom et nom nettoyés (espaces retirés, email en minuscules)

const LONGUEUR_MIN_MOT_DE_PASSE = 8;
// bcrypt ignore ce qui dépasse 72 octets : on refuse plutôt que de tronquer en silence.
const LONGUEUR_MAX_MOT_DE_PASSE = 72;

// Nombre de caractères d'un texte (les accents comptent pour un).
function longueurTexte(string $texte): int
{
    return function_exists('mb_strlen') ? mb_strlen($texte, 'UTF-8') : strlen($texte);
}

function validerInscription(array $donnees, string $codeAttendu): array
{
    $erreurs = [];

    // Les champs doivent être du texte (pas de tableau, de nombre ou de null)
    $lire = function (string $champ) use ($donnees): ?string {
        return isset($donnees[$champ]) && is_string($donnees[$champ]) ? $donnees[$champ] : null;
    };

    $email = $lire('email');
    $email = $email === null ? '' : strtolower(trim($email));
    if ($email === '' || strlen($email) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erreurs['email'] = "Entre une adresse e-mail valide.";
    }

    $prenom = trim($lire('prenom') ?? '');
    if ($prenom === '' || longueurTexte($prenom) > 100) {
        $erreurs['prenom'] = "Entre ton prénom (100 caractères maximum).";
    }

    $nom = trim($lire('nom') ?? '');
    if ($nom === '' || longueurTexte($nom) > 100) {
        $erreurs['nom'] = "Entre ton nom (100 caractères maximum).";
    }

    // Le mot de passe n'est pas nettoyé : les espaces en font partie
    $motDePasse = $lire('mot_de_passe') ?? '';
    if (longueurTexte($motDePasse) < LONGUEUR_MIN_MOT_DE_PASSE) {
        $erreurs['mot_de_passe'] = "Le mot de passe doit faire au moins " . LONGUEUR_MIN_MOT_DE_PASSE . " caractères.";
    } elseif (strlen($motDePasse) > LONGUEUR_MAX_MOT_DE_PASSE) {
        $erreurs['mot_de_passe'] = "Le mot de passe est trop long (" . LONGUEUR_MAX_MOT_DE_PASSE . " octets maximum).";
    }

    // Comparaison à temps constant, et un code attendu vide n'est jamais valide
    $code = $lire('code') ?? '';
    if ($codeAttendu === '' || !hash_equals($codeAttendu, $code)) {
        $erreurs['code'] = "Le code d'inscription est incorrect.";
    }

    return [
        'erreurs' => $erreurs,
        'compte' => ['email' => $email, 'prenom' => $prenom, 'nom' => $nom],
    ];
}
