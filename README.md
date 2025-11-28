# 🎉 Pink Rentals - Sistema de Gestión Photobooth

**Proyecto Final - Base de Datos Avanzada**  
Sistema web completo para administrar clientes, reservaciones, productos y servicios de un negocio de alquiler de photobooth.

---

## 📋 Descripción General

Pink Rentals es una aplicación web moderna que conecta un **frontend interactivo** con una **base de datos Oracle** mediante un servidor Node.js. Permite gestionar de forma integral todas las operaciones del negocio:

- ✅ Registro y administración de clientes
- ✅ Agenda de reservaciones con horarios y ubicaciones
- ✅ Control de inventario de productos
- ✅ Catálogo de servicios disponibles
- ✅ Dashboard con estadísticas en tiempo real

---

## 🗂️ Estructura del Proyecto

```
Pink_Rentals/
│
├── index.html              # Página principal (Dashboard)
├── clientes.html           # Gestión de clientes
├── reservaciones.html      # Agenda de reservaciones
├── productos.html          # Inventario de productos
├── servicios.html          # Catálogo de servicios
│
├── css/
│   └── styles.css          # Estilos globales (modo oscuro/claro, animaciones)
│
├── js/
│   ├── config.js           # Configuración (estados, categorías, iconos)
│   ├── utils.js            # Funciones auxiliares (fechas, toasts, tema)
│   ├── api.js              # Conexión con el backend (fetch a endpoints REST)
│   ├── main.js             # Lógica del Dashboard
│   ├── clientes.js         # Lógica de la página Clientes
│   ├── reservaciones.js    # Lógica de Reservaciones
│   ├── productos.js        # Lógica de Productos
│   └── servicios.js        # Lógica de Servicios
│
├── server/
│   ├── server.js           # Servidor Node.js + Express (API REST)
│   ├── db.js               # Conexión a Oracle con oracledb
│   └── package.json        # Dependencias del backend
│
└── database/
    └── scripts_oracle/     # Scripts SQL (tablas, paquetes PL/SQL, datos)
```

---

## 🎨 Características del Frontend

