// Un producto con esta cantidad o menos (pero más de 0) se considera "stock bajo".
export const LOW_STOCK_LIMIT = 5;

// La barra de nivel se ve llena desde 4 veces el mínimo (20 unidades). Así se nota
// que un producto se acerca al mínimo antes de que entre en alerta.
export const STOCK_BAR_FULL = LOW_STOCK_LIMIT * 4;

// Cuánto vale todo lo que hay en bodega: precio × stock de cada producto.
export function getInventoryValue(products) {
  return products.reduce((total, product) => total + Number(product.precio) * Number(product.stock), 0);
}

// `level` sirve para el estilo ("out", "low" u "ok") y `text` para mostrarlo.
export function getStockStatus(stock) {
  const amount = Number(stock);

  if (amount === 0) {
    return { level: "out", text: "Agotado" };
  }

  if (amount <= LOW_STOCK_LIMIT) {
    return { level: "low", text: "Stock bajo" };
  }

  return { level: "ok", text: "En stock" };
}

// Productos activos que necesitan reposición, del más urgente al menos urgente.
export function getProductsToRestock(products) {
  return products
    .filter((product) => Number(product.stock) <= LOW_STOCK_LIMIT)
    .sort((a, b) => Number(a.stock) - Number(b.stock));
}
