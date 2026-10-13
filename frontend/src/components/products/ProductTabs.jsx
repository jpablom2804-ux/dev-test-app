function ProductTabs({ activeTab, activeCount, deletedCount, onChange }) {
  return (
    <div className="tabs" role="group" aria-label="Lista de productos">
      <TabButton selected={activeTab === "active"} count={activeCount} onClick={() => onChange("active")}>
        Activos
      </TabButton>
      <TabButton selected={activeTab === "deleted"} count={deletedCount} onClick={() => onChange("deleted")}>
        Papelera
      </TabButton>
    </div>
  );
}

function TabButton({ selected, count, onClick, children }) {
  return (
    <button type="button" className={selected ? "tab tab--active" : "tab"} aria-pressed={selected} onClick={onClick}>
      {children}
      <span className="tab__count">{count}</span>
    </button>
  );
}

export default ProductTabs;
