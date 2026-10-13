import { PackageOpen, Plus, SearchX, Trash2 } from "lucide-react";

// Tres casos: papelera vacía, catálogo vacío o una búsqueda sin resultados.
function ProductsEmpty({ inTrash, searching, onCreate }) {
  if (inTrash) {
    return (
      <div className="empty">
        <Trash2 size={28} />
        <strong>La papelera está vacía</strong>
        <p>Los productos que mandes a la papelera aparecen aquí y se pueden restaurar.</p>
      </div>
    );
  }

  if (searching) {
    return (
      <div className="empty">
        <SearchX size={28} />
        <strong>Sin resultados</strong>
        <p>Ningún producto activo coincide con la búsqueda.</p>
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
