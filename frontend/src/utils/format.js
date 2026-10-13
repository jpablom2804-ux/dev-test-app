const priceFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

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

// Fecha de hoy en texto, por ejemplo "lunes, 12 de octubre".
export function formatToday() {
  return new Date().toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" });
}

export function isToday(date) {
  return new Date(date).toDateString() === new Date().toDateString();
}

// Precio en dólares con separador de miles, por ejemplo "$14,000.00".
// El Backend puede enviarlo como número o como texto ("10.50").
export function formatPrice(value) {
  return priceFormatter.format(Number(value));
}

// "1 unidad" o "3 unidades".
export function formatUnits(quantity) {
  return `${quantity} ${quantity === 1 ? "unidad" : "unidades"}`;
}
