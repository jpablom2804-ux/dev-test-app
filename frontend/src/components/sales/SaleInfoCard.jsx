import { ShoppingCart } from "lucide-react";

const SALE_STEPS = ["Registrar venta", "Guardar movimiento", "Actualizar stock", "Actualizar Dashboard"];

// Tarjeta informativa: explica qué hace el sistema al registrar una venta.
function SaleInfoCard() {
  return (
    <section className="sale-info-card">
      <div className="sale-info-icon">
        <ShoppingCart size={25} />
      </div>

      <h3>¿Qué ocurre al vender?</h3>

      <p>
        Cuando registras una venta, el sistema guarda el movimiento y actualiza automáticamente el stock
        del producto.
      </p>

      <div className="sale-flow">
        {SALE_STEPS.map((step, index) => (
          <SaleStep key={step} label={step} isLast={index === SALE_STEPS.length - 1} />
        ))}
      </div>
    </section>
  );
}

function SaleStep({ label, isLast }) {
  return (
    <>
      <span>{label}</span>
      {!isLast && <span>↓</span>}
    </>
  );
}

export default SaleInfoCard;
