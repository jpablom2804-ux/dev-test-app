import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Plus, Search, Trash2 } from "lucide-react";

import { categoriesApi } from "../api/categoriesApi";
import { productsApi } from "../api/productsApi";
import ConfirmDialog from "../components/ConfirmDialog";
import FeedbackMessage from "../components/FeedbackMessage";
import PageHeader from "../components/PageHeader";
import ProductFormModal from "../components/products/ProductFormModal";
import ProductsEmpty from "../components/products/ProductsEmpty";
import ProductsTable from "../components/products/ProductsTable";
import ProductTabs from "../components/products/ProductTabs";
import { useApiData } from "../hooks/useApiData";
import { formatPrice } from "../utils/format";
import { getInventoryValue } from "../utils/stock";

async function loadProductLists() {
  const [active, deleted, categories] = await Promise.all([
    productsApi.list(),
    productsApi.listDeleted(),
    categoriesApi.list(),
  ]);
  return { active, deleted, categories };
}

// La búsqueda y el filtro se aplican en el navegador: la lista ya está cargada
// y así responden al instante, sin una request por cada tecla.
function matchesFilters(product, text, categoryId) {
  const matchesCategory = !categoryId || Number(product.category_id) === Number(categoryId);
  const matchesText =
    !text ||
    product.nombre.toLowerCase().includes(text) ||
    (product.descripcion || "").toLowerCase().includes(text);

  return matchesCategory && matchesText;
}

function Products() {
  const {
    data: lists,
    loading: listsLoading,
    error: loadError,
    reload,
  } = useApiData(loadProductLists, { active: [], deleted: [], categories: [] });

  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
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
    return currentProducts.filter((product) => matchesFilters(product, text, categoryFilter));
  }, [currentProducts, search, categoryFilter]);

  const filtering = search.trim() !== "" || categoryFilter !== "";

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
    const product = {
      ...form,
      precio: Number(form.precio),
      stock: Number(form.stock),
      category_id: Number(form.category_id),
    };

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

  const inventoryMeta = listsLoading
    ? "Cargando inventario…"
    : `${formatPrice(getInventoryValue(lists.active))} en inventario · ${lists.active.length} activos`;

  return (
    <>
      <PageHeader
        meta={inventoryMeta}
        title="Productos"
        actions={
          !inTrash && (
            <button type="button" className="btn btn--primary" onClick={() => openForm(null)}>
              <Plus size={16} />
              Nuevo producto
            </button>
          )
        }
      />

      {message && (
        <FeedbackMessage type="success" icon={<CheckCircle size={16} />}>
          {message}
        </FeedbackMessage>
      )}

      {showPageError && (
        <FeedbackMessage type="error" icon={<AlertTriangle size={16} />}>
          {pageError}
        </FeedbackMessage>
      )}

      <section className="panel panel--table">
        <div className="toolbar">
          <ProductTabs
            activeTab={activeTab}
            activeCount={lists.active.length}
            deletedCount={lists.deleted.length}
            onChange={changeTab}
          />

          <div className="toolbar__filters">
            <select
              className="select toolbar__category"
              aria-label="Filtrar por categoría"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">Todas las categorías</option>
              {lists.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>

            <div className="input-icon toolbar__search">
              <Search size={16} />
              <input
                type="search"
                className="input"
                aria-label="Buscar productos"
                placeholder={inTrash ? "Buscar en la papelera" : "Buscar por nombre o descripción"}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </div>

        {listsLoading ? (
          <div className="empty">
            <p>Cargando productos…</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <ProductsEmpty inTrash={inTrash} searching={filtering} onCreate={() => openForm(null)} />
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

        {!listsLoading && currentProducts.length > 0 && (
          <div className="panel__footer">
            Mostrando {filteredProducts.length} de {currentProducts.length}
          </div>
        )}
      </section>

      {productToDelete && (
        <ConfirmDialog
          icon={Trash2}
          title="Mover a la papelera"
          message={
            <>
              ¿Mover <strong>{productToDelete.nombre}</strong> a la papelera?
            </>
          }
          info="No se borra: deja de aparecer en el catálogo y en ventas, y se puede restaurar desde la papelera."
          error={error}
          confirmLabel="Mover a la papelera"
          busyLabel="Moviendo..."
          busy={busy}
          onConfirm={deleteProduct}
          onCancel={closeDeleteDialog}
        />
      )}

      {formOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={lists.categories}
          saving={busy}
          error={error}
          onSubmit={saveProduct}
          onClose={closeForm}
        />
      )}
    </>
  );
}

export default Products;
