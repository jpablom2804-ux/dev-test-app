function ProductTabs({ activeTab, activeCount, deletedCount, onChange }) {
  return (
    <div className="product-tabs">
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
    <button className={selected ? "product-tab active" : "product-tab"} onClick={onClick}>
      {children}
      <span className="tab-count">{count}</span>
    </button>
  );
}

export default ProductTabs;
