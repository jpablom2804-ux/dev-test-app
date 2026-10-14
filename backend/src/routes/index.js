const express = require("express");

const authenticateToken = require("../middleware/auth");
const healthRouter = require("./health");
const authRouter = require("./auth");
const categoriesRouter = require("./categories");
const productsRouter = require("./products");
const salesRouter = require("./sales");

const router = express.Router();

// FLUJO 3 · Elige el grupo de rutas según el inicio de la URL.
// Siguiente: Ctrl+clic en el archivo del grupo, arriba: "./auth", "./products"…
// Las rutas protegidas pasan antes por authenticateToken: Ctrl+clic en "../middleware/auth".

// Rutas públicas.
router.use("/api/health", healthRouter);
router.use("/api/auth", authRouter);

// Rutas que requieren un JWT válido en la cookie.
router.use("/api/categories", authenticateToken, categoriesRouter);
router.use("/api/products", authenticateToken, productsRouter);
router.use("/api/sales", authenticateToken, salesRouter);

module.exports = router;
