-- ==================================================
-- TABLA PRODUCTS
-- ==================================================
--
-- Guarda los productos del inventario.
--
-- Esta tabla es utilizada principalmente por:
--
-- GET    /api/products
-- POST   /api/products
-- PUT    /api/products/:id
-- DELETE /api/products/:id
-- PATCH  /api/products/:id/restore
--
-- También se relaciona con la tabla sales.
--

CREATE TABLE IF NOT EXISTS products (


    -- ==================================================
    -- IDENTIFICADOR
    -- ==================================================
    --
    -- Cada producto tiene un ID único.
    --
    -- AUTO_INCREMENT hace que MariaDB genere
    -- automáticamente valores como:
    --
    -- 1, 2, 3, 4...
    --
    -- PRIMARY KEY identifica de forma única
    -- cada registro.
    --
    id INT AUTO_INCREMENT PRIMARY KEY,


    -- ==================================================
    -- NOMBRE
    -- ==================================================
    --
    -- Nombre del producto.
    --
    -- VARCHAR(100):
    -- máximo 100 caracteres.
    --
    -- NOT NULL:
    -- este campo es obligatorio.
    --
    nombre VARCHAR(100) NOT NULL,


    -- ==================================================
    -- DESCRIPCIÓN
    -- ==================================================
    --
    -- Información adicional del producto.
    --
    -- No tiene NOT NULL, por lo tanto
    -- puede contener NULL.
    --
    descripcion VARCHAR(255),


    -- ==================================================
    -- PRECIO
    -- ==================================================
    --
    -- Precio actual del producto.
    --
    -- DECIMAL(10,2) permite almacenar
    -- valores monetarios con dos decimales.
    --
    -- Ejemplo:
    --
    -- 500.00
    -- 19.99
    --
    -- Utilizamos DECIMAL en lugar de FLOAT
    -- porque es más apropiado para cantidades
    -- monetarias que requieren precisión.
    --
    precio DECIMAL(10,2) NOT NULL,


    -- ==================================================
    -- STOCK
    -- ==================================================
    --
    -- Cantidad de unidades disponibles.
    --
    -- Si al crear el producto no se especificara
    -- un stock, MariaDB utilizaría 0.
    --
    stock INT NOT NULL DEFAULT 0,


    -- ==================================================
    -- SOFT DELETE
    -- ==================================================
    --
    -- Indica si el producto está activo.
    --
    -- activo = 1
    -- → producto disponible
    --
    -- activo = 0
    -- → producto en papelera
    --
    -- Utilizamos este campo porque la aplicación
    -- realiza Soft Delete.
    --
    -- Es decir, DELETE no elimina físicamente
    -- el registro de la base de datos.
    --
    activo TINYINT(1) NOT NULL DEFAULT 1,


    -- ==================================================
    -- FECHA DE CREACIÓN
    -- ==================================================
    --
    -- Guarda automáticamente la fecha y hora
    -- en la que fue creado el producto.
    --
    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    -- ==================================================
    -- FECHA DE ÚLTIMA ACTUALIZACIÓN
    -- ==================================================
    --
    -- Al crear el producto utiliza
    -- la fecha y hora actual.
    --
    -- ON UPDATE CURRENT_TIMESTAMP hace
    -- que MariaDB actualice automáticamente
    -- este campo cuando el registro cambia.
    --
    updated_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);



-- ==================================================
-- TABLA USERS
-- ==================================================
--
-- Guarda los usuarios que pueden
-- iniciar sesión en la aplicación.
--
-- Esta tabla se utiliza principalmente
-- en el proceso:
--
-- POST /api/auth/login
--
-- El Backend busca el username,
-- obtiene password_hash y utiliza bcrypt
-- para comprobar la contraseña.
--

