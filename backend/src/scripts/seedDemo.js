// Carga un catálogo de demostración: 30 productos en 9 categorías y 20 ventas
// repartidas en los últimos 6 días (2 de ellas anuladas).
//
// Reutiliza los mismos services que la API: los productos pasan las mismas
// validaciones y cada venta descuenta stock dentro de la misma transacción.
//
// Uso dentro del contenedor:
//   docker compose exec backend npm run seed-demo -- --reset
//
// --reset borra antes TODOS los productos y ventas. Los usuarios no se tocan.
require("dotenv").config();

const pool = require("../db");
const categoriesRepository = require("../repositories/categoriesRepository");
const productsService = require("../services/productsService");
const salesService = require("../services/salesService");

// `stock` es el que debe quedar DESPUÉS de las ventas de abajo.
const PRODUCTS = [
  { categoria: "Smartphones", nombre: "iPhone 18 Pro 256GB", descripcion: "Titanio natural, pantalla de 6.3\"", precio: 1199, stock: 12 },
  { categoria: "Smartphones", nombre: "iPhone 18 Pro 1TB", descripcion: "Titanio negro, pantalla de 6.3\"", precio: 1599, stock: 4 },
  { categoria: "Smartphones", nombre: "iPhone 18 Pro Max 512GB", descripcion: "Titanio desierto, pantalla de 6.9\"", precio: 1499, stock: 7 },
  { categoria: "Smartphones", nombre: "Samsung Galaxy S26 Ultra 512GB", descripcion: "Con S Pen y cámara de 200 MP", precio: 1299, stock: 9 },
  { categoria: "Smartphones", nombre: "Samsung Galaxy S26 256GB", descripcion: "Pantalla de 6.2\" y 12 GB de RAM", precio: 899, stock: 15 },
  { categoria: "Smartphones", nombre: "Google Pixel 11 Pro 256GB", descripcion: "Tensor G6 y 16 GB de RAM", precio: 999, stock: 0 },

  { categoria: "Laptops", nombre: "MacBook Air 13\" M5 16GB 512GB", descripcion: "Chip M5, color medianoche", precio: 1299, stock: 8 },
  { categoria: "Laptops", nombre: "MacBook Pro 14\" M5 Pro 24GB 1TB", descripcion: "Pantalla Liquid Retina XDR", precio: 2399, stock: 3 },
  { categoria: "Laptops", nombre: "Dell XPS 14 Core Ultra 7 32GB 1TB", descripcion: "Pantalla OLED 3.2K", precio: 1899, stock: 5 },
  { categoria: "Laptops", nombre: "Lenovo ThinkPad T14 Gen 6 16GB 512GB", descripcion: "Ryzen 7 PRO, teclado en español", precio: 1349, stock: 10 },
  { categoria: "Laptops", nombre: "ASUS ROG Zephyrus G16 RTX 5070", descripcion: "Core Ultra 9, 32 GB y pantalla de 240 Hz", precio: 2199, stock: 2 },

  { categoria: "Monitores", nombre: "Dell UltraSharp U2725Q 27\" 4K", descripcion: "Panel IPS Black y USB-C de 90 W", precio: 649, stock: 6 },
  { categoria: "Monitores", nombre: "LG UltraGear 27\" OLED 240Hz", descripcion: "QHD, 0.03 ms de respuesta", precio: 899, stock: 4 },
  { categoria: "Monitores", nombre: "Samsung Odyssey G5 32\" 165Hz", descripcion: "Curvo, resolución QHD", precio: 329, stock: 14 },

  { categoria: "Periféricos", nombre: "Logitech MX Master 4", descripcion: "Mouse inalámbrico de 8000 DPI", precio: 119, stock: 25 },
  { categoria: "Periféricos", nombre: "Logitech MX Keys S", descripcion: "Teclado inalámbrico retroiluminado", precio: 109, stock: 18 },
  { categoria: "Periféricos", nombre: "Razer DeathAdder V4 Pro", descripcion: "Mouse gamer inalámbrico de 63 g", precio: 159, stock: 9 },
  { categoria: "Periféricos", nombre: "Keychron K2 Pro Brown", descripcion: "Teclado mecánico 75%, switches Brown", precio: 99, stock: 0 },

  { categoria: "Componentes", nombre: "NVIDIA GeForce RTX 5070 12GB", descripcion: "Tarjeta de video GDDR7", precio: 599, stock: 3 },
  { categoria: "Componentes", nombre: "AMD Ryzen 7 9800X3D", descripcion: "Procesador de 8 núcleos, socket AM5", precio: 479, stock: 6 },
  { categoria: "Componentes", nombre: "Corsair Vengeance DDR5 32GB 6000MHz", descripcion: "Kit de 2 × 16 GB", precio: 119, stock: 20 },

  { categoria: "Almacenamiento", nombre: "Samsung 990 Pro NVMe 1TB", descripcion: "PCIe 4.0, hasta 7450 MB/s", precio: 129, stock: 30 },
  { categoria: "Almacenamiento", nombre: "Samsung 990 Pro NVMe 2TB", descripcion: "PCIe 4.0, hasta 7450 MB/s", precio: 219, stock: 12 },
  { categoria: "Almacenamiento", nombre: "WD Elements Desktop 8TB", descripcion: "Disco externo USB 3.0", precio: 179, stock: 5 },

  { categoria: "Redes", nombre: "TP-Link Archer AX55 Wi-Fi 6", descripcion: "Router doble banda AX3000", precio: 129, stock: 11 },
  { categoria: "Redes", nombre: "Ubiquiti UniFi U7 Pro", descripcion: "Punto de acceso Wi-Fi 7", precio: 189, stock: 2 },
  { categoria: "Redes", nombre: "Cable de red Cat 6 3m", descripcion: "Cable UTP azul", precio: 9, stock: 60 },

  { categoria: "Audio", nombre: "Sony WH-1000XM6", descripcion: "Audífonos con cancelación de ruido", precio: 449, stock: 7 },
  { categoria: "Audio", nombre: "AirPods Pro 3", descripcion: "Cancelación de ruido, estuche USB-C", precio: 249, stock: 13 },

  { categoria: "Accesorios", nombre: "Cargador Anker 100W GaN", descripcion: "Tres puertos USB-C", precio: 69, stock: 22 },
];

