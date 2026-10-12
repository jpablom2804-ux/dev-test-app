// Aviso de éxito o error. `type` es "success" o "error".
function FeedbackMessage({ type, icon, children }) {
  return (
    <div className={`feedback-message ${type}-message`}>
      {icon}
      {children}
    </div>
  );
}

export default FeedbackMessage;
