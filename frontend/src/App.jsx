import { useEffect, useState } from "react";
import "./App.css";

const initialForm = {
  nombre: "",
  descripcion: "",
  precio: "",
  stock: ""
};

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando productos");
      }

      setProducts(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage(
      editingId
        ? "Actualizando producto..."
        : "Guardando producto..."
    );

    const method = editingId ? "PUT" : "POST";

    const url = editingId
      ? `/api/products/${editingId}`
      : "/api/products";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre: form.nombre,
          descripcion: form.descripcion,
          precio: Number(form.precio),
          stock: Number(form.stock)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error procesando producto");
      }

      setMessage(data.message);
      setForm(initialForm);
      setEditingId(null);

      await loadProducts();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);

    setForm({
      nombre: product.nombre,
      descripcion: product.descripcion || "",
      precio: product.precio,
      stock: product.stock
    });

    setMessage(`Editando producto ${product.id}`);
  };

  const deleteProduct = async (id) => {
    if (loading) return;

    const confirmDelete = window.confirm(
      "¿Desea eliminar este producto?"
    );

    if (!confirmDelete) return;

    setLoading(true);
    setMessage("Eliminando producto...");

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error eliminando producto");
      }

      setMessage(data.message);

      await loadProducts();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setMessage("");
  };

  return (
    <main className="container">

      <h1>Catálogo de productos</h1>

      <p className="subtitle">
        React + Express + MariaDB
      </p>

      <form onSubmit={handleSubmit} className="product-form">

        <input
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <input
          name="descripcion"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={handleChange}
          disabled={loading}
        />

        <input
          name="precio"
          type="number"
          step="0.01"
          min="0"
          placeholder="Precio"
          value={form.precio}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <input
          name="stock"
          type="number"
          min="0"
          placeholder="Stock"
          value={form.stock}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading
            ? "Procesando..."
            : editingId
              ? "Actualizar"
              : "Crear producto"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            disabled={loading}
          >
            Cancelar
          </button>
        )}

      </form>

      {message && (
        <p className="message">
          {message}
        </p>
      )}

      <table>

        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>

          {products.map((product) => (

            <tr key={product.id}>

              <td>{product.id}</td>
              <td>{product.nombre}</td>
              <td>{product.descripcion}</td>

              <td>
                ${Number(product.precio).toFixed(2)}
              </td>

              <td>{product.stock}</td>

              <td>

                <button
                  onClick={() => editProduct(product)}
                  disabled={loading}
                >
                  Editar
                </button>

                <button
                  onClick={() => deleteProduct(product.id)}
                  disabled={loading}
                >
                  Eliminar
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </main>
  );
}

export default App;
