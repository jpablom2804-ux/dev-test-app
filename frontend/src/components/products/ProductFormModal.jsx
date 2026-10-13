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
    <Modal labelledBy="product-form-title" onClose={onClose}>
      <div className="modal__header">
        <div>
          <span className="modal__eyebrow">{isEditing ? `Producto #${product.id}` : "Nuevo registro"}</span>
          <h2 className="modal__title" id="product-form-title">
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </h2>
        </div>

        <button type="button" className="icon-btn icon-btn--ghost" aria-label="Cerrar" onClick={onClose} disabled={saving}>
          <X size={18} />
        </button>
      </div>

      {/* Los límites coinciden con las validaciones del Backend y las columnas de MariaDB. */}
      <form onSubmit={handleSubmit}>
        <div className="modal__body">
          <div className="field">
            <label className="field__label" htmlFor="nombre">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              className="input"
              placeholder="Ej. Samsung S24 256GB"
              value={form.nombre}
              onChange={handleChange}
              required
              disabled={saving}
              maxLength={100}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="descripcion">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              className="textarea"
              placeholder="Opcional"
              value={form.descripcion}
              onChange={handleChange}
              disabled={saving}
              rows="3"
              maxLength={255}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field__label" htmlFor="precio">
                Precio (USD)
              </label>
              <input
                id="precio"
                name="precio"
                type="number"
                className="input num"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.precio}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="stock">
                Stock
              </label>
              <input
                id="stock"
                name="stock"
                type="number"
                className="input num"
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
            <FeedbackMessage type="error" icon={<AlertTriangle size={16} />}>
              {error}
            </FeedbackMessage>
          )}
        </div>

        <div className="modal__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
