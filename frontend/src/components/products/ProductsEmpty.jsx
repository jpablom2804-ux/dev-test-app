import { Package, Plus, Trash2 } from "lucide-react";

function ProductsEmpty({ inTrash, showCreate, onCreate }) {
  return (
    <div className="products-empty">
      <div className="empty-icon">{inTrash ? <Trash2 size={30} /> : <Package size={30} />}</div>

      <h3>{inTrash ? "La papelera está vacía" : "No hay productos"}</h3>

      <p>
        {inTrash
          ? "No hay productos eliminados actualmente."
          : "No encontramos productos que coincidan con tu búsqueda."}
      </p>

      {showCreate && (
        <button className="primary-button empty-create-button" onClick={onCreate}>
          <Plus size={18} />
          Crear primer producto
        </button>
      )}
    </div>
  );
}

export default ProductsEmpty;
