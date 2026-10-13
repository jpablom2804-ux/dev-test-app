import { AlertCircle } from "lucide-react";

import FeedbackMessage from "./FeedbackMessage";
import Modal from "./Modal";

// Confirmación de una acción delicada, como mover a la papelera o anular una venta.
// Muestra el error dentro del cuadro, porque mientras está abierto tapa la página.
function ConfirmDialog({ icon: Icon, title, message, info, error, confirmLabel, busyLabel, busy, onConfirm, onCancel }) {
  return (
    <Modal className="modal modal--sm" labelledBy="confirm-dialog-title" onClose={onCancel}>
      <div className="modal__header">
        <h2 className="modal__title modal__title--danger" id="confirm-dialog-title">
          <Icon size={18} />
          {title}
        </h2>
      </div>

      <div className="modal__body">
        <p>{message}</p>
        <div className="modal__note">{info}</div>

        {error && (
          <FeedbackMessage type="error" icon={<AlertCircle size={16} />}>
            {error}
          </FeedbackMessage>
        )}
      </div>

      <div className="modal__footer">
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy}>
          <Icon size={16} />
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
