// ==================================================
// MARIADB CONNECTOR
// ==================================================

// Importamos el driver que permite a Node.js
// comunicarse con MariaDB.
const mariadb = require("mariadb");


// ==================================================
// POOL DE CONEXIONES
// ==================================================

// Creamos un pool de conexiones.
//
// En vez de crear una nueva conexión a MariaDB
// desde cero por cada petición:
//
// Request → abrir conexión → consultar → cerrar
//
// mantenemos varias conexiones disponibles
// para reutilizarlas:
//
// Backend
//    ↓
// Connection Pool
//    ↓
// MariaDB
const pool = mariadb.createPool({

    // Dirección de MariaDB.
    //
    // En Docker normalmente DB_HOST=db,
    // porque "db" es el nombre del servicio
    // definido en Docker Compose.
    host: process.env.DB_HOST,

    // Puerto utilizado por MariaDB.
    //
    // Las variables de entorno son texto,
    // por eso convertimos el puerto a Number.
    port: Number(
        process.env.DB_PORT
    ),

    // Usuario utilizado por la aplicación
    // para conectarse a la base de datos.
    user: process.env.DB_USER,

    // Contraseña del usuario de MariaDB.
    //
    // No se escribe directamente en el código;
    // proviene de una variable de entorno.
    password:
        process.env.DB_PASSWORD,

    // Base de datos que utilizará
    // nuestra aplicación.
    database:
        process.env.DB_NAME,

    // Máximo de conexiones que el pool
    // mantendrá disponibles simultáneamente.
    connectionLimit: 5
});


// ==================================================
// EXPORTAR EL POOL
// ==================================================

// Exportamos el pool para utilizarlo
// desde otros archivos.
//
// Por ejemplo:
//
// const pool = require("../db");
//
// connection = await pool.getConnection();
module.exports = pool;
