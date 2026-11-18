<?php
// Configuration du serveur de Piscine : modèle à copier.
//
// 1. Copie ce fichier en api/config.local.php (jamais versionné : il est dans le .gitignore).
// 2. Remplace les valeurs ci-dessous par les vraies.
// Ne mets JAMAIS de vrai mot de passe ni de vrai code dans ce fichier d'exemple.

return [
    // Connexion à MySQL
    'base' => [
        'hote' => '127.0.0.1',
        'port' => 3306,
        'nom' => 'piscine',
        'utilisateur' => 'piscine',
        'mot_de_passe' => 'a-remplacer',
    ],

    // Code que l'élève saisit à l'inscription (comptes « eleve » seulement)
    'code_inscription' => 'a-remplacer',
];
