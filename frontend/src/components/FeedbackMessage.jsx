// Aviso de éxito, advertencia o error. `type` es "success", "warning" o "error".
function FeedbackMessage({ type, icon, children }) {
  return (
    <div className={`alert alert--${type}`} role={type === "error" ? "alert" : "status"}>
      {icon}
      <span>{children}</span>
    </div>
  );
}

export default FeedbackMessage;
