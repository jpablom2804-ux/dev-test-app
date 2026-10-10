// ==================================================
// DEPENDENCIAS
// ==================================================

// Express permite crear el router que agrupa
// los endpoints relacionados con autenticación.
const express = require("express");

// bcrypt se utiliza para comparar la contraseña
// ingresada por el usuario con el hash almacenado
// en la base de datos.
//
// La contraseña real nunca se guarda directamente.
const bcrypt = require("bcryptjs");

// jsonwebtoken permite crear el JWT que representa
// la sesión autenticada del usuario.
const jwt = require("jsonwebtoken");

// express-rate-limit limita la cantidad de intentos
// de login para reducir ataques de fuerza bruta.
const rateLimit = require("express-rate-limit");


// ==================================================
// RECURSOS INTERNOS
// ==================================================

// Pool de conexiones hacia MariaDB.
const pool = require("../db");

// Middleware que verifica si un JWT es válido.
// Se utiliza para proteger /me.
const authenticateToken =
  require("../middleware/auth");


// ==================================================
// ROUTER DE AUTENTICACIÓN
// ==================================================

// Creamos un router independiente para agrupar:
//
// POST /login
// GET  /me
// POST /logout
//
// Desde server.js este router se monta en:
//
// /api/auth
//
// Por lo tanto las rutas finales serán:
//
// POST /api/auth/login
// GET  /api/auth/me
// POST /api/auth/logout
const router = express.Router();


// ==================================================
// RATE LIMITER PARA LOGIN
// ==================================================
//
// Limita los intentos fallidos de inicio de sesión.
//
// Objetivo:
//
// atacante
// ↓
// muchos intentos de contraseña
// ↓
// Rate Limiter
// ↓
// máximo 5 intentos fallidos
// cada 15 minutos
//
const loginLimiter = rateLimit({

  // Ventana de tiempo del límite.
  //
  // 15 minutos:
  // 15 * 60 * 1000 milisegundos
  windowMs: 15 * 60 * 1000,

  // Máximo de intentos permitidos
  // dentro de la ventana.
  limit: 5,

  // Incluye headers estándar relacionados
  // con el Rate Limit en la respuesta HTTP.
  standardHeaders: true,

  // Desactiva los headers antiguos
  // utilizados por versiones anteriores.
  legacyHeaders: false,

  // Los inicios de sesión exitosos
  // no cuentan dentro del límite.
  //
  // Por ejemplo:
  //
  // login correcto
  // → no consume uno de los 5 intentos
  //
  // login incorrecto
  // → sí consume un intento
  skipSuccessfulRequests: true,

  // Respuesta enviada cuando el usuario
  // supera el límite permitido.
  message: {
    error:
      "Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos."
  }
});