### **Diseño Visual**
- **Paleta de colores**: Negro, blanco y rosa (#FF1493) como acento
- **Modo oscuro/claro**: Botón de cambio de tema en el header
- **Animaciones suaves**: 
  - Hero con halo animado y blur dinámico
  - Cards con entrada escalonada (fadeUp)
  - Filas de tablas con micro-animaciones al cargar
  - Hover interactivo en todos los elementos clickeables

### **Páginas y Funcionalidades**

#### 1️⃣ **Dashboard (index.html)**
- **Estadísticas generales**: Total de clientes, reservaciones, productos y servicios
- **Actividad reciente**: Últimas 5 reservaciones ordenadas por fecha
- **Accesos rápidos**: Links directos a cada módulo
- **Sección informativa**: Visión, misión y valores del sistema

#### 2️⃣ **Clientes (clientes.html)**
- **Tabla completa** con cédula, nombre, teléfono y fecha de registro
- **Buscador en tiempo real** por nombre o cédula
- **Modal CRUD**: Crear, editar y eliminar (desactivar) clientes
- **Validación**: Cédula única, campos obligatorios

#### 3️⃣ **Reservaciones (reservaciones.html)**
- **Tabla con detalles**: Cliente, fecha, horario, ubicación y estado
- **Filtro por estado**: Pendiente, Completada, Cancelada
- **Modal CRUD**: 
  - Crear: Seleccionar cliente (datalist), fecha, horario y dirección
  - Editar: Cambiar estado, horarios o ubicación
  - Eliminar: Cancelar reservación (cambio de estado)

#### 4️⃣ **Productos (productos.html)**
- **Inventario completo**: ID, nombre, categoría, precio y cantidad
- **Modal CRUD**: Agregar/editar productos con categoría y stock
- **Gestión de estado**: Activar/desactivar productos

#### 5️⃣ **Servicios (servicios.html)**
- **Grid de cards visuales**: Cada servicio con icono, descripción y precio
- **Modal CRUD**: Crear/editar servicios con categoría
- **Botones de acción**: Editar y eliminar en cada card

---

## 🔧 Archivos JavaScript - Explicación

### **js/config.js**
Define constantes globales:
- `ESTADOS_NOMBRES`: Mapeo de IDs de estado a nombres legibles
- `CATEGORIAS_PRODUCTO` y `CATEGORIAS_SERVICIO`: Nombres de categorías
- `ICONOS_SERVICIOS`: Emojis para cada tipo de servicio
- `PROVINCIAS`, `CANTONES`, `DISTRITOS`: Datos geográficos de Costa Rica

### **js/utils.js**
Funciones auxiliares reutilizables:
- `formatearFechaES()`: Convierte fechas ISO a formato "DD/MM/YYYY"
- `mostrarToast()`: Notificaciones visuales (éxito, error, info)
- `toggleTheme()`: Cambio entre modo oscuro y claro

### **js/api.js**
Capa de comunicación con el backend:
- `ApiService.getClientes()`: Obtiene todos los clientes
- `ApiService.crearCliente(datos)`: Inserta un nuevo cliente
- `ApiService.actualizarCliente(id, datos)`: Actualiza datos de un cliente
- `ApiService.eliminarCliente(id)`: Desactiva un cliente
- *(Similar para Reservaciones, Productos y Servicios)*

### **js/main.js**
Lógica del Dashboard:
- `cargarEstadisticasReales()`: Carga contadores de cada módulo
- `cargarActividadRecienteReales()`: Muestra últimas reservaciones
- `animarContador()`: Animación de números incrementales
- `inicializarInfoCardsInteractivas()`: Click en cards de "Sobre el sistema"

### **js/clientes.js, reservaciones.js, productos.js, servicios.js**
Cada archivo maneja su módulo:
- `cargarDatosIniciales()`: Petición al backend y renderizado inicial
- `renderTabla()` o `renderCards()`: Muestra datos en pantalla
- `abrirModalCrear()` / `abrirModalEditar()`: Gestión de formularios
- `manejarGuardado()`: Envía datos al backend (CREATE/UPDATE)
- `confirmarEliminar()`: Elimina o desactiva registros

---

## 🖥️ Backend (Node.js + Oracle)

### **server/server.js**
Servidor Express que expone endpoints REST:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/clientes` | Lista todos los clientes activos |
| POST | `/api/clientes` | Crea un nuevo cliente |
| PUT | `/api/clientes/:id` | Actualiza datos de un cliente |
| DELETE | `/api/clientes/:id` | Desactiva un cliente |
| GET | `/api/reservaciones` | Lista todas las reservaciones |
| POST | `/api/reservaciones` | Crea una nueva reservación |
| PUT | `/api/reservaciones/:id` | Actualiza una reservación |
| DELETE | `/api/reservaciones/:id` | Cancela una reservación |
| *(Similar para productos, servicios, categorías y direcciones)* |

### **server/db.js**
Configuración de conexión a Oracle:
```javascript
const oracledb = require('oracledb');

const dbConfig = {
  user: 'FIDE_PROYECTO_FINAL',
  password: 'oracle',
  connectString: 'localhost:1521/XEPDB1'
};
```

Cada función ejecuta:
1. Conexión a la BD
2. Llamada a procedimiento PL/SQL del paquete `FIDE_PROYECTO_FINAL_PKG`
3. Retorno de datos en formato JSON

---

## 🗄️ Base de Datos Oracle

### **Tablas Principales**
- `USUARIOS`: Datos base de usuarios (cédula, nombre, contraseña)
- `CLIENTES`: Extiende usuarios con teléfono y fecha de registro
- `RESERVACIONES`: Fecha, horario, cliente, dirección y estado
- `PRODUCTOS`: Inventario con categoría, precio y cantidad
- `SERVICIOS`: Catálogo de servicios con categoría y precio
- `DIRECCIONES`: Ubicaciones con provincia, cantón y distrito
- `ESTADOS`: Catálogo de estados (Activo, Inactivo, Pendiente, etc.)

### **Paquete PL/SQL: FIDE_PROYECTO_FINAL_PKG**
Contiene procedimientos para cada operación CRUD:
- `SP_INSERTAR_CLIENTE`
- `SP_ACTUALIZAR_CLIENTE`
- `SP_ELIMINAR_CLIENTE` (desactivación lógica)
- `SP_LISTAR_CLIENTES`
- *(Similar para Reservaciones, Productos y Servicios)*

---

## 🚀 Cómo Ejecutar el Proyecto

### **1. Configurar la Base de Datos**
```sql
-- En Oracle SQL Developer:
-- 1. Crear usuario FIDE_PROYECTO_FINAL
-- 2. Ejecutar scripts de tablas (database/scripts_oracle/)
-- 3. Ejecutar paquete PL/SQL con todos los procedimientos
-- 4. Insertar datos iniciales (estados, categorías, etc.)
```

### **2. Iniciar el Backend**
```bash
cd server
npm install
node server.js
# Servidor corriendo en http://localhost:3000
```

### **3. Abrir el Frontend**
```bash
# Opción 1: Abrir index.html directamente en el navegador
# Opción 2: Usar Live Server en VS Code
```

---

## 📊 Flujo de Datos

```
┌─────────────┐       HTTP/JSON        ┌──────────────┐       SQL        ┌─────────────┐
│  Frontend   │ ──────────────────────> │   Node.js    │ ───────────────> │   Oracle    │
│  (HTML/JS)  │ <────────────────────── │   (Express)  │ <─────────────── │     DB      │
└─────────────┘       Respuesta         └──────────────┘     Resultado    └─────────────┘
```

1. Usuario interactúa con la página (ej: clic en "Guardar Cliente")
2. JavaScript llama a `ApiService.crearCliente(datos)`
3. Fetch envía POST a `http://localhost:3000/api/clientes`
4. Express recibe la petición y llama a `db.insertarCliente()`
5. `db.js` ejecuta `SP_INSERTAR_CLIENTE` en Oracle
6. Oracle retorna éxito/error
7. Backend responde JSON al frontend
8. Frontend muestra notificación y recarga la tabla

---

## 🎯 Tecnologías Utilizadas

### **Frontend**
- HTML5 + CSS3 (Grid, Flexbox, Animaciones)
- JavaScript Vanilla (ES6+)
- Fetch API para peticiones asíncronas

### **Backend**
- Node.js v18+
- Express.js (servidor web)
- oracledb (driver oficial de Oracle)
- CORS habilitado para desarrollo

### **Base de Datos**
- Oracle Database 21c XE
- PL/SQL (paquetes y procedimientos almacenados)
- Triggers para auditoría y validaciones

---

## 📝 Notas Importantes

### **Seguridad**
- Las contraseñas se almacenan en texto plano (solo para fines académicos)
- En producción se debe usar bcrypt o similar
- CORS está abierto (`*`) solo para desarrollo local

### **Validaciones**
- Frontend: Validación de campos obligatorios y formatos
- Backend: Validación antes de ejecutar procedimientos
- Base de Datos: Constraints y triggers para integridad

### **Estados**
Los registros no se eliminan físicamente, solo se desactivan:
- Estado 1 = Activo
- Estado 2 = Inactivo
- Estado 3 = Pendiente (reservaciones)
- Estado 4 = Completado
- Estado 5 = Cancelado

---

## 👥 Créditos

**Proyecto desarrollado por:**  
Jeremy Coto - Bases de Datos Avanzada

**Profesor:**  
[Nombre del profesor]

**Institución:**  
[Nombre de la universidad]

**Fecha:**  
Noviembre 2025

---

## 📞 Soporte

Para dudas o problemas:
1. Revisar logs del servidor (`node server.js`)
2. Verificar conexión a Oracle (usuario/contraseña en `db.js`)
3. Comprobar que todos los procedimientos PL/SQL estén compilados
4. Usar la consola del navegador (F12) para ver errores de JavaScript










---

## 🔄 Proceso de Integración Backend-Frontend (Paso a Paso)

### **Contexto Inicial**
El proyecto comenzó como un **frontend puro** con datos simulados (mock data) almacenados en `localStorage`. Para convertirlo en una aplicación real conectada a Oracle, se siguió este proceso:

---

### **PASO 1: Diseño de la Base de Datos Oracle**

#### **1.1 Creación del Usuario y Permisos**
```sql
-- Crear usuario en Oracle
CREATE USER FIDE_PROYECTO_FINAL IDENTIFIED BY oracle;
GRANT CONNECT, RESOURCE TO FIDE_PROYECTO_FINAL;
GRANT CREATE SESSION, CREATE TABLE, CREATE PROCEDURE TO FIDE_PROYECTO_FINAL;
```

#### **1.2 Diseño de Tablas**
Se crearon las tablas principales siguiendo el modelo relacional:
- **USUARIOS**: Tabla base con cédula (PK), nombre, apellidos, contraseña
- **CLIENTES**: Hereda de USUARIOS, agrega teléfono y fecha de registro
- **DIRECCIONES**: Provincia, cantón, distrito (geografía de Costa Rica)
- **ESTADOS**: Catálogo de estados (Activo, Inactivo, Pendiente, etc.)
- **RESERVACIONES**: Fecha, horario, cliente_id, direccion_id, estado_id
- **PRODUCTOS**: ID, nombre, categoría, precio, cantidad, estado
- **SERVICIOS**: ID, nombre, descripción, categoría, precio, estado

#### **1.3 Relaciones y Constraints**
```sql
-- Ejemplo: Reservaciones referencia a Clientes
ALTER TABLE RESERVACIONES 
ADD CONSTRAINT FK_RESERVA_CLIENTE 
FOREIGN KEY (CLIENTES_ID_CEDULA_FK) 
REFERENCES CLIENTES(USUARIOS_ID_CEDULA_PK);
```

---

### **PASO 2: Creación del Paquete PL/SQL**

#### **2.1 Estructura del Paquete**
Se creó `FIDE_PROYECTO_FINAL_PKG` con procedimientos para cada operación CRUD:

```sql
CREATE OR REPLACE PACKAGE FIDE_PROYECTO_FINAL_PKG AS
  -- Clientes
  PROCEDURE SP_INSERTAR_CLIENTE(p_cedula VARCHAR2, p_nombre VARCHAR2, ...);
  PROCEDURE SP_ACTUALIZAR_CLIENTE(p_cedula VARCHAR2, p_telefono VARCHAR2, ...);
  PROCEDURE SP_ELIMINAR_CLIENTE(p_cedula VARCHAR2); -- Desactivación lógica
  PROCEDURE SP_LISTAR_CLIENTES(p_cursor OUT SYS_REFCURSOR);
  
  -- Reservaciones
  PROCEDURE SP_INSERTAR_RESERVACION(...);
  PROCEDURE SP_ACTUALIZAR_RESERVACION(...);
  -- ... (Similar para Productos y Servicios)
END;
```

#### **2.2 Implementación de Procedimientos**
Cada procedimiento incluye:
- **Validaciones**: Verificar que el cliente/producto exista antes de insertar
- **Manejo de errores**: `EXCEPTION WHEN OTHERS THEN ROLLBACK;`
- **Auditoría**: Insertar en tablas de log (opcional)
- **Desactivación lógica**: En lugar de `DELETE`, se hace `UPDATE estado_id = 2`

```sql
-- Ejemplo: Insertar Cliente
PROCEDURE SP_INSERTAR_CLIENTE(
  p_cedula VARCHAR2,
  p_nombre VARCHAR2,
  p_apellido1 VARCHAR2,
  p_apellido2 VARCHAR2,
  p_telefono VARCHAR2
) AS
BEGIN
  -- Insertar en USUARIOS
  INSERT INTO USUARIOS VALUES (p_cedula, p_nombre, p_apellido1, p_apellido2, 'default123', 1);
  
  -- Insertar en CLIENTES
  INSERT INTO CLIENTES VALUES (p_cedula, p_telefono, SYSDATE, 1);
  
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END;
```

---

### **PASO 3: Desarrollo del Backend (Node.js + Express)**

#### **3.1 Instalación de Dependencias**
```bash
npm init -y
npm install express oracledb cors
```

#### **3.2 Configuración de la Conexión (`server/db.js`)**
```javascript
const oracledb = require('oracledb');

const dbConfig = {
  user: 'FIDE_PROYECTO_FINAL',
  password: 'oracle',
  connectString: 'localhost:1521/XEPDB1'
};

// Función para obtener clientes
async function obtenerClientes() {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `BEGIN FIDE_PROYECTO_FINAL_PKG.SP_LISTAR_CLIENTES(:cursor); END;`,
      { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } }
    );
    const resultSet = result.outBinds.cursor;
    const rows = await resultSet.getRows(100);
    await resultSet.close();
    return rows;
  } finally {
    if (connection) await connection.close();
  }
}
```

**Explicación:**
1. Se establece conexión con `oracledb.getConnection()`
2. Se ejecuta el procedimiento PL/SQL usando `connection.execute()`
3. Los procedimientos que retornan datos usan `SYS_REFCURSOR` (cursor de salida)
4. Se extraen las filas con `resultSet.getRows()`
5. Se cierra el cursor y la conexión para liberar recursos

#### **3.3 Creación de Endpoints REST (`server/server.js`)**
```javascript
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// GET: Listar clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await db.obtenerClientes();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Crear cliente
app.post('/api/clientes', async (req, res) => {
  try {
    const { cedula, nombre, apellido1, apellido2, telefono } = req.body;
    await db.insertarCliente(cedula, nombre, apellido1, apellido2, telefono);
    res.json({ mensaje: 'Cliente creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('✅ Servidor en http://localhost:3000'));
```

**Explicación:**
- `app.use(cors())`: Permite peticiones desde el frontend (diferente puerto)
- `app.use(express.json())`: Parsea el body de las peticiones POST/PUT
- Cada endpoint llama a una función de `db.js` que ejecuta el procedimiento PL/SQL
- Se retorna JSON con los datos o un mensaje de éxito/error

---

### **PASO 4: Adaptación del Frontend**

#### **4.1 Creación del Servicio API (`js/api.js`)**
Se creó una capa de abstracción para centralizar todas las peticiones HTTP:

```javascript
const API_URL = 'http://localhost:3000/api';

const ApiService = {
  // Clientes
  async getClientes() {
    const response = await fetch(`${API_URL}/clientes`);
    if (!response.ok) throw new Error('Error al obtener clientes');
    return await response.json();
  },
  
  async crearCliente(datos) {
    const response = await fetch(`${API_URL}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error al crear cliente');
    return await response.json();
  },
  
  // ... (Similar para UPDATE, DELETE y otros módulos)
};
```

**Ventajas:**
- Centraliza la URL base del backend
- Manejo uniforme de errores
- Fácil de mantener y escalar

#### **4.2 Reemplazo de Mock Data por API Calls**
**Antes (con localStorage):**
```javascript
function cargarClientes() {
  const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
  renderizarClientes(clientes);
}
```

**Después (con API):**
```javascript
async function cargarDatosIniciales() {
  try {
    const clientes = await ApiService.getClientes();
    clientesCache = clientes;
    renderizarClientes(clientes);
  } catch (error) {
    console.error('Error:', error);
    PinkUtils.mostrarToast('Error al cargar clientes', 'error');
  }
}
```

#### **4.3 Implementación de Modales CRUD**
Se agregaron modales HTML para crear/editar registros:

```html
<!-- Modal Cliente -->
<div id="modal-cliente" class="modal">
  <div class="modal-content">
    <h2 id="modal-titulo">Nuevo Cliente</h2>
    <form id="form-cliente">
      <input type="text" id="input-cedula" placeholder="Cédula" required>
      <input type="text" id="input-nombre" placeholder="Nombre" required>
      <!-- ... más campos ... -->
      <button type="submit">Guardar</button>
    </form>
  </div>
