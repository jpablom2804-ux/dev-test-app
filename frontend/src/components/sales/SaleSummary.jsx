import { AlertTriangle, Receipt } from "lucide-react";

import { formatPrice } from "../../utils/format";
import { LOW_STOCK_LIMIT } from "../../utils/stock";
import FeedbackMessage from "../FeedbackMessage";

// Vista previa de la venta mientras se completa el formulario.
// Solo informa: el Backend vuelve a validar el stock al registrarla.
function SaleSummary({ product, quantity }) {
  return (
    <section className="panel sale-summary">
      <div className="panel__header">
        <h2 className="panel__title">
          <Receipt size={16} />
          Resumen de la venta
        </h2>
      </div>

      <div className="panel__body">
        {product ? (
          <SummaryDetails product={product} quantity={quantity} />
        ) : (
          <p className="sale-summary__hint">Elige un producto para ver el total y cómo queda el stock.</p>
        )}
      </div>
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
      <p className="sale-summary__product">{product.nombre}</p>

      <dl className="sale-summary__rows">
        <SummaryRow label="Precio unitario" value={formatPrice(product.precio)} />
        <SummaryRow label="Cantidad" value={`× ${units}`} />
        <SummaryRow label="Stock" value={`${stock} → ${Math.max(remaining, 0)}`} />
        <SummaryRow label="Total" value={formatPrice(Number(product.precio) * units)} total />
      </dl>

      {alert && (
        <FeedbackMessage type={alert.type} icon={<AlertTriangle size={16} />}>
          {alert.text}
        </FeedbackMessage>
      )}
    </>
  );
}

// Aviso según cómo quedaría el stock después de vender.
function getStockAlert(remaining) {
  if (remaining < 0) {
    return { type: "error", text: "No hay stock suficiente para esta venta" };
  }

  if (remaining === 0) {
    return { type: "error", text: "El producto quedará agotado" };
  }

  if (remaining <= LOW_STOCK_LIMIT) {
    return { type: "warning", text: "Quedará en stock bajo" };
  }

  return null;
}

function SummaryRow({ label, value, total = false }) {
  return (
    <div className={total ? "sale-summary__row sale-summary__row--total" : "sale-summary__row"}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default SaleSummary;
