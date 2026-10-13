import { getStockStatus, STOCK_BAR_FULL } from "../utils/stock";

// El stock como número + una barra de cuánto queda. El texto solo aparece
// cuando hay que actuar ("Stock bajo", "Agotado").
function StockLevel({ stock }) {
  const amount = Number(stock);
  const status = getStockStatus(amount);
  const percent = Math.min(amount / STOCK_BAR_FULL, 1) * 100;

  return (
    <span className={`stock-level stock-level--${status.level}`} title={status.text}>
      <span className="stock-level__value">{amount}</span>
      <span className="stock-level__track" aria-hidden="true">
        <span className="stock-level__fill" style={{ width: `${percent}%` }} />
      </span>
      {status.level !== "ok" && <span className="stock-level__label">{status.text}</span>}
    </span>
  );
}

export default StockLevel;
