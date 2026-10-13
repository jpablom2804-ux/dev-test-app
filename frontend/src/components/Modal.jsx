import { useEffect } from "react";

// Fondo oscuro con un cuadro encima. Se cierra con un clic fuera del cuadro
// o con Escape; un clic dentro no llega al fondo gracias a stopPropagation.
function Modal({ className = "modal", labelledBy, onClose, children }) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
