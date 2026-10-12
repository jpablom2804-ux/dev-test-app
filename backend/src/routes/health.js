const express = require("express");

const pool = require("../db");

const router = express.Router();

// Comprueba que el Backend está activo y que MariaDB responde.
router.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Error en health check:", error);
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

module.exports = router;
