-- ============================================================
--  MAREJADA — Script de base de datos
--  Planificador inteligente de escapadas a la costa andaluza
-- ============================================================

CREATE DATABASE IF NOT EXISTS marejada
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE marejada;

-- ------------------------------------------------------------
-- Tabla: usuarios
-- Roles: 'usuario' | 'admin'
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id         INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100)    NOT NULL,
  email      VARCHAR(150)    NOT NULL UNIQUE,
  password   VARCHAR(255)    NOT NULL,           -- hash bcrypt
  rol        ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
  creado_en  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Tabla: etiquetas
-- Ejemplos: familia, pareja, aventura, gastronomía…
-- ------------------------------------------------------------
CREATE TABLE etiquetas (
  id     INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60)   NOT NULL UNIQUE
);

INSERT INTO etiquetas (nombre) VALUES
  ('familia'),
  ('pareja'),
  ('aventura'),
  ('gastronomía'),
  ('tranquilidad'),
  ('accesible'),
  ('naturaleza'),
  ('deporte'),
  ('cultural');

-- ------------------------------------------------------------
-- Tabla: planes
-- Cada plan representa una escapada costera de Andalucía
-- ------------------------------------------------------------
CREATE TABLE planes (
  id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  titulo        VARCHAR(200)    NOT NULL,
  descripcion   TEXT            NOT NULL,
  provincia     ENUM(
                  'Almería','Cádiz','Granada',
                  'Huelva','Málaga'
                ) NOT NULL,
  imagen_url    VARCHAR(500),
  activo        TINYINT(1)      NOT NULL DEFAULT 1,
  creado_en     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Tabla pivote: plan_etiquetas  (muchos a muchos)
-- ------------------------------------------------------------
CREATE TABLE plan_etiquetas (
  plan_id     INT UNSIGNED NOT NULL,
  etiqueta_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (plan_id, etiqueta_id),
  CONSTRAINT fk_pe_plan     FOREIGN KEY (plan_id)
    REFERENCES planes(id)   ON DELETE CASCADE,
  CONSTRAINT fk_pe_etiqueta FOREIGN KEY (etiqueta_id)
    REFERENCES etiquetas(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Tabla: valoraciones
-- Un usuario solo puede valorar un plan una vez
-- ------------------------------------------------------------
CREATE TABLE valoraciones (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED    NOT NULL,
  plan_id     INT UNSIGNED    NOT NULL,
  puntuacion  TINYINT UNSIGNED NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario  TEXT,
  visible     TINYINT(1)      NOT NULL DEFAULT 1,   -- moderación
  creado_en   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_valoracion (usuario_id, plan_id),
  CONSTRAINT fk_val_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_val_plan    FOREIGN KEY (plan_id)
    REFERENCES planes(id)   ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Tabla: favoritos
-- Planes guardados por cada usuario
-- ------------------------------------------------------------
CREATE TABLE favoritos (
  usuario_id  INT UNSIGNED NOT NULL,
  plan_id     INT UNSIGNED NOT NULL,
  guardado_en TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, plan_id),
  CONSTRAINT fk_fav_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_fav_plan    FOREIGN KEY (plan_id)
    REFERENCES planes(id)   ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Vista útil: valoración media por plan
-- Úsala en el backend con: SELECT * FROM vista_valoraciones_medias
-- ------------------------------------------------------------
CREATE VIEW vista_valoraciones_medias AS
  SELECT
    p.id                              AS plan_id,
    p.titulo,
    p.provincia,
    ROUND(AVG(v.puntuacion), 1)       AS valoracion_media,
    COUNT(v.id)                       AS total_valoraciones
  FROM planes p
  LEFT JOIN valoraciones v
         ON v.plan_id = p.id AND v.visible = 1
  GROUP BY p.id, p.titulo, p.provincia;