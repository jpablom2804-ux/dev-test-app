const productsService = require("../services/productsService");

// Los errores lanzados por el servicio llegan solos al errorHandler:
// Express 5 captura las promesas rechazadas de los handlers async.

async function list(req, res) {
  res.json(await productsService.listActive());
}

async function listDeleted(req, res) {
  res.json(await productsService.listDeleted());
}

async function getById(req, res) {
  res.json(await productsService.getById(req.params.id));
}

async function create(req, res) {
  const id = await productsService.create(req.body);
  res.status(201).json({ message: "Producto creado correctamente", id });
}

async function update(req, res) {
  await productsService.update(req.params.id, req.body);
  res.json({ message: "Producto actualizado correctamente" });
}

async function remove(req, res) {
  await productsService.remove(req.params.id);
  res.json({ message: "Producto movido a la papelera correctamente" });
}

async function restore(req, res) {
  await productsService.restore(req.params.id);
  res.json({ message: "Producto restaurado correctamente" });
}

module.exports = {
  list,
  listDeleted,
  getById,
  create,
  update,
  remove,
  restore,
};