// `hace` = [días, horas] antes de ahora. `anulada`: se registra y después se anula.
const SALES = [
  { producto: "iPhone 18 Pro 256GB", cantidad: 2, hace: [6, 5] },
  { producto: "Logitech MX Master 4", cantidad: 3, hace: [6, 2] },
  { producto: "Samsung 990 Pro NVMe 1TB", cantidad: 4, hace: [5, 7] },
  { producto: "MacBook Air 13\" M5 16GB 512GB", cantidad: 1, hace: [5, 4] },
  { producto: "Cable de red Cat 6 3m", cantidad: 10, hace: [5, 1] },
  { producto: "iPhone 18 Pro 1TB", cantidad: 1, hace: [4, 6] },
  { producto: "Samsung Galaxy S26 256GB", cantidad: 2, hace: [4, 3] },
  { producto: "AirPods Pro 3", cantidad: 2, hace: [4, 1], anulada: true },
  { producto: "Dell UltraSharp U2725Q 27\" 4K", cantidad: 1, hace: [3, 6] },
  { producto: "NVIDIA GeForce RTX 5070 12GB", cantidad: 1, hace: [3, 4] },
  { producto: "Google Pixel 11 Pro 256GB", cantidad: 2, hace: [3, 2] },
  { producto: "Logitech MX Keys S", cantidad: 2, hace: [2, 7] },
  { producto: "iPhone 18 Pro 256GB", cantidad: 1, hace: [2, 5] },
  { producto: "Sony WH-1000XM6", cantidad: 1, hace: [2, 2] },
  { producto: "Keychron K2 Pro Brown", cantidad: 1, hace: [1, 6] },
  { producto: "Lenovo ThinkPad T14 Gen 6 16GB 512GB", cantidad: 1, hace: [1, 4], anulada: true },
  { producto: "Samsung 990 Pro NVMe 2TB", cantidad: 2, hace: [1, 2] },
  { producto: "Cargador Anker 100W GaN", cantidad: 3, hace: [0, 4] },
  { producto: "iPhone 18 Pro Max 512GB", cantidad: 1, hace: [0, 2] },
  { producto: "Corsair Vengeance DDR5 32GB 6000MHz", cantidad: 2, hace: [0, 1] },
];

// Unidades que se venden y no se anulan: se suman al stock inicial para que,
// después de las ventas, quede exactamente el `stock` de PRODUCTS.
function unitsSold(productName) {
  return SALES.filter((sale) => sale.producto === productName && !sale.anulada).reduce(
    (total, sale) => total + sale.cantidad,
    0
  );
}

async function resetCatalog() {
  await pool.query("DELETE FROM sales");
  await pool.query("DELETE FROM products");
  // Los IDs vuelven a empezar en 1, para que la demo arranque ordenada.
  await pool.query("ALTER TABLE sales AUTO_INCREMENT = 1");
  await pool.query("ALTER TABLE products AUTO_INCREMENT = 1");
}

async function createProducts() {
  const categories = await categoriesRepository.findAll();
  const categoryIds = new Map(categories.map((category) => [category.nombre, category.id]));
  const productIds = new Map();

  for (const product of PRODUCTS) {
    const id = await productsService.create({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      stock: product.stock + unitsSold(product.nombre),
      category_id: categoryIds.get(product.categoria),
    });
    productIds.set(product.nombre, id);
  }

  return productIds;
}

async function createSales(productIds) {
  for (const sale of SALES) {
    const { id } = await salesService.create({ product_id: productIds.get(sale.producto), cantidad: sale.cantidad });

    // La API registra la venta con la hora actual. Para que la demo tenga
    // historia, la fecha se mueve hacia atrás directamente en la base.
    const [days, hours] = sale.hace;
    await pool.query(
      "UPDATE sales SET created_at = NOW() - INTERVAL ? DAY - INTERVAL ? HOUR WHERE id = ?",
      [days, hours, id]
    );

    if (sale.anulada) {
      await salesService.cancel(id);
      await pool.query("UPDATE sales SET anulada_at = created_at + INTERVAL 1 HOUR WHERE id = ?", [id]);
    }
  }
}

async function main() {
  const reset = process.argv.includes("--reset");
  const [{ total }] = await pool.query("SELECT COUNT(*) AS total FROM products");

  if (Number(total) > 0 && !reset) {
    console.error(`Ya hay ${total} productos. Usa --reset para reemplazarlos (borra productos y ventas).`);
    process.exitCode = 1;
    return;
  }

  if (reset) {
    await resetCatalog();
  }

  const productIds = await createProducts();
  await createSales(productIds);

  const cancelled = SALES.filter((sale) => sale.anulada).length;
  console.log(`Listo: ${PRODUCTS.length} productos y ${SALES.length} ventas (${cancelled} anuladas).`);
}

main()
  .catch((error) => {
    console.error(`No se pudo cargar la demo: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
