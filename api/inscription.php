<?php
declare(strict_types=1);

// Inscription d'un élève.
// Requête : POST avec un corps JSON { email, prenom, nom, mot_de_passe, code }
// Réponses : 201 compte créé, 400 champs incorrects, 405 mauvaise méthode,
//            409 e-mail déjà utilisé, 500 erreur du serveur.

require_once __DIR__ . '/outils.php';
require_once __DIR__ . '/bdd.php';
require_once __DIR__ . '/validation-inscription.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    repondreJson(405, ['erreur' => "Méthode non autorisée : utilise POST."]);
}

$donnees = lireCorpsJson();

try {
    $codeAttendu = (string) (chargerConfig()['code_inscription'] ?? '');
    if ($codeAttendu === '') {
        throw new RuntimeException("code_inscription absent de api/config.local.php.");
    }

    $resultat = validerInscription($donnees, $codeAttendu);
    if ($resultat['erreurs']) {
        repondreJson(400, ['erreur' => "Certains champs sont incorrects.", 'erreurs' => $resultat['erreurs']]);
    }
    $compte = $resultat['compte'];

    $pdo = connecterBase();
    $requete = $pdo->prepare(
        'INSERT INTO users (email, prenom, nom, mot_de_passe_hash)
         VALUES (:email, :prenom, :nom, :hash)'
    );
    $requete->execute([
        ':email' => $compte['email'],
        ':prenom' => $compte['prenom'],
        ':nom' => $compte['nom'],
        ':hash' => password_hash($donnees['mot_de_passe'], PASSWORD_DEFAULT),
    ]);

    repondreJson(201, ['ok' => true, 'id' => (int) $pdo->lastInsertId()]);
} catch (PDOException $e) {
    // 1062 : doublon sur la clé unique de l'e-mail (la base tranche, même si deux inscriptions arrivent en même temps)
    if (($e->errorInfo[1] ?? 0) === 1062) {
        repondreJson(409, [
            'erreur' => "Certains champs sont incorrects.",
            'erreurs' => ['email' => "Un compte existe déjà avec cet e-mail."],
        ]);
    }
    error_log('inscription : ' . $e->getMessage());
    repondreJson(500, ['erreur' => "Erreur du serveur. Réessaie plus tard."]);
} catch (Throwable $e) {
    error_log('inscription : ' . $e->getMessage());
    repondreJson(500, ['erreur' => "Erreur du serveur. Réessaie plus tard."]);
}
