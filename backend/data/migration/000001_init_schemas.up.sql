CREATE TABLE `users` (
    `username` VARCHAR(255) PRIMARY KEY,
    `password_hash` VARCHAR(255),
    `avatar` VARCHAR(512),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `cards` (
    `id` CHAR(36) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `icon` VARCHAR(512),
    `descr` VARCHAR(1000) NOT NULL,
    `damage` INT NOT NULL,
    `defence` INT NOT NULL,
    `attribute` ENUM('strange','agility','intellect','universal') NOT NULL,
    `cost` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


