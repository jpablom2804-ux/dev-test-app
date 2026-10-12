import { AlertCircle } from "lucide-react";

import FeedbackMessage from "./FeedbackMessage";
import Modal from "./Modal";

// Confirmación de una acción delicada, como mover a la papelera o anular una venta.
// Muestra el error dentro del cuadro, porque mientras está abierto tapa la página.
function ConfirmDialog({ icon: Icon, title, message, info, error, confirmLabel, busyLabel, busy, onConfirm, onCancel }) {
  return (
    <Modal className="delete-modal" onClose={onCancel}>
      <div className="delete-modal-icon">
        <Icon size={24} />
      </div>

      <div className="delete-modal-content">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="delete-info">{info}</div>

        {error && (
          <FeedbackMessage type="error" icon={<AlertCircle size={18} />}>
            {error}
          </FeedbackMessage>
        )}
      </div>

      <div className="delete-modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="button" className="danger-button" onClick={onConfirm} disabled={busy}>
          <Icon size={17} />
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
