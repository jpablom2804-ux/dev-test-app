const pool = require("../db");

// Los productos usan soft delete: al eliminarlos se marcan con activo = 0
// en lugar de borrar la fila, para poder restaurarlos.

// LEFT JOIN: un producto sin categoría (creado antes de que existieran)
// también aparece, con `categoria` en NULL, en lugar de desaparecer.
const PRODUCT_SELECT = `
  SELECT
    p.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.stock,
    p.category_id,
    c.nombre AS categoria,
    p.created_at,
    p.updated_at
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

// Sin `categoryId` devuelve todos los activos; con uno, solo los de esa categoría.
function findActive(categoryId = null) {
  return pool.query(
    `
    ${PRODUCT_SELECT}
    WHERE p.activo = 1
    AND (? IS NULL OR p.category_id = ?)
    ORDER BY p.id DESC
    `,
    [categoryId, categoryId]
  );
}

function findDeleted() {
  return pool.query(`
    ${PRODUCT_SELECT}
    WHERE p.activo = 0
    ORDER BY p.updated_at DESC
  `);
}

async function findActiveById(id) {
  const rows = await pool.query(
    `
    ${PRODUCT_SELECT}
    WHERE p.id = ?
    AND p.activo = 1
    `,
    [id]
  );

  return rows[0] ?? null;
}

async function findDeletedById(id) {
  const rows = await pool.query(
    `
    ${PRODUCT_SELECT}
    WHERE p.id = ?
    AND p.activo = 0
    `,
    [id]
  );

  return rows[0] ?? null;
}

// La collation de la columna (utf8mb4_uca1400_ai_ci) ignora mayúsculas,
// acentos y espacios finales: "Samsung S24" coincide con "samsung s24".
// `excludeId` evita que un producto choque consigo mismo al editarlo.
async function existsActiveByName(nombre, excludeId = 0) {
  const rows = await pool.query(
    `
    SELECT 1
    FROM products
    WHERE nombre = ?
    AND activo = 1
    AND id <> ?
    LIMIT 1
    `,
    [nombre, excludeId]
  );

  return rows.length > 0;
}

// FLUJO 8 · El INSERT en MariaDB (contenedor db). El id vuelve con return:
// repository → service → controller, que responde 201.
// Devuelve el ID generado por MariaDB.
async function create({ nombre, descripcion, precio, stock, category_id }) {
  const result = await pool.query(
    `
    INSERT INTO products (nombre, descripcion, precio, stock, category_id)
    VALUES (?, ?, ?, ?, ?)
    `,
    [nombre, descripcion, precio, stock, category_id]
  );

  return Number(result.insertId);
}

// Las funciones que modifican devuelven false si no había
// ningún producto en el estado esperado con ese ID.

async function update(id, { nombre, descripcion, precio, stock, category_id }) {
  const result = await pool.query(
    `
    UPDATE products
    SET nombre = ?, descripcion = ?, precio = ?, stock = ?, category_id = ?
    WHERE id = ?
    AND activo = 1
    `,
    [nombre, descripcion, precio, stock, category_id, id]
  );

  return result.affectedRows > 0;
}

async function softDelete(id) {
  const result = await pool.query(
    `
    UPDATE products
    SET activo = 0
    WHERE id = ?
    AND activo = 1
    `,
    [id]
  );

  return result.affectedRows > 0;
}

async function restore(id) {
  const result = await pool.query(
    `
    UPDATE products
    SET activo = 1
    WHERE id = ?
    AND activo = 0
    `,
    [id]
  );

  return result.affectedRows > 0;
}

// Las siguientes funciones se usan dentro de withTransaction
// y reciben la conexión de la transacción.

// FOR UPDATE bloquea el producto hasta el final de la transacción: si llegan
// dos ventas a la vez, la segunda espera y lee el stock ya descontado.
// Incluye productos inactivos; quien llama decide si los acepta.
async function lockById(connection, id) {
  const rows = await connection.query(
    `
    SELECT id, nombre, precio, stock, activo
    FROM products
    WHERE id = ?
    FOR UPDATE
    `,
    [id]
  );

  return rows[0] ?? null;
}

// `delta` negativo descuenta stock y positivo lo devuelve.
function adjustStock(connection, id, delta) {
  return connection.query(
    `
    UPDATE products
    SET stock = stock + ?
    WHERE id = ?
    `,
    [delta, id]
  );
}

module.exports = {
  findActive,
  findDeleted,
  findActiveById,
  findDeletedById,
  existsActiveByName,
  create,
  update,
  softDelete,
  restore,
  lockById,
  adjustStock,
};
