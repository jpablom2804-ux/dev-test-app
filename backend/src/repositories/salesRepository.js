const pool = require("../db");

// MariaDB devuelve DECIMAL y SUM() como texto: los convertimos a Number
// antes de que salgan del repositorio.

// Historial completo, incluidas las ventas anuladas, para conservar la trazabilidad.
async function findAll() {
  const rows = await pool.query(`
    SELECT
      s.id,
      s.product_id,
      p.nombre AS producto,
      s.cantidad,
      s.precio_unitario,
      s.estado,
      s.created_at,
      s.anulada_at
    FROM sales s
    INNER JOIN products p ON p.id = s.product_id
    ORDER BY s.created_at DESC, s.id DESC
  `);

  return rows.map((sale) => ({
    ...sale,
    cantidad: Number(sale.cantidad),
    precio_unitario: Number(sale.precio_unitario),
  }));
}

// Las funciones del resumen solo cuentan ventas completadas:
// las anuladas no deben afectar los indicadores del Dashboard.

async function countCompletedUnits() {
  const rows = await pool.query(`
    SELECT COALESCE(SUM(cantidad), 0) AS unidades_vendidas
    FROM sales
    WHERE estado = 'completada'
  `);

  return Number(rows[0].unidades_vendidas);
}

async function findTopProducts(limit) {
  const rows = await pool.query(
    `
    SELECT p.id, p.nombre, SUM(s.cantidad) AS unidades_vendidas
    FROM sales s
    INNER JOIN products p ON p.id = s.product_id
    WHERE s.estado = 'completada'
    GROUP BY p.id, p.nombre
    ORDER BY unidades_vendidas DESC, p.nombre ASC
    LIMIT ?
    `,
    [limit]
  );

  return rows.map((product) => ({
    ...product,
    unidades_vendidas: Number(product.unidades_vendidas),
  }));
}

async function findRecentCompleted(limit) {
  const rows = await pool.query(
    `
    SELECT
      s.id,
      p.nombre AS producto,
      s.cantidad,
      s.precio_unitario,
      s.created_at
    FROM sales s
    INNER JOIN products p ON p.id = s.product_id
    WHERE s.estado = 'completada'
    ORDER BY s.created_at DESC, s.id DESC
    LIMIT ?
    `,
    [limit]
  );

  return rows.map((sale) => ({
    ...sale,
    cantidad: Number(sale.cantidad),
    precio_unitario: Number(sale.precio_unitario),
  }));
}

// Las siguientes funciones se usan dentro de withTransaction
// y reciben la conexión de la transacción.

// El estado se guarda como 'completada' por el DEFAULT de la tabla.
// Devuelve el ID generado por MariaDB.
async function create(connection, { productId, quantity, unitPrice }) {
  const result = await connection.query(
    `
    INSERT INTO sales (product_id, cantidad, precio_unitario)
    VALUES (?, ?, ?)
    `,
    [productId, quantity, unitPrice]
  );

  return Number(result.insertId);
}

// FOR UPDATE bloquea la venta hasta el final de la transacción,
// así dos peticiones no pueden anularla al mismo tiempo.
async function lockById(connection, id) {
  const rows = await connection.query(
    `
    SELECT id, product_id, cantidad, estado
    FROM sales
    WHERE id = ?
    FOR UPDATE
    `,
    [id]
  );

  return rows[0] ?? null;
}

// Devuelve false si la venta no estaba completada.
async function markCancelled(connection, id) {
  const result = await connection.query(
    `
    UPDATE sales
    SET estado = 'anulada', anulada_at = CURRENT_TIMESTAMP
    WHERE id = ?
    AND estado = 'completada'
    `,
    [id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  countCompletedUnits,
  findTopProducts,
  findRecentCompleted,
  create,
  lockById,
  markCancelled,
};
