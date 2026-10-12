import { useState } from "react";
import { AlertCircle, Ban, CheckCircle } from "lucide-react";

import { productsApi } from "../api/productsApi";
import { salesApi } from "../api/salesApi";
import ConfirmDialog from "../components/ConfirmDialog";
import FeedbackMessage from "../components/FeedbackMessage";
import SaleForm from "../components/sales/SaleForm";
import SaleInfoCard from "../components/sales/SaleInfoCard";
import SalesHistory from "../components/sales/SalesHistory";
import { useApiData } from "../hooks/useApiData";

async function loadSalesPage() {
  const [products, sales] = await Promise.all([productsApi.list(), salesApi.list()]);
  return { products, sales };
}

function Sales() {
  const { data, loading, error: loadError, reload } = useApiData(loadSalesPage, { products: [], sales: [] });

  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const showError = (message) => {
    setSuccess("");
    setError(message);
  };

  // Devuelve true si la venta se registró, para que el formulario se limpie.
  const registerSale = async (sale) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await salesApi.create(sale);
      setSuccess(result.message || "Venta registrada correctamente");
      await reload(); // actualiza el stock disponible y el historial
      return true;
    } catch (saleError) {
      setError(saleError.message);
      return false;
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
          <span className="page-eyebrow">Gestión comercial</span>
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
        <SaleForm products={data.products} saving={saving} onSubmit={registerSale} onError={showError} />
        <SaleInfoCard />
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
