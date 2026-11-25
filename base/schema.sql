-- Base de données de Piscine (comptes et progression).
-- Création locale : mysql -u root -p < base/schema.sql
-- Sur le serveur de l'IUT la base existe déjà : importer le script depuis phpMyAdmin
-- en ignorant les deux premières instructions (CREATE DATABASE et USE).

CREATE DATABASE IF NOT EXISTS piscine
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE piscine;

-- Un compte élève ou prof. Les comptes prof sont créés à la main en base.
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    role ENUM('eleve', 'prof') NOT NULL DEFAULT 'eleve',
    actif TINYINT(1) NOT NULL DEFAULT 1,
    cree_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_users_email (email)
) ENGINE=InnoDB;

-- Les exos réussis par chaque élève (exo = identifiant comme « html/vanilla/04 »).
CREATE TABLE IF NOT EXISTS progression (
    user_id INT UNSIGNED NOT NULL,
    exo VARCHAR(100) NOT NULL,
    reussi TINYINT(1) NOT NULL DEFAULT 1,
    date_reussite DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, exo),
    CONSTRAINT fk_progression_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
