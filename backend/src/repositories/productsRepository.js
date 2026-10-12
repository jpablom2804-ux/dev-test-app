const pool = require("../db");

// Los productos usan soft delete: al eliminarlos se marcan con activo = 0
// en lugar de borrar la fila, para poder restaurarlos.

const PRODUCT_COLUMNS = `
  id,
  nombre,
  descripcion,
  precio,
  stock,
  created_at,
  updated_at
`;

function findActive() {
  return pool.query(`
    SELECT ${PRODUCT_COLUMNS}
    FROM products
    WHERE activo = 1
    ORDER BY id DESC
  `);
}

function findDeleted() {
  return pool.query(`
    SELECT ${PRODUCT_COLUMNS}
    FROM products
    WHERE activo = 0
    ORDER BY updated_at DESC
  `);
}

async function findActiveById(id) {
  const rows = await pool.query(
    `
    SELECT ${PRODUCT_COLUMNS}
    FROM products
    WHERE id = ?
    AND activo = 1
    `,
    [id]
  );

  return rows[0] ?? null;
}

// Devuelve el ID generado por MariaDB.
async function create({ nombre, descripcion, precio, stock }) {
  const result = await pool.query(
    `
    INSERT INTO products (nombre, descripcion, precio, stock)
    VALUES (?, ?, ?, ?)
    `,
    [nombre, descripcion, precio, stock]
  );

  return Number(result.insertId);
}

// Las funciones que modifican devuelven false si no había
// ningún producto en el estado esperado con ese ID.

async function update(id, { nombre, descripcion, precio, stock }) {
  const result = await pool.query(
    `
    UPDATE products
    SET nombre = ?, descripcion = ?, precio = ?, stock = ?
    WHERE id = ?
    AND activo = 1
    `,
    [nombre, descripcion, precio, stock, id]
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
  create,
  update,
  softDelete,
  restore,
  lockById,
  adjustStock,
};