</div>
```

**JavaScript del modal:**
```javascript
// Abrir modal para crear
function abrirModalCrear() {
  document.getElementById('modal-titulo').textContent = 'Nuevo Cliente';
  document.getElementById('form-cliente').reset();
  clienteEditando = null;
  document.getElementById('modal-cliente').classList.add('active');
}

// Guardar (crear o actualizar)
async function manejarGuardado(e) {
  e.preventDefault();
  const datos = {
    cedula: document.getElementById('input-cedula').value,
    nombre: document.getElementById('input-nombre').value,
    // ... más campos ...
  };
  
  try {
    if (clienteEditando) {
      await ApiService.actualizarCliente(clienteEditando, datos);
      PinkUtils.mostrarToast('Cliente actualizado', 'success');
    } else {
      await ApiService.crearCliente(datos);
      PinkUtils.mostrarToast('Cliente creado', 'success');
    }
    cerrarModal();
    await cargarDatosIniciales(); // Recargar tabla
  } catch (error) {
    PinkUtils.mostrarToast('Error al guardar', 'error');
  }
}
```

---

### **PASO 5: Flujo Completo de una Operación**

#### **Ejemplo: Crear un nuevo cliente**

1. **Usuario llena el formulario** en `clientes.html` y hace clic en "Guardar"
2. **JavaScript captura el evento** `submit` del formulario
3. **Se extraen los datos** del formulario y se validan
4. **Se llama a `ApiService.crearCliente(datos)`**
5. **Fetch envía POST** a `http://localhost:3000/api/clientes` con JSON en el body
6. **Express recibe la petición** y extrae `req.body`
7. **Se llama a `db.insertarCliente()`** pasando los parámetros
8. **`db.js` ejecuta el procedimiento PL/SQL** `SP_INSERTAR_CLIENTE`
9. **Oracle valida y ejecuta** los `INSERT` en `USUARIOS` y `CLIENTES`
10. **Oracle hace COMMIT** y retorna éxito
11. **Node.js responde JSON** `{ mensaje: 'Cliente creado' }`
12. **Frontend recibe la respuesta**, muestra un toast de éxito y recarga la tabla

