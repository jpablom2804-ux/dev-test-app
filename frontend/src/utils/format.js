// Fecha y hora en formato de Costa Rica, por ejemplo "10/10/2026, 02:30 p. m.".
export function formatDate(date) {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Precio en dólares con dos decimales, por ejemplo "$10.50".
// El Backend puede enviarlo como número o como texto ("10.50").
export function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

// "1 unidad" o "3 unidades".
export function formatUnits(quantity) {
  return `${quantity} ${quantity === 1 ? "unidad" : "unidades"}`;
}
