const HttpError = require("../errors/HttpError");
const productsRepository = require("../repositories/productsRepository");
const salesRepository = require("../repositories/salesRepository");
const withTransaction = require("../repositories/withTransaction");
const { parsePositiveInt } = require("./validators");

const SUMMARY_LIMIT = 5;

function listAll() {
  return salesRepository.findAll();
}

// Las consultas van una tras otra para no ocupar
// varias conexiones del pool en una sola petición.
async function getSummary() {
  const unidadesVendidas = await salesRepository.countCompletedUnits();
  const productosMasVendidos = await salesRepository.findTopProducts(SUMMARY_LIMIT);
  const ventasRecientes = await salesRepository.findRecentCompleted(SUMMARY_LIMIT);

  return {
    unidades_vendidas: unidadesVendidas,
    productos_mas_vendidos: productosMasVendidos,
    ventas_recientes: ventasRecientes,
  };
}

// Guardar la venta y descontar el stock van en la misma transacción:
// o se aplican las dos cosas, o ninguna.
async function create({ product_id, cantidad } = {}) {
  const productId = parsePositiveInt(product_id, "Producto inválido");
  const quantity = parsePositiveInt(
    cantidad,
    "La cantidad debe ser un número entero mayor que 0"
  );

  return withTransaction(async (connection) => {
    const product = await productsRepository.lockById(connection, productId);

    // Un producto en la papelera no se puede vender.
    if (!product || Number(product.activo) !== 1) {
      throw new HttpError(404, "Producto no encontrado o no disponible");
    }

    const stock = Number(product.stock);

    if (stock < quantity) {
      throw new HttpError(400, `Stock insuficiente. Disponible: ${stock}`);
    }

    // Se guarda el precio actual para conservar el precio histórico
    // aunque el producto cambie de precio después.
    const id = await salesRepository.create(connection, {
      productId,
      quantity,
      unitPrice: product.precio,
    });

    await productsRepository.adjustStock(connection, productId, -quantity);

    return {
      id,
      product_id: productId,
      producto: product.nombre,
      cantidad: quantity,
      precio_unitario: Number(product.precio),
      stock_restante: stock - quantity,
      estado: "completada",
    };
  });
}

// Anular no borra la venta: la marca como anulada y devuelve al inventario
// las unidades que se descontaron, todo en la misma transacción.
async function cancel(rawId) {
  const saleId = parsePositiveInt(rawId, "ID de venta inválido");

  return withTransaction(async (connection) => {
    const sale = await salesRepository.lockById(connection, saleId);

    if (!sale) {
      throw new HttpError(404, "Venta no encontrada");
    }

    // Anular dos veces devolvería el stock dos veces.
    if (sale.estado !== "completada") {
      throw new HttpError(409, "Esta venta ya fue anulada");
    }

    const product = await productsRepository.lockById(connection, sale.product_id);

    // La clave foránea garantiza que el producto exista:
    // si falta, es un error interno y no del cliente.
    if (!product) {
      throw new Error(`No existe el producto ${sale.product_id} de la venta ${saleId}`);
    }

    const quantity = Number(sale.cantidad);

    await productsRepository.adjustStock(connection, sale.product_id, quantity);

    if (!(await salesRepository.markCancelled(connection, saleId))) {
      throw new HttpError(409, "La venta no pudo ser anulada");
    }

    return {
      id: saleId,
      estado: "anulada",
      unidades_reintegradas: quantity,
      stock_actual: Number(product.stock) + quantity,
    };
  });
}

module.exports = {
  listAll,
  getSummary,
  create,
  cancel,
};