---

### **PASO 6: Pruebas y Validación**

#### **6.1 Pruebas en Oracle SQL Developer**
```sql
-- Verificar que el procedimiento funciona
BEGIN
  FIDE_PROYECTO_FINAL_PKG.SP_INSERTAR_CLIENTE('123456789', 'Juan', 'Pérez', 'López', '88887777');
END;

-- Verificar que se insertó
SELECT * FROM CLIENTES WHERE USUARIOS_ID_CEDULA_PK = '123456789';
```

#### **6.2 Pruebas en Postman**
```
POST http://localhost:3000/api/clientes
Body (JSON):
{
  "cedula": "987654321",
  "nombre": "María",
  "apellido1": "González",
  "apellido2": "Rojas",
  "telefono": "77776666"
}
```

#### **6.3 Pruebas en el Frontend**
1. Abrir `clientes.html`
2. Clic en "Nuevo Cliente"
3. Llenar formulario y guardar
4. Verificar que aparece en la tabla
5. Comprobar en Oracle que el registro existe

---

### **Resumen del Proceso**

```
┌──────────────────────────────────────────────────────────────────┐
│  1. DISEÑO BD ORACLE → Tablas + Relaciones + Constraints        │
│  2. PAQUETE PL/SQL → Procedimientos CRUD con validaciones        │
│  3. BACKEND NODE.JS → Endpoints REST que llaman a PL/SQL         │
│  4. FRONTEND API SERVICE → Capa de abstracción para fetch        │
│  5. MODALES CRUD → Formularios que envían datos al backend       │
│  6. PRUEBAS → Oracle → Postman → Frontend                        │
└──────────────────────────────────────────────────────────────────┘
```

**Ventajas de esta arquitectura:**
- ✅ **Separación de responsabilidades**: Frontend, Backend y BD independientes
- ✅ **Seguridad**: Lógica de negocio en PL/SQL, no expuesta al cliente
- ✅ **Escalabilidad**: Fácil agregar nuevos endpoints o procedimientos
- ✅ **Mantenibilidad**: Cambios en BD no afectan al frontend directamente
- ✅ **Reutilización**: Los endpoints pueden usarse desde otras aplicaciones

---

**¡Gracias por revisar Pink Rentals!** 🎉📸
