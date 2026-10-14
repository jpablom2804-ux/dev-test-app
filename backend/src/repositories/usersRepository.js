const pool = require("../db");

// FLUJO LOGIN 8 · El único lugar con SQL: consulta MariaDB (contenedor db) y devuelve la
// fila con return. Desde aquí la respuesta vuelve: service → controller → res.
// Incluye password_hash: solo sirve para verificar credenciales
// y nunca debe enviarse al cliente.
async function findByUsername(username) {
  const rows = await pool.query(
    `
    SELECT id, username, password_hash, role
    FROM users
    WHERE username = ?
    LIMIT 1
    `,
    [username]
  );

  return rows[0] ?? null;
}

// Devuelve el ID generado. Falla con ER_DUP_ENTRY si el username ya existe,
// porque la columna es UNIQUE.
async function create({ username, passwordHash }) {
  const result = await pool.query(
    `
    INSERT INTO users (username, password_hash)
    VALUES (?, ?)
    `,
    [username, passwordHash]
  );

  return Number(result.insertId);
}

module.exports = {
  findByUsername,
  create,
};
