const mariadb = require("mariadb");

const { db } = require("./config");

// Pool de conexiones reutilizables: cada consulta toma una conexión libre
// en lugar de abrir y cerrar una nueva por petición.
const pool = mariadb.createPool({
  ...db,
  connectionLimit: 5,
});

module.exports = pool;
