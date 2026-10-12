// Un producto con esta cantidad o menos (pero más de 0) se considera "stock bajo".
export const LOW_STOCK_LIMIT = 5;

export function getStockStatus(stock) {
  const amount = Number(stock);

  if (amount === 0) {
    return { text: "Sin stock", className: "stock-badge stock-out" };
  }

  if (amount <= LOW_STOCK_LIMIT) {
    return { text: "Stock bajo", className: "stock-badge stock-low" };
  }

  return { text: "En stock", className: "stock-badge stock-ok" };
}
