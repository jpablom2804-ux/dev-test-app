import { Plus, ShoppingCart } from "lucide-react";

// Devuelve el mensaje del primer dato inválido, o null si la venta se puede enviar.
// El Backend vuelve a validar todo; esto solo evita una request que va a fallar.
function validateSale({ product_id, cantidad }, selectedProduct) {
  if (!Number.isInteger(product_id) || product_id <= 0) {
    return "Seleccione un producto válido.";
  }

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return "La cantidad debe ser mayor que 0.";
  }

  if (selectedProduct && cantidad > Number(selectedProduct.stock)) {
    return `Stock insuficiente. Disponible: ${selectedProduct.stock}`;
  }

  return null;
}

// Agrupa los productos por categoría, ambos en orden alfabético, para el selector.
// Los que no tienen categoría van al final.
function groupByCategory(products) {
  const groups = new Map();

  for (const product of [...products].sort((a, b) => a.nombre.localeCompare(b.nombre))) {
    const category = product.categoria ?? "Sin categoría";
    groups.set(category, [...(groups.get(category) ?? []), product]);
  }

  return [...groups.entries()].sort(([a], [b]) => {
    if (a === "Sin categoría") return 1;
    if (b === "Sin categoría") return -1;
    return a.localeCompare(b);
  });
}

// Formulario controlado: el producto y la cantidad (`draft`) viven en la página,
// porque el resumen de la venta también los necesita.
function SaleForm({ products, selectedProduct, draft, saving, onChange, onSubmit, onError }) {
  const canSubmit = !saving && selectedProduct && Number(selectedProduct.stock) > 0;

  const updateField = (field) => (event) => onChange({ ...draft, [field]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const sale = { product_id: Number(draft.productId), cantidad: Number(draft.quantity) };
    const validationError = validateSale(sale, selectedProduct);

    if (validationError) {
      onError(validationError);
      return;
    }

    onSubmit(sale);
  };

  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">
          <ShoppingCart size={16} />
          Registrar venta
        </h2>
      </div>

      <form className="panel__body sale-form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field__label" htmlFor="sale-product">
            Producto
          </label>
          <select id="sale-product" className="select" value={draft.productId} onChange={updateField("productId")}>
            <option value="">Seleccione un producto</option>
            {groupByCategory(products).map(([category, items]) => (
              <optgroup key={category} label={category}>
                {items.map((product) => (
                  <option key={product.id} value={product.id} disabled={Number(product.stock) === 0}>
                    {`${product.nombre} — Stock: ${product.stock}`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="sale-quantity">
            Cantidad
          </label>
          <input
            id="sale-quantity"
            type="number"
            className="input num"
            min="1"
            max={selectedProduct ? selectedProduct.stock : undefined}
            value={draft.quantity}
            onChange={updateField("quantity")}
          />
        </div>

        <button type="submit" className="btn btn--primary btn--block" disabled={!canSubmit}>
          <Plus size={16} />
          {saving ? "Registrando..." : "Registrar venta"}
        </button>
      </form>
    </section>
  );
}

export default SaleForm;
