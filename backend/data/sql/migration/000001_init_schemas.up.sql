CREATE TABLE `users` (
    `username`      VARCHAR(32) PRIMARY KEY,
    `password_hash` VARCHAR(255) NOT NULL,
    `avatar`        VARCHAR(512) NOT NULL,
    `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `cards` (
    `id`         VARCHAR(36) PRIMARY KEY,
    `name`       VARCHAR(255) UNIQUE NULL,
    `icon`       VARCHAR(512) NOT NULL,
    `sound`      VARCHAR(512) NOT NULL DEFAULT 'media/cards/sounds/ekh.mp3',
    `descr`      VARCHAR(1000) NOT NULL,
    `attack`     INT NOT NULL,
    `defence`    INT NOT NULL,
    `cost`       INT NOT NULL,
    `attribute`  ENUM('strange','agility','intellect') NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `rooms` (
    `name`          VARCHAR(20) PRIMARY KEY,
    `password_hash` VARCHAR(255) NOT NULL,
    `max_players`   INT NOT NULL DEFAULT 2,
    `status`        ENUM('waiting','playing') NOT NULL DEFAULT 'waiting',
    `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `players` (
    `id`         CHAR(36) PRIMARY KEY,
    `username`   VARCHAR(32) NOT NULL REFERENCES users(username),
    `room_name`  VARCHAR(20) NOT NULL REFERENCES rooms(name),
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
