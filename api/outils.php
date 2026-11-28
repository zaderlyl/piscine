<?php
declare(strict_types=1);

// Outils communs aux scripts de l'API : répondre en JSON et lire le JSON reçu.
// Usage dans un fichier de l'API :
//     require_once __DIR__ . '/outils.php';
//     $donnees = lireCorpsJson();
//     repondreJson(200, ['ok' => true]);

// Envoie une réponse JSON avec son code HTTP, puis arrête le script.
function repondreJson(int $code, array $donnees)
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE);
    exit;
}

// Lit le corps de la requête et le décode en tableau.
// Répond 400 et arrête le script si le corps n'est pas du JSON (objet ou tableau).
function lireCorpsJson(): array
{
    $donnees = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($donnees)) {
        repondreJson(400, ['erreur' => 'Le corps de la requête doit être du JSON.']);
    }
    return $donnees;
}
