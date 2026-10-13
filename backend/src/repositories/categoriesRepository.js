const pool = require("../db");

function findAll() {
  return pool.query(`
    SELECT id, nombre
    FROM categories
    ORDER BY nombre
  `);
}

async function existsById(id) {
  const rows = await pool.query("SELECT 1 FROM categories WHERE id = ? LIMIT 1", [id]);
  return rows.length > 0;
}

module.exports = {
  findAll,
  existsById,
};
