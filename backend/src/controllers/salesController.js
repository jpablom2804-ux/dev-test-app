const salesService = require("../services/salesService");

async function list(req, res) {
  res.json(await salesService.listAll());
}

async function summary(req, res) {
  res.json(await salesService.getSummary());
}

async function create(req, res) {
  const sale = await salesService.create(req.body);
  res.status(201).json({ message: "Venta registrada correctamente", sale });
}

async function cancel(req, res) {
  const sale = await salesService.cancel(req.params.id);
  res.json({ message: "Venta anulada correctamente", sale });
}

module.exports = {
  list,
  summary,
  create,
  cancel,
};
