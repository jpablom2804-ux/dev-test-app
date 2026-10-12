import { Package, Plus, ShoppingCart } from "lucide-react";

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
    <section className="sale-form-card">
      <div className="sale-card-header">
        <div className="sale-header-icon">
          <ShoppingCart size={21} />
        </div>
        <div>
          <h2>Registrar venta</h2>
          <p>Selecciona un producto y la cantidad vendida</p>
        </div>
      </div>

      <form className="sale-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="sale-product">Producto</label>
          <select
            id="sale-product"
            className="sales-select"
            value={draft.productId}
            onChange={updateField("productId")}
          >
            <option value="">Seleccione un producto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id} disabled={Number(product.stock) === 0}>
                {`${product.nombre} — Stock: ${product.stock}`}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div className="selected-product-card">
            <div className="selected-product-icon">
              <Package size={20} />
            </div>
            <div>
              <span>Producto seleccionado</span>
              <strong>{selectedProduct.nombre}</strong>
            </div>
            <div className="selected-product-stock">
              <span>Stock disponible</span>
              <strong>{selectedProduct.stock}</strong>
            </div>
          </div>
        )}

        <div className="form-field">
          <label htmlFor="sale-quantity">Cantidad</label>
          <input
            id="sale-quantity"
            type="number"
            min="1"
            max={selectedProduct ? selectedProduct.stock : undefined}
            value={draft.quantity}
            onChange={updateField("quantity")}
          />
        </div>

        <button type="submit" className="primary-button sale-submit-button" disabled={!canSubmit}>
          <Plus size={18} />
          {saving ? "Registrando..." : "Registrar venta"}
        </button>
      </form>
    </section>
  );
}

export default SaleForm;
