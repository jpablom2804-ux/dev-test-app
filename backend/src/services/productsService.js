const HttpError = require("../errors/HttpError");
const productsRepository = require("../repositories/productsRepository");

function parseId(rawId) {
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "El ID debe ser válido");
  }

  return id;
}

// Devuelve el mensaje del primer dato inválido, o null si el producto es válido.
// Los límites de longitud corresponden a las columnas de MariaDB.
function validateProduct({ nombre, descripcion, precio, stock }) {
  if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
    return "El nombre es obligatorio";
  }

  if (nombre.trim().length > 100) {
    return "El nombre no puede superar 100 caracteres";
  }

  if (descripcion !== undefined && descripcion !== null && typeof descripcion !== "string") {
    return "La descripción debe ser texto";
  }

  if (descripcion && descripcion.length > 255) {
    return "La descripción no puede superar 255 caracteres";
  }

  // Precio y stock pueden llegar como número o como texto numérico ("10").
  const precioNumero = Number(precio);

  if (
    precio === undefined ||
    precio === null ||
    precio === "" ||
    !Number.isFinite(precioNumero) ||
    precioNumero < 0
  ) {
    return "El precio debe ser un número mayor o igual a 0";
  }

  const stockNumero = Number(stock);

  if (
    stock === undefined ||
    stock === null ||
    stock === "" ||
    !Number.isInteger(stockNumero) ||
    stockNumero < 0
  ) {
    return "El stock debe ser un entero mayor o igual a 0";
  }

  return null;
}

// Valida el body recibido y lo deja listo para guardar:
// textos sin espacios sobrantes, descripción vacía como NULL
// y precio y stock como números.
function toProductData(body = {}) {
  const validationError = validateProduct(body);

  if (validationError) {
    throw new HttpError(400, validationError);
  }

  return {
    nombre: body.nombre.trim(),
    descripcion: body.descripcion?.trim() || null,
    precio: Number(body.precio),
    stock: Number(body.stock),
  };
}

function listActive() {
  return productsRepository.findActive();
}

function listDeleted() {
  return productsRepository.findDeleted();
}

async function getById(rawId) {
  const id = parseId(rawId);
  const product = await productsRepository.findActiveById(id);

  if (!product) {
    throw new HttpError(404, "Producto no encontrado");
  }

  return product;
}

async function create(body) {
  return productsRepository.create(toProductData(body));
}

async function update(rawId, body) {
  const id = parseId(rawId);
  const updated = await productsRepository.update(id, toProductData(body));

  if (!updated) {
    throw new HttpError(404, "Producto no encontrado");
  }
}

async function remove(rawId) {
  const id = parseId(rawId);
  const deleted = await productsRepository.softDelete(id);

  if (!deleted) {
    throw new HttpError(404, "Producto no encontrado");
  }
}

async function restore(rawId) {
  const id = parseId(rawId);
  const restored = await productsRepository.restore(id);

  if (!restored) {
    throw new HttpError(404, "Producto eliminado no encontrado");
  }
}

module.exports = {
  listActive,
  listDeleted,
  getById,
  create,
  update,
  remove,
  restore,
};
