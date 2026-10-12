import { Ban, Clock, ShoppingCart } from "lucide-react";

import { formatDate, formatPrice, formatUnits } from "../../utils/format";

// Historial completo: incluye las ventas anuladas para conservar la trazabilidad.
function SalesHistory({ sales, cancelling, onCancel }) {
  return (
    <section className="sales-history-card">
      <div className="sales-history-header">
        <div>
          <div className="dashboard-panel-title">
            <Clock size={19} />
            <h2>Historial de ventas</h2>
          </div>
          <p>Movimientos registrados en el sistema</p>
        </div>

        <span className="sales-count">
          {sales.length} {sales.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      {sales.length === 0 ? (
        <div className="dashboard-empty">
          <ShoppingCart size={30} />
          <strong>No hay ventas registradas</strong>
          <span>La primera venta aparecerá aquí automáticamente.</span>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio unitario (USD)</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className="actions-column">Acciones</th>
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
  return (
    <tr>
      <td>
        <div className="product-info">
          <div className="product-avatar">
            <ShoppingCart size={17} />
          </div>
          <div>
            <strong>{sale.producto}</strong>
            <span>Venta #{sale.id}</span>
          </div>
        </div>
      </td>

      <td>
        <span className="sale-quantity-badge">{formatUnits(sale.cantidad)}</span>
      </td>

      {/* Precio del momento de la venta, aunque el producto haya cambiado de precio después. */}
      <td className="price-cell">{formatPrice(sale.precio_unitario)}</td>

      <td>{formatDate(sale.created_at)}</td>

      <td>
        {sale.estado === "anulada" ? (
          <span className="stock-badge deleted-badge">Anulada</span>
        ) : (
          <span className="stock-badge stock-ok">Completada</span>
        )}
      </td>

      <td>
        {sale.estado === "completada" ? (
          <button type="button" className="danger-button" onClick={() => onCancel(sale)} disabled={cancelling}>
            <Ban size={16} />
            Anular
          </button>
        ) : (
          <span>—</span>
        )}
      </td>
    </tr>
  );
}

export default SalesHistory;