CREATE TABLE IF NOT EXISTS users (


    -- ==================================================
    -- IDENTIFICADOR
    -- ==================================================
    --
    -- ID único generado automáticamente.
    --
    id INT AUTO_INCREMENT PRIMARY KEY,


    -- ==================================================
    -- USERNAME
    -- ==================================================
    --
    -- Nombre utilizado para iniciar sesión.
    --
    -- NOT NULL:
    -- obligatorio.
    --
    -- UNIQUE:
    -- no pueden existir dos usuarios
    -- con el mismo username.
    --
    username VARCHAR(100)
        NOT NULL
        UNIQUE,


    -- ==================================================
    -- PASSWORD HASH
    -- ==================================================
    --
    -- Aquí NO guardamos la contraseña original.
    --
    -- Guardamos únicamente el hash generado
    -- mediante bcrypt.
    --
    -- Ejemplo conceptual:
    --
    -- contraseña
    -- ↓
    -- bcrypt
    -- ↓
    -- hash
    -- ↓
    -- password_hash
    --
    -- Durante el login bcrypt.compare()
    -- verifica la contraseña introducida
    -- contra este hash.
    --
    password_hash VARCHAR(255)
        NOT NULL,


    -- ==================================================
    -- ROL DEL USUARIO
    -- ==================================================
    --
    -- Permite identificar el tipo de usuario.
    --
    -- Actualmente el valor por defecto
    -- es "admin".
    --
    role VARCHAR(30)
        NOT NULL
        DEFAULT 'admin',


    -- ==================================================
    -- FECHA DE CREACIÓN
    -- ==================================================
    --
    -- Se genera automáticamente
    -- cuando se crea el usuario.
    --
    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);



-- ==================================================
-- TABLA SALES
-- ==================================================
--
-- Guarda el historial de ventas.
--
-- Una venta contiene:
--
-- - producto vendido;
-- - cantidad;
-- - precio que tenía en ese momento;
-- - fecha de venta.
--
-- Esta tabla es utilizada por:
--
-- POST /api/sales
-- GET  /api/sales
-- GET  /api/sales/summary
--

CREATE TABLE IF NOT EXISTS sales (


    -- ==================================================
    -- IDENTIFICADOR DE LA VENTA
    -- ==================================================
    --
    -- Cada venta recibe automáticamente
    -- un ID único.
    --
    id INT AUTO_INCREMENT PRIMARY KEY,


    -- ==================================================
    -- PRODUCTO
    -- ==================================================
    --
    -- Guarda el ID del producto vendido.
    --
    -- Posteriormente se relacionará con:
    --
    -- products.id
    --
    product_id INT NOT NULL,


    -- ==================================================
    -- CANTIDAD
    -- ==================================================
    --
    -- Cantidad de unidades vendidas
    -- en este movimiento.
    --
    cantidad INT NOT NULL,


    -- ==================================================
    -- PRECIO HISTÓRICO
    -- ==================================================
    --
    -- Guarda el precio del producto
    -- EN EL MOMENTO DE LA VENTA.
    --
    -- Esto es importante porque el precio
    -- del producto puede cambiar posteriormente.
    --
    -- Ejemplo:
    --
    -- Producto hoy:
    -- $500
    --
    -- Venta:
    -- $500
    --
    -- Producto mañana:
    -- $600
    --
    -- La venta histórica debe seguir mostrando:
    -- $500
    --
    precio_unitario DECIMAL(10,2)
        NOT NULL,


    -- ==================================================
    -- FECHA DE LA VENTA
    -- ==================================================
    --
    -- MariaDB asigna automáticamente
    -- la fecha y hora del movimiento.
    --
    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    -- ==================================================
    -- CLAVE FORÁNEA
    -- ==================================================
    --
    -- Esta restricción crea una relación entre:
    --
    -- sales.product_id
    --        ↓
    -- products.id
    --
    -- Esto garantiza integridad referencial.
    --
    -- MariaDB no permitirá registrar una venta
    -- apuntando a un producto inexistente.
    --
    CONSTRAINT fk_sales_product

        FOREIGN KEY (product_id)

        REFERENCES products(id)
);