<?php
declare(strict_types=1);

// Connexion à la base MySQL de Piscine.
// Usage dans un fichier de l'API :
//     require_once __DIR__ . '/bdd.php';
//     $pdo = connecterBase();

// Lit la configuration locale (api/config.local.php, jamais versionnée).
function chargerConfig(): array
{
    $chemin = __DIR__ . '/config.local.php';
    if (!is_file($chemin)) {
        throw new RuntimeException(
            "Configuration absente : copie api/config.exemple.php en api/config.local.php et remplis-le."
        );
    }
    return require $chemin;
}

// Ouvre la connexion PDO. Toute erreur SQL lève une PDOException.
function connecterBase(): PDO
{
    $base = chargerConfig()['base'];
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $base['hote'],
        $base['port'],
        $base['nom']
    );

    try {
        return new PDO($dsn, $base['utilisateur'], $base['mot_de_passe'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        // Message volontairement générique : on ne répète pas les identifiants.
        throw new RuntimeException("Connexion à la base impossible : vérifie api/config.local.php et que MySQL tourne.");
    }
}
