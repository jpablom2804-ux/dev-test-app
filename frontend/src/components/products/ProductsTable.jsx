import { Pencil, RotateCcw, Trash2 } from "lucide-react";

import { formatPrice } from "../../utils/format";
import StockLevel from "../StockLevel";

// Tabla de productos activos o de la papelera: solo cambian las acciones.
function ProductsTable({ products, inTrash, busy, onEdit, onDelete, onRestore }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th className="num">Precio</th>
            <th>Stock</th>
            <th className="data-table__actions-col">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td className="data-table__name">
                <strong>{product.nombre}</strong>
                <span>{product.descripcion || "Sin descripción"}</span>
              </td>

              <td className="num">{formatPrice(product.precio)}</td>

              <td>
                <StockLevel stock={product.stock} />
              </td>

              <td>
                <div className="data-table__actions">
                  {inTrash ? (
                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => onRestore(product)} disabled={busy}>
                      <RotateCcw size={14} />
                      Restaurar
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Editar producto"
                        aria-label={`Editar ${product.nombre}`}
                        onClick={() => onEdit(product)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        title="Mover a la papelera"
                        aria-label={`Mover ${product.nombre} a la papelera`}
                        onClick={() => onDelete(product)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductsTable;
