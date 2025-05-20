CREATE TABLE `users` (
    `username`      VARCHAR(32) PRIMARY KEY,
    `password_hash` VARCHAR(255),
    `avatar`        VARCHAR(512),
    `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `cards` (
    `id`         CHAR(36) PRIMARY KEY,
    `name`       VARCHAR(255) NOT NULL,
    `icon`       VARCHAR(512),
    `descr`      VARCHAR(1000) NOT NULL,
    `damage`     INT NOT NULL,
    `defence`    INT NOT NULL,
    `attribute`  ENUM('strange','agility','intellect') NOT NULL,
    `cost`       INT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `rooms` (
    `name`          VARCHAR(20) PRIMARY KEY,
    `password_hash` VARCHAR(255),
    `max_players`   INT NOT NULL DEFAULT 2,
    `status`        ENUM('waiting','playing') NOT NULL DEFAULT 'waiting',
    `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `room_members` (
    `username`   VARCHAR(32) NOT NULL PRIMARY KEY ,
    `room_id`    VARCHAR(16) NOT NULL REFERENCES rooms(room_id),
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
