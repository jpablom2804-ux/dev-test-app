const HttpError = require("../errors/HttpError");
const categoriesRepository = require("../repositories/categoriesRepository");
const productsRepository = require("../repositories/productsRepository");
const { parsePositiveInt } = require("./validators");

function parseId(rawId) {
  return parsePositiveInt(rawId, "El ID debe ser válido");
}

// Devuelve el mensaje del primer dato inválido, o null si el producto es válido.
// Los límites de longitud corresponden a las columnas de MariaDB.
function validateProduct({ nombre, descripcion, precio, stock, category_id }) {
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

  const categoryId = Number(category_id);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return "Selecciona una categoría";
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
    category_id: Number(body.category_id),
  };
}

// La clave foránea igual rechazaría una categoría inexistente, pero con un
// error de base de datos (500); así el cliente recibe un mensaje claro.
async function ensureCategoryExists(categoryId) {
  if (!(await categoriesRepository.existsById(categoryId))) {
    throw new HttpError(400, "La categoría seleccionada no existe");
  }
}

// El nombre identifica al producto en toda la app (selector de ventas, historial,
// Dashboard), así que no puede repetirse entre los activos. Las variantes van en
// el nombre: "Samsung S24 128GB". Los productos en la papelera no cuentan.
async function ensureNameAvailable(nombre, excludeId) {
  if (await productsRepository.existsActiveByName(nombre, excludeId)) {
    throw new HttpError(409, `Ya existe un producto activo llamado "${nombre}"`);
  }
}

// `rawCategoryId` viene del query string (?categoryId=3) y es opcional.
function listActive(rawCategoryId) {
  const categoryId =
    rawCategoryId === undefined || rawCategoryId === ""
      ? null
      : parsePositiveInt(rawCategoryId, "La categoría debe ser un ID válido");

  return productsRepository.findActive(categoryId);
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
  const product = toProductData(body);
  await ensureCategoryExists(product.category_id);
  await ensureNameAvailable(product.nombre);

  return productsRepository.create(product);
}

async function update(rawId, body) {
  const id = parseId(rawId);
  const product = toProductData(body);
  await ensureCategoryExists(product.category_id);
  await ensureNameAvailable(product.nombre, id);

  const updated = await productsRepository.update(id, product);

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
  const product = await productsRepository.findDeletedById(id);

  if (!product) {
    throw new HttpError(404, "Producto eliminado no encontrado");
  }

  // Mientras estaba en la papelera pudo crearse otro producto con el mismo nombre.
  if (await productsRepository.existsActiveByName(product.nombre)) {
    throw new HttpError(
      409,
      `No se puede restaurar: ya existe un producto activo llamado "${product.nombre}". ` +
        "Cambia el nombre del producto activo y vuelve a intentarlo."
    );
  }

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
