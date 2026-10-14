const express = require("express");

const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/auth");
const loginLimiter = require("../middleware/loginLimiter");

const router = express.Router();

// FLUJO 4 · Método + URL exactos. Las funciones corren en orden: primero loginLimiter
// (Ctrl+clic en "../middleware/loginLimiter") y, si deja pasar, el controller
// (Ctrl+clic en "login" de authController.login).
router.post("/login", loginLimiter, authController.login);
router.get("/me", authenticateToken, authController.me);
router.post("/logout", authController.logout);

module.exports = router;
