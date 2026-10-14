const express = require("express");

const productsController = require("../controllers/productsController");

const router = express.Router();

// FLUJO 4 · Método + URL exactos → función del controller.
// Siguiente: Ctrl+clic en el nombre de la función, por ejemplo "create" en
// productsController.create (la que atiende POST /api/products).
router.get("/", productsController.list);
// /deleted debe ir antes de /:id; si no, Express tomaría "deleted" como un ID.
router.get("/deleted", productsController.listDeleted);
router.get("/:id", productsController.getById);
router.post("/", productsController.create);
router.put("/:id", productsController.update);
router.delete("/:id", productsController.remove);
router.patch("/:id/restore", productsController.restore);

module.exports = router;