// ==================================================
// LOGIN
// ==================================================
//
// Flujo completo:
//
// username + password
// ↓
// Rate Limiter
// ↓
// validar datos
// ↓
// buscar usuario en MariaDB
// ↓
// bcrypt.compare()
// ↓
// contraseña correcta
// ↓
// jwt.sign()
// ↓
// JWT
// ↓
// cookie HttpOnly
// ↓
// HTTP 200
//
router.post(
  "/login",
  loginLimiter,
  async (req, res) => {

    // Extraemos usuario y contraseña
    // del JSON recibido en req.body.
    const {
      username,
      password
    } = req.body;


    // ==================================================
    // VALIDACIÓN DE DATOS
    // ==================================================

    // Verificamos que ambos campos:
    //
    // - existan;
    // - sean strings.
    //
    // Si faltan datos respondemos HTTP 400.
    if (
      !username ||
      typeof username !== "string" ||
      !password ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error:
          "Usuario y contraseña son obligatorios"
      });
    }


    // Variable que almacenará temporalmente
    // la conexión obtenida del pool.
    let connection;

    try {

      // ==================================================
      // OBTENER CONEXIÓN A MARIADB
      // ==================================================

      connection =
        await pool.getConnection();


      // ==================================================
      // BUSCAR USUARIO
      // ==================================================

      // Buscamos el usuario por username.
      //
      // El signo ? representa un parámetro
      // que será enviado por separado.
      //
      // Esto evita concatenar directamente
      // datos del usuario dentro del SQL y ayuda
      // a prevenir SQL Injection.
      const users =
        await connection.query(
          `
          SELECT
            id,
            username,
            password_hash,
            role
          FROM users
          WHERE username = ?
          LIMIT 1
          `,
          [username.trim()]
        );


      // ==================================================
      // USUARIO NO ENCONTRADO
      // ==================================================

      // Si no existe ningún registro,
      // devolvemos 401.
      //
      // No decimos "usuario no existe"
      // para no revelar información innecesaria.
      if (users.length === 0) {
        return res.status(401).json({
          error:
            "Credenciales incorrectas"
        });
      }


      // Obtenemos el primer usuario encontrado.
      const user = users[0];


      // ==================================================
      // VERIFICAR CONTRASEÑA
      // ==================================================

      // bcrypt.compare() recibe:
      //
      // 1. contraseña ingresada
      // 2. hash almacenado en MariaDB
      //
      // bcrypt realiza la comparación
      // sin necesitar recuperar la contraseña original.
      const passwordMatches =
        await bcrypt.compare(
          password,
          user.password_hash
        );


      // Si la contraseña no coincide,
      // respondemos HTTP 401.
      if (!passwordMatches) {
        return res.status(401).json({
          error:
            "Credenciales incorrectas"
        });
      }


      // ==================================================
      // CREAR JWT
      // ==================================================

      // Una vez verificadas las credenciales,
      // generamos el JWT.
      //
      // El payload contiene información
      // que necesitaremos posteriormente.
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role
        },

        // Secreto utilizado para firmar el JWT.
        // Se obtiene desde variables de entorno
        // y no debe escribirse directamente
        // dentro del código.
        process.env.JWT_SECRET,

        {
          // Tiempo de expiración del JWT.
          //
          // Si JWT_EXPIRES_IN no existe,
          // utilizamos 8 horas.
          expiresIn:
            process.env.JWT_EXPIRES_IN ||
            "8h"
        }
      );


      // ==================================================
      // GUARDAR JWT EN COOKIE
      // ==================================================

      // Enviamos el JWT al navegador dentro
      // de una cookie llamada auth_token.
      res.cookie(
        "auth_token",
        token,
        {

          // Impide que JavaScript del navegador
          // pueda leer directamente esta cookie.
          //
          // Ayuda a proteger el token frente
          // a ciertos ataques XSS.
          httpOnly: true,

          // En producción con HTTPS debe ser true.
          //
          // En nuestro entorno local HTTP
          // puede permanecer false.
          secure:
            process.env.COOKIE_SECURE ===
            "true",

          // Limita el envío de la cookie
          // en determinados contextos externos.
          sameSite: "lax",

          // Hace que la cookie pueda utilizarse
          // en todas las rutas de la aplicación.
          path: "/"
        }
      );


      // ==================================================
      // RESPUESTA EXITOSA
      // ==================================================

      // Login correcto.
      //
      // No devolvemos:
      // - contraseña;
      // - password_hash;
      // - JWT en el JSON.
      //
      // El JWT viaja en la cookie HttpOnly.
      return res.status(200).json({
        message:
          "Inicio de sesión correcto",

        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });

    } catch (error) {

      // ==================================================
      // ERROR INTERNO
      // ==================================================

      // Registramos el error real únicamente
      // en los logs del servidor.
      console.error(
        "Error en login:",
        error
      );

      // Al cliente le enviamos un mensaje genérico
      // para no revelar detalles internos.
      return res.status(500).json({
        error:
          "Error interno del servidor"
      });

    } finally {

      // ==================================================
      // LIBERAR CONEXIÓN
      // ==================================================

      // Tanto si el login funciona como si falla,
      // devolvemos la conexión al pool.
      if (connection) {
        connection.release();
      }
    }
  }
);


// ==================================================
// USUARIO ACTUAL
// ==================================================
//
// GET /api/auth/me
//
// Se utiliza principalmente cuando React necesita
// saber si existe una sesión válida.
//
// Request
// ↓
// authenticateToken
// ↓
// verifica JWT
// ↓
// req.user
// ↓
// devolver información del usuario
//
router.get(
  "/me",
  authenticateToken,
  (req, res) => {

    // authenticateToken ya verificó el JWT
    // y almacenó su payload en req.user.
    return res.status(200).json({
      user: {
        id: req.user.userId,
        username: req.user.username,
        role: req.user.role
      }
    });
  }
);


// ==================================================
// LOGOUT
// ==================================================
//
// POST /api/auth/logout
//
// Para cerrar la sesión eliminamos
// la cookie que contiene el JWT.
router.post(
  "/logout",
  (req, res) => {

    // Para eliminar correctamente la cookie,
    // utilizamos las mismas opciones principales
    // utilizadas cuando fue creada.
    res.clearCookie(
      "auth_token",
      {
        httpOnly: true,
        secure:
          process.env.COOKIE_SECURE ===
          "true",
        sameSite: "lax",
        path: "/"
      }
    );

    return res.status(200).json({
      message:
        "Sesión cerrada correctamente"
    });
  }
);


// ==================================================
// EXPORTAR ROUTER
// ==================================================

module.exports = router;