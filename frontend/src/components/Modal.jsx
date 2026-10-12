// Fondo oscuro con un cuadro encima. Un clic fuera del cuadro llama a onClose;
// un clic dentro no, porque stopPropagation impide que llegue al fondo.
function Modal({ className, onClose, children }) {
  return (
    <div className="modal-backdrop-custom" onMouseDown={onClose}>
      <div className={className} onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default Modal;
