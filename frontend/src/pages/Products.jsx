import { useMemo, useState } from "react";
import { AlertTriangle, Package, Plus, Search, Trash2 } from "lucide-react";

import { productsApi } from "../api/productsApi";
import ConfirmDialog from "../components/ConfirmDialog";
import FeedbackMessage from "../components/FeedbackMessage";
import ProductFormModal from "../components/products/ProductFormModal";
import ProductsEmpty from "../components/products/ProductsEmpty";
import ProductsTable from "../components/products/ProductsTable";
import ProductTabs from "../components/products/ProductTabs";
import { useApiData } from "../hooks/useApiData";
import { formatPrice } from "../utils/format";
import { getInventoryValue } from "../utils/stock";

async function loadProductLists() {
  const [active, deleted] = await Promise.all([productsApi.list(), productsApi.listDeleted()]);
  return { active, deleted };
}

function matchesSearch(product, text) {
  return (
    product.nombre.toLowerCase().includes(text) ||
    (product.descripcion || "").toLowerCase().includes(text)
  );
}

function Products() {
  const {
    data: lists,
    loading: listsLoading,
    error: loadError,
    reload,
  } = useApiData(loadProductLists, { active: [], deleted: [] });

  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const inTrash = activeTab === "deleted";
  const currentProducts = inTrash ? lists.deleted : lists.active;

  const filteredProducts = useMemo(() => {
    const text = search.toLowerCase().trim();
    return text ? currentProducts.filter((product) => matchesSearch(product, text)) : currentProducts;
  }, [currentProducts, search]);

  // Ejecuta una operación sobre el Backend: bloquea los botones mientras dura,
  // muestra el resultado y recarga las listas. Devuelve true si salió bien.
  const runAction = async (action, successMessage) => {
    if (busy) {
      return false;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await action();
      setMessage(successMessage);
      await reload();
      return true;
    } catch (actionError) {
      setError(actionError.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openForm = (product) => {
    setEditingProduct(product);
    setError("");
    setFormOpen(true);
  };

  const resetForm = () => {
    setFormOpen(false);
    setEditingProduct(null);
    setError("");
  };

  const closeForm = () => {
    if (!busy) {
      resetForm();
    }
  };

  const saveProduct = async (form) => {
    // Los inputs entregan texto; el Backend espera números.
    const product = { ...form, precio: Number(form.precio), stock: Number(form.stock) };

    const saved = await runAction(
      () => (editingProduct ? productsApi.update(editingProduct.id, product) : productsApi.create(product)),
      editingProduct ? "Producto actualizado correctamente." : "Producto creado correctamente."
    );

    if (saved) {
      resetForm();
    }
  };

  const openDeleteDialog = (product) => {
    setProductToDelete(product);
    setError("");
    setMessage("");
  };

  const closeDeleteDialog = () => {
    if (!busy) {
      setProductToDelete(null);
      setError("");
    }
  };

  // Soft delete: el producto queda en la papelera y se puede restaurar.
  const deleteProduct = async () => {
    const deleted = await runAction(
      () => productsApi.remove(productToDelete.id),
      `"${productToDelete.nombre}" fue movido a la papelera.`
    );

    if (deleted) {
      setProductToDelete(null);
    }
  };

  const restoreProduct = (product) =>
    runAction(() => productsApi.restore(product.id), `"${product.nombre}" fue restaurado correctamente.`);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearch("");
    setMessage("");
    setError("");
  };

  // Mientras hay un modal abierto, el error se muestra dentro del modal.
  const pageError = error || loadError;
  const showPageError = pageError && !formOpen && !productToDelete;

  return (
    <div className="products-page">
      <div className="products-header">
        <div>
          <span className="page-eyebrow">
            {listsLoading ? "Inventario" : `Valor del inventario: ${formatPrice(getInventoryValue(lists.active))}`}
          </span>
          <h1>Productos</h1>
          <p>Administra los productos disponibles en el catálogo.</p>
        </div>

        {!inTrash && (
          <button className="primary-button" onClick={() => openForm(null)}>
            <Plus size={18} />
            Nuevo producto
          </button>
        )}
      </div>

      <ProductTabs
        activeTab={activeTab}
        activeCount={lists.active.length}
        deletedCount={lists.deleted.length}
        onChange={changeTab}
      />

      {message && <FeedbackMessage type="success">{message}</FeedbackMessage>}

      {showPageError && (
        <FeedbackMessage type="error" icon={<AlertTriangle size={18} />}>
          {pageError}
        </FeedbackMessage>
      )}

      <div className="products-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder={inTrash ? "Buscar en la papelera..." : "Buscar productos activos..."}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="product-counter">
          <Package size={18} />
          {filteredProducts.length}
          {inTrash ? " en papelera" : " productos activos"}
        </div>
      </div>

      <div className="products-card">
        {listsLoading ? (
          <div className="products-empty">
            <p>Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <ProductsEmpty
            inTrash={inTrash}
            showCreate={!inTrash && lists.active.length === 0}
            onCreate={() => openForm(null)}
          />
        ) : (
          <ProductsTable
            products={filteredProducts}
            inTrash={inTrash}
            busy={busy}
            onEdit={openForm}
            onDelete={openDeleteDialog}
            onRestore={restoreProduct}
          />
        )}
      </div>

      {productToDelete && (
        <ConfirmDialog
          icon={Trash2}
          title="Mover a papelera"
          message={
            <>
              ¿Deseas mover <strong>{productToDelete.nombre}</strong> a la papelera?
            </>
          }
          info="El producto no se eliminará permanentemente. Podrás restaurarlo posteriormente desde la papelera."
          error={error}
          confirmLabel="Mover a papelera"
          busyLabel="Moviendo..."
          busy={busy}
          onConfirm={deleteProduct}
          onCancel={closeDeleteDialog}
        />
      )}

      {formOpen && (
        <ProductFormModal
          product={editingProduct}
          saving={busy}
          error={error}
          onSubmit={saveProduct}
          onClose={closeForm}
        />
      )}
    </div>
  );
}

export default Products;
