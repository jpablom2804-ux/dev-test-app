const express = require("express");

const authenticateToken = require("../middleware/auth");
const healthRouter = require("./health");
const authRouter = require("./auth");
const categoriesRouter = require("./categories");
const productsRouter = require("./products");
const salesRouter = require("./sales");

const router = express.Router();

// Elige el grupo de rutas según el inicio de la URL.
// FLUJO LOGIN 3 · /api/auth es pública. Siguiente: Ctrl+clic en "./auth" (arriba).
// FLUJO PROD 3 · /api/products pasa primero por el guardia authenticateToken.
// Siguiente: Ctrl+clic en "../middleware/auth" (arriba).

// Rutas públicas.
router.use("/api/health", healthRouter);
router.use("/api/auth", authRouter);

// Rutas que requieren un JWT válido en la cookie.
router.use("/api/categories", authenticateToken, categoriesRouter);
router.use("/api/products", authenticateToken, productsRouter);
router.use("/api/sales", authenticateToken, salesRouter);

module.exports = router;
