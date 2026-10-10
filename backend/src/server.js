// ==================================================
// DEPENDENCIAS PRINCIPALES
// ==================================================

// Express es el framework utilizado para crear
// el servidor HTTP, definir rutas y usar middlewares.
const express = require("express");
// CORS permite controlar peticiones realizadas
// desde otros orígenes.
// En el despliegue final React y la API pasan por Nginx,
// por lo que normalmente trabajan bajo el mismo origen.
const cors = require("cors");
// Permite leer las cookies recibidas por el Backend
// mediante req.cookies.
// Lo utilizamos para obtener la cookie que contiene el JWT.
const cookieParser = require("cookie-parser");
// Permite leer las cookies recibidas por el Backend
// mediante req.cookies.
// Lo utilizamos para obtener la cookie que contiene el JWT.
require("dotenv").config();
// ==================================================
// BASE DE DATOS
// ==================================================

// Importa el pool de conexiones hacia MariaDB.
// El pool se configura en db.js.
const pool = require("./db");
// ==================================================
// ROUTERS
// ==================================================

// Cada router agrupa endpoints relacionados
// con una funcionalidad específica.

// CRUD de productos:
// GET, POST, PUT, DELETE, PATCH...
const productsRouter = require("./routes/products");
// Autenticación:
// login, sesión actual y logout.
const authRouter = require("./routes/auth");
// Gestión de ventas:
// registrar ventas, historial y estadísticas.
const salesRouter = require("./routes/sales");
// ==================================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// ==================================================

// Este middleware verifica el JWT almacenado
// en la cookie antes de permitir acceso
// a determinadas rutas.
//
// Flujo:
// Request
// ↓
// authenticateToken
// ↓
// jwt.verify()
// ↓
// válido → next()
// inválido → 401
const authenticateToken = require("./middleware/auth");
// ==================================================
// CREACIÓN DE LA APLICACIÓN EXPRESS
// ==================================================

// Crea la instancia principal de Express.
const app = express(); 
// ==================================================
// CONFIGURACIÓN DEL REVERSE PROXY
// ==================================================

// Nuestra aplicación está detrás de Nginx.
//
// "trust proxy = 1" indica que Express puede confiar
// en la información enviada por un proxy anterior.
//
// Esto es importante, por ejemplo, para obtener
// correctamente la IP del cliente cuando utilizamos
// el Rate Limiter.
app.set("trust proxy", 1);

// ==================================================
// MIDDLEWARES GENERALES
// ==================================================

// Habilita CORS.
app.use(cors());
// Convierte automáticamente el JSON recibido
// en las peticiones y lo deja disponible en:
//
// req.body
//
// Por ejemplo:
//
// POST /api/products
//
// {
//   "nombre": "Mouse",
//   "stock": 10
// }
//
// puede ser leído con req.body.
app.use(express.json());
// Convierte las cookies recibidas en un objeto
// disponible mediante:
//
// req.cookies
//
// Nuestro middleware JWT utiliza esto para
// encontrar auth_token.
app.use(cookieParser());

// ==================================================
// HEALTH CHECK
// ==================================================

// Endpoint público utilizado para comprobar:
//
// 1. Que el Backend está ejecutándose.
// 2. Que el Backend puede conectarse con MariaDB.
//
// GET /health
app.get("/health", async (req, res) => {
    // Guardaremos temporalmente aquí
    // una conexión obtenida del pool.
    let connection;

    try {
        // Solicita una conexión disponible
        // al pool de MariaDB.
        connection = await pool.getConnection();
 // Consulta mínima utilizada únicamente
        // para comprobar que MariaDB responde.
        await connection.query("SELECT 1");
// Si Backend y DB funcionan correctamente,
        // respondemos HTTP 200.
        res.status(200).json({
            status: "ok",
            database: "connected"
        });

    } catch (error) {
        // Registramos el error en los logs
        // para poder diagnosticarlo.
        console.error("Error en health check:", error);
// Si no podemos comunicarnos con MariaDB,
        // respondemos HTTP 500.
        res.status(500).json({
            status: "error",
            database: "disconnected"
        });
// finally se ejecuta tanto si todo salió bien
        // como si ocurrió un error.
        //
        // Devolvemos la conexión al pool para que
        // pueda ser reutilizada por otra petición.
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Convierte las cookies recibidas en un objeto
// disponible mediante:
//
// req.cookies
//
// Nuestro middleware JWT utiliza esto para
// encontrar auth_token.
app.use("/api/auth", authRouter);

app.use(
  "/api/products",
  authenticateToken,
  productsRouter
);

app.use(
  "/api/sales",
  authenticateToken,
  salesRouter
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Servidor ejecutándose en el puerto ${PORT}`
    );
});