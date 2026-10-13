import { Ban, History, ShoppingCart } from "lucide-react";

import { formatDate, formatPrice } from "../../utils/format";

// Historial completo: incluye las ventas anuladas para conservar la trazabilidad.
function SalesHistory({ sales, cancelling, onCancel }) {
  return (
    <section className="panel panel--table">
      <div className="panel__header">
        <h2 className="panel__title">
          <History size={16} />
          Historial de ventas
        </h2>
        <span className="panel__meta">
          {sales.length} {sales.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      {sales.length === 0 ? (
        <div className="empty">
          <ShoppingCart size={28} />
          <strong>Todavía no hay ventas</strong>
          <p>La primera venta que registres aparece aquí.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Venta</th>
                <th>Producto</th>
                <th className="num">Cantidad</th>
                <th className="num">Precio unitario</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className="data-table__actions-col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {sales.map((sale) => (
                <SaleRow key={sale.id} sale={sale} cancelling={cancelling} onCancel={onCancel} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SaleRow({ sale, cancelling, onCancel }) {
  const cancelled = sale.estado === "anulada";

  return (
    <tr>
      <td className="mono data-table__muted">#{sale.id}</td>
      <td className="data-table__name">
        <strong>{sale.producto}</strong>
      </td>
      <td className="num">{sale.cantidad}</td>
      {/* Precio del momento de la venta, aunque el producto haya cambiado de precio después. */}
      <td className="num">{formatPrice(sale.precio_unitario)}</td>
      <td className="mono data-table__muted">{formatDate(sale.created_at)}</td>
      <td>
        {cancelled ? (
          <span className="badge badge--neutral">Anulada</span>
        ) : (
          <span className="badge badge--success">Completada</span>
        )}
      </td>
      <td>
        <div className="data-table__actions">
          {sale.estado === "completada" && (
            <button
              type="button"
              className="btn btn--danger-soft btn--sm"
              onClick={() => onCancel(sale)}
              disabled={cancelling}
            >
              <Ban size={14} />
              Anular
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default SalesHistory;
