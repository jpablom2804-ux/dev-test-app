const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const pool = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: "Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos."
  }
});




// ==================================================
// LOGIN
// ==================================================

router.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (
    !username ||
    typeof username !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      error: "Usuario y contraseña son obligatorios"
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();

    const users = await connection.query(
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

    if (users.length === 0) {
      return res.status(401).json({
        error: "Credenciales incorrectas"
      });
    }

    const user = users[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Credenciales incorrectas"
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn:
          process.env.JWT_EXPIRES_IN || "8h"
      }
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/"
    });

    return res.status(200).json({
      message: "Inicio de sesión correcto",
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Error en login:", error);

    return res.status(500).json({
      error: "Error interno del servidor"
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});


// ==================================================
// USUARIO ACTUAL
// ==================================================

router.get("/me", authenticateToken, (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user.userId,
      username: req.user.username,
      role: req.user.role
    }
  });
});


// ==================================================
// LOGOUT
// ==================================================

router.post("/logout", (req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/"
  });

  return res.status(200).json({
    message: "Sesión cerrada correctamente"
  });
});


module.exports = router;