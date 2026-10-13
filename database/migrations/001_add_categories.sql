-- ==================================================
-- MIGRACIÓN 001: CATEGORÍAS DE PRODUCTOS
-- ==================================================
--
-- init.sql solo se ejecuta cuando el volumen de MariaDB
-- está vacío. Esta migración aplica los mismos cambios
-- a una base que ya existe, sin perder datos.
--
-- Se puede ejecutar más de una vez: cada paso comprueba
-- si ya está hecho (IF NOT EXISTS / INSERT IGNORE).
--
-- Uso, desde la carpeta del proyecto:
--
--   docker exec -i dev-test-db sh -c 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"' \
--     < database/migrations/001_add_categories.sql
--

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO categories (nombre) VALUES
    ('Smartphones'),
    ('Laptops'),
    ('Monitores'),
    ('Periféricos'),
    ('Componentes'),
    ('Almacenamiento'),
    ('Redes'),
    ('Audio'),
    ('Accesorios');

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS category_id INT NULL;

ALTER TABLE products
    ADD CONSTRAINT fk_products_category
        FOREIGN KEY IF NOT EXISTS (category_id)
        REFERENCES categories(id);
