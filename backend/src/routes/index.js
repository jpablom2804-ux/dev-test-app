const express = require("express");

const authenticateToken = require("../middleware/auth");
const healthRouter = require("./health");
const authRouter = require("./auth");
const productsRouter = require("./products");
const salesRouter = require("./sales");

const router = express.Router();

// Rutas públicas.
router.use("/api/health", healthRouter);
router.use("/api/auth", authRouter);

// Rutas que requieren un JWT válido en la cookie.
router.use("/api/products", authenticateToken, productsRouter);
router.use("/api/sales", authenticateToken, salesRouter);

module.exports = router;
