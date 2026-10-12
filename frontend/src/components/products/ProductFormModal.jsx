import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import FeedbackMessage from "../FeedbackMessage";
import Modal from "../Modal";

const EMPTY_FORM = { nombre: "", descripcion: "", precio: "", stock: "" };

function toForm(product) {
  if (!product) {
    return EMPTY_FORM;
  }

  return {
    nombre: product.nombre,
    descripcion: product.descripcion || "",
    precio: product.precio,
    stock: product.stock,
  };
}

// Formulario para crear (product = null) o editar un producto.
// Maneja sus propios campos y entrega el resultado con onSubmit.
function ProductFormModal({ product, saving, error, onSubmit, onClose }) {
  const [form, setForm] = useState(() => toForm(product));
  const isEditing = Boolean(product);
  const submitLabel = saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear producto";

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal className="product-modal" onClose={onClose}>
      <div className="modal-header-custom">
        <div>
          <span className="page-eyebrow">{isEditing ? `Producto #${product.id}` : "Nuevo registro"}</span>
          <h2>{isEditing ? "Editar producto" : "Nuevo producto"}</h2>
        </div>

        <button className="modal-close" onClick={onClose} disabled={saving}>
          <X size={20} />
        </button>
      </div>

      {/* Los límites coinciden con las validaciones del Backend y las columnas de MariaDB. */}
      <form onSubmit={handleSubmit} className="product-modal-form">
        <div className="form-field">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            placeholder="Ej. Monitor Gaming"
            value={form.nombre}
            onChange={handleChange}
            required
            disabled={saving}
            maxLength={100}
          />
        </div>

        <div className="form-field">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            placeholder="Descripción del producto"
            value={form.descripcion}
            onChange={handleChange}
            disabled={saving}
            rows="3"
            maxLength={255}
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="precio">Precio</label>
            <input
              id="precio"
              name="precio"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.precio}
              onChange={handleChange}
              required
              disabled={saving}
            />
          </div>

          <div className="form-field">
            <label htmlFor="stock">Stock</label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={form.stock}
              onChange={handleChange}
              required
              disabled={saving}
            />
          </div>
        </div>

        {error && (
          <FeedbackMessage type="error" icon={<AlertTriangle size={18} />}>
            {error}
          </FeedbackMessage>
        )}

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
