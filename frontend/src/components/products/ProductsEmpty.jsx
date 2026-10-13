import { PackageOpen, Plus, SearchX, Trash2 } from "lucide-react";

// Tres casos: filtros sin resultados, papelera vacía o catálogo vacío.
function ProductsEmpty({ inTrash, searching, onCreate }) {
  if (searching) {
    return (
      <div className="empty">
        <SearchX size={28} />
        <strong>Sin resultados</strong>
        <p>Ningún producto coincide con la búsqueda o la categoría elegida.</p>
      </div>
    );
  }

  if (inTrash) {
    return (
      <div className="empty">
        <Trash2 size={28} />
        <strong>La papelera está vacía</strong>
        <p>Los productos que mandes a la papelera aparecen aquí y se pueden restaurar.</p>
      </div>
    );
  }

  return (
    <div className="empty">
      <PackageOpen size={28} />
      <strong>Todavía no hay productos</strong>
      <p>Crea el primero para empezar a registrar ventas.</p>
      <button type="button" className="btn btn--primary" onClick={onCreate}>
        <Plus size={16} />
        Crear producto
      </button>
    </div>
  );
}

export default ProductsEmpty;
