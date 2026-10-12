import { AlertTriangle, ShoppingCart } from "lucide-react";

import { formatPrice } from "../../utils/format";
import { LOW_STOCK_LIMIT } from "../../utils/stock";

// Vista previa de la venta mientras se completa el formulario.
// Solo informa: el Backend vuelve a validar el stock al registrarla.
function SaleSummary({ product, quantity }) {
  return (
    <section className="sale-info-card">
      <div className="sale-info-icon">
        <ShoppingCart size={25} />
      </div>

      <h3>Resumen de la venta</h3>

      {product ? (
        <SummaryDetails product={product} quantity={quantity} />
      ) : (
        <p>Elige un producto para ver el total y cómo queda el stock.</p>
      )}
    </section>
  );
}

function SummaryDetails({ product, quantity }) {
  const units = Number.isInteger(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 0;
  const stock = Number(product.stock);
  const remaining = stock - units;
  const alert = getStockAlert(remaining);

  return (
    <>
      <div className="sale-summary-rows">
        <SummaryRow label="Precio unitario" value={formatPrice(product.precio)} />
        <SummaryRow label="Cantidad" value={`× ${units}`} />
        <SummaryRow label="Total" value={formatPrice(Number(product.precio) * units)} total />
        <SummaryRow label="Stock" value={`${stock} → ${Math.max(remaining, 0)}`} />
      </div>

      {alert && (
        <div className={`sale-summary-alert ${alert.type}`}>
          <AlertTriangle size={16} />
          {alert.text}
        </div>
      )}
    </>
  );
}

// Aviso según cómo quedaría el stock después de vender.
function getStockAlert(remaining) {
  if (remaining < 0) {
    return { type: "danger", text: "No hay stock suficiente para esta venta" };
  }

  if (remaining === 0) {
    return { type: "danger", text: "El producto quedará agotado" };
  }

  if (remaining <= LOW_STOCK_LIMIT) {
    return { type: "warning", text: "Quedará en stock bajo" };
  }

  return null;
}

function SummaryRow({ label, value, total = false }) {
  return (
    <div className={total ? "sale-summary-row sale-summary-total" : "sale-summary-row"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default SaleSummary;
