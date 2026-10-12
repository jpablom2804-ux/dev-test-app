import { Package, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { formatPrice } from "../../utils/format";
import { getStockStatus } from "../../utils/stock";

// Tabla de productos activos o de la papelera: cambian el estado y las acciones.
function ProductsTable({ products, inTrash, busy, onEdit, onDelete, onRestore }) {
  return (
    <div className="table-responsive">
      <table className="products-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th className="actions-column">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              inTrash={inTrash}
              busy={busy}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductRow({ product, inTrash, busy, onEdit, onDelete, onRestore }) {
  const stockStatus = getStockStatus(product.stock);

  return (
    <tr>
      <td>
        <div className="product-info">
          <div className="product-avatar">
            <Package size={19} />
          </div>
          <div>
            <strong>{product.nombre}</strong>
            <span>{product.descripcion || "Sin descripción"}</span>
          </div>
        </div>
      </td>

      <td className="price-cell">{formatPrice(product.precio)}</td>

      <td>{product.stock}</td>

      <td>
        {inTrash ? (
          <span className="stock-badge deleted-badge">En papelera</span>
        ) : (
          <span className={stockStatus.className}>{stockStatus.text}</span>
        )}
      </td>

      <td>
        {inTrash ? (
          <button className="restore-button" onClick={() => onRestore(product)} disabled={busy}>
            <RotateCcw size={16} />
            Restaurar
          </button>
        ) : (
          <div className="table-actions">
            <button className="icon-button" title="Editar producto" onClick={() => onEdit(product)}>
              <Pencil size={17} />
            </button>
            <button className="icon-button danger" title="Mover a papelera" onClick={() => onDelete(product)}>
              <Trash2 size={17} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default ProductsTable;
