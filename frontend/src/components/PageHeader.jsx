// Encabezado de cada pantalla: un dato real arriba (fecha, valor del inventario…),
// el título y, a la derecha, las acciones principales.
function PageHeader({ meta, title, actions }) {
  return (
    <header className="page-header">
      <div>
        {meta && <span className="page-header__meta">{meta}</span>}
        <h1>{title}</h1>
      </div>

      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

export default PageHeader;
