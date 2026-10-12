import { useState } from "react";
import { AlertCircle, Ban, CheckCircle } from "lucide-react";

import { productsApi } from "../api/productsApi";
import { salesApi } from "../api/salesApi";
import ConfirmDialog from "../components/ConfirmDialog";
import FeedbackMessage from "../components/FeedbackMessage";
import SaleForm from "../components/sales/SaleForm";
import SaleSummary from "../components/sales/SaleSummary";
import SalesHistory from "../components/sales/SalesHistory";
import { useApiData } from "../hooks/useApiData";
import { isToday } from "../utils/format";

const EMPTY_DRAFT = { productId: "", quantity: 1 };

async function loadSalesPage() {
  const [products, sales] = await Promise.all([productsApi.list(), salesApi.list()]);
  return { products, sales };
}

// Las anuladas no cuentan: no son ventas efectivas.
function countSalesToday(sales) {
  const count = sales.filter((sale) => sale.estado === "completada" && isToday(sale.created_at)).length;
  return `${count} ${count === 1 ? "venta" : "ventas"} hoy`;
}

function Sales() {
  const { data, loading, error: loadError, reload } = useApiData(loadSalesPage, { products: [], sales: [] });

  // La venta que se está armando. Vive aquí porque la usan el formulario y el resumen.
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const showError = (message) => {
    setSuccess("");
    setError(message);
  };

  const selectedProduct = data.products.find((product) => Number(product.id) === Number(draft.productId));

  const registerSale = async (sale) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await salesApi.create(sale);
      setSuccess(result.message || "Venta registrada correctamente");
      setDraft(EMPTY_DRAFT);
      await reload(); // actualiza el stock disponible y el historial
    } catch (saleError) {
      setError(saleError.message);
    } finally {
      setSaving(false);
    }
  };

  const openCancelDialog = (sale) => {
    setSaleToCancel(sale);
    setError("");
    setSuccess("");
  };

  const closeCancelDialog = () => {
    if (!cancelling) {
      setSaleToCancel(null);
      setError("");
    }
  };

  // El Backend devuelve el stock y marca la venta como anulada en una transacción.
  const cancelSale = async () => {
    if (cancelling) {
      return;
    }

    setCancelling(true);
    setError("");
    setSuccess("");

    try {
      const result = await salesApi.cancel(saleToCancel.id);
      setSuccess(result.message || `Venta #${saleToCancel.id} anulada correctamente`);
      setSaleToCancel(null);
      await reload();
    } catch (cancelError) {
      setError(cancelError.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="page-header">
        <div>
          <h1>Ventas</h1>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  // Mientras el diálogo de anulación está abierto, el error se muestra dentro de él.
  const pageError = error || loadError;

  return (
    <div className="sales-page">
      <div className="products-header">
        <div>
          <span className="page-eyebrow">{countSalesToday(data.sales)}</span>
          <h1>Ventas</h1>
          <p>Registra ventas y consulta los movimientos realizados</p>
        </div>
      </div>

      {success && (
        <FeedbackMessage type="success" icon={<CheckCircle size={18} />}>
          {success}
        </FeedbackMessage>
      )}

      {pageError && !saleToCancel && (
        <FeedbackMessage type="error" icon={<AlertCircle size={18} />}>
          {pageError}
        </FeedbackMessage>
      )}

      <div className="sales-layout">
        <SaleForm
          products={data.products}
          selectedProduct={selectedProduct}
          draft={draft}
          saving={saving}
          onChange={setDraft}
          onSubmit={registerSale}
          onError={showError}
        />
        <SaleSummary product={selectedProduct} quantity={draft.quantity} />
      </div>

      <SalesHistory sales={data.sales} cancelling={cancelling} onCancel={openCancelDialog} />

      {saleToCancel && (
        <ConfirmDialog
          icon={Ban}
          title="Anular venta"
          message={
            <>
              ¿Deseas anular la <strong>Venta #{saleToCancel.id}</strong> de{" "}
              <strong>{saleToCancel.producto}</strong>?
            </>
          }
          info={
            <>
              Esta operación no eliminará el registro del historial.
              <br />
              Las <strong>{saleToCancel.cantidad}</strong> unidades serán devueltas automáticamente al inventario.
            </>
          }
          error={error}
          confirmLabel="Anular venta"
          busyLabel="Anulando..."
          busy={cancelling}
          onConfirm={cancelSale}
          onCancel={closeCancelDialog}
        />
      )}
    </div>
  );
}

export default Sales;
