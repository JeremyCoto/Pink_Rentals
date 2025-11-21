require('dotenv').config();
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT; // Retorna objetos { COLUMNA: VALOR }

// ==========================================
// 1. CONFIGURACIÓN DE BASE DE DATOS
// ==========================================
const dbConfig = {
    user: "G2_SC508_VT_PROYECTO",    // Tu usuario real
    password: "1234",                // Tu contraseña real (la del script SQL)
    connectString: "localhost:1521/xe" // O intenta "localhost:1521/xe" si usas Express Edition
};

// ==========================================
// 2. MAPA DE RUTAS (CONFIGURACIÓN CENTRAL)
// Aquí definimos qué URL llama a qué Procedimiento
// ==========================================
const TABLE_ENDPOINTS = {
    'estados':             'FIDE_ESTADOS_LISTAR_SP',
    'roles':               'FIDE_ROLES_LISTAR_SP',
    'provincias':          'FIDE_PROVINCIA_LISTAR_SP',
    'metodos-pago':        'FIDE_METODO_PAGO_LISTAR_SP',
    'categorias-producto': 'FIDE_CATEGORIA_PRODUCTO_LISTAR_SP',
    'categorias-servicio': 'FIDE_CATEGORIA_SERVICIO_LISTAR_SP',
    'paquetes':            'FIDE_PAQUETE_LISTAR_SP',
    'cantones':            'FIDE_CANTON_LISTAR_SP',
    'distritos':           'FIDE_DISTRITO_LISTAR_SP',
    'usuarios':            'FIDE_USUARIOS_LISTAR_SP',
    'productos':           'FIDE_PRODUCTOS_LISTAR_SP',
    'servicios':           'FIDE_SERVICIOS_LISTAR_SP',
    'pagos':               'FIDE_PAGOS_LISTAR_SP',
    'clientes':            'FIDE_CLIENTES_LISTAR_SP',
    'empleados':           'FIDE_EMPLEADOS_LISTAR_SP',
    'correos':             'FIDE_CORREO_LISTAR_SP',
    'direcciones':         'FIDE_DIRECCIONES_LISTAR_SP',
    'reservaciones':       'FIDE_RESERVACIONES_LISTAR_SP',
    'paquetes-servicios':  'FIDE_PAQUETES_POR_SERV_LISTAR_SP',
    'asignaciones':        'FIDE_ASIGNACION_LISTAR_SP',
    'detalles-reserva':    'FIDE_DETALLE_RES_LISTAR_SP',
    'facturas':            'FIDE_FACTURACION_LISTAR_SP',
    'detalles-factura':    'FIDE_DETALLE_FACT_LISTAR_SP'
};

// ==========================================
// 3. GENERADOR AUTOMÁTICO DE RUTAS (GET)
// ==========================================
Object.entries(TABLE_ENDPOINTS).forEach(([route, spName]) => {
    app.get(`/api/${route}`, async (req, res) => {
        await ejecutarConsulta(res, spName);
    });
});

// ==========================================
// 4. FUNCIÓN GENÉRICA DE EJECUCIÓN
// ==========================================
async function ejecutarConsulta(res, spName) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Ejecuta el SP
        const result = await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.${spName}(:cursor); END;`,
            { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } }
        );

        const resultSet = result.outBinds.cursor;
        const rows = await resultSet.getRows(); // Obtiene filas crudas
        await resultSet.close();

        // TRANSFORMACIÓN DE DATOS (OPCIÓN B)
        // Convierte claves MAYÚSCULAS a minúsculas
        const datosFormateados = rows.map(row => {
            const objLimpio = {};
            Object.keys(row).forEach(key => {
                objLimpio[key.toLowerCase()] = row[key];
            });
            return objLimpio;
        });

        res.json(datosFormateados);

    } catch (err) {
        console.error(`Error en ${spName}:`, err);
        res.status(500).send({ error: 'Error de base de datos', detalle: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ API Pink Rentals corriendo en http://localhost:${PORT}`);
    console.log(`📡 Sirviendo ${Object.keys(TABLE_ENDPOINTS).length} tablas automáticamente.`);
});

// ==========================================
// CRUD DE CLIENTES (Transacciones Compuestas)
// ==========================================

// 1. CREAR CLIENTE (Crea Usuario + Crea Cliente)
app.post('/api/clientes', async (req, res) => {
    const { cedula, nombre, apellido1, apellido2, telefono, password } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // A. Crear Usuario (Rol 30 = Cliente)
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_INSERTAR_SP(:ced, :nom, :ape1, :ape2, :pass, :rol); END;`,
            {
                ced: cedula, nom: nombre, ape1: apellido1, ape2: apellido2,
                pass: password || 'Pink123', // Contraseña por defecto o la enviada
                rol: 30 // ROL 30 ES CLIENTE
            }
        );

        // B. Crear Registro Cliente (Teléfono)
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_INSERTAR_SP(:ced, :tel); END;`,
            { ced: cedula, tel: telefono }
        );

        res.status(201).json({ message: 'Cliente creado exitosamente' });
    } catch (err) {
        console.error("Error creando cliente:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// 2. ACTUALIZAR CLIENTE (Versión Segura)
app.put('/api/clientes/:cedula', async (req, res) => {
    const { cedula } = req.params;
    const { nombre, apellido1, apellido2, telefono, estado, password } = req.body; // Agregamos password aquí
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // PASO 1: Si no enviaron contraseña nueva, hay que buscar la vieja para no perderla
        let passFinal = password;
        if (!password) {
            const resultUser = await connection.execute(
                `SELECT contrasena FROM G2_SC508_VT_PROYECTO.FIDE_USUARIOS_TB WHERE USUARIOS_ID_CEDULA_PK = :id`,
                [cedula]
            );
            if (resultUser.rows.length > 0) {
                // oracledb devuelve objeto o array según config. Aquí aseguramos obtener el string.
                // Si usas outFormat OBJECT: resultUser.rows[0].CONTRASENA
                // Si usas outFormat ARRAY: resultUser.rows[0][0]
                const row = resultUser.rows[0];
                passFinal = row.CONTRASENA || row[0]; 
            }
        }

        // PASO 2: Actualizar Usuario con la contraseña correcta (nueva o vieja)
        await connection.execute(
            `BEGIN 
                G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_ACTUALIZAR_SP(:ced, :nom, :ape1, :ape2, :pass, :estado, :rol); 
             END;`,
            {
                ced: cedula, nom: nombre, ape1: apellido1, ape2: apellido2,
                pass: passFinal, 
                estado: 1, // Activo
                rol: 30    // Rol Cliente
            }
        );

        // PASO 3: Actualizar Teléfono
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_ACTUALIZAR_SP(:ced, :tel); END;`,
            { ced: cedula, tel: telefono }
        );

        res.json({ message: 'Cliente actualizado correctamente' });
    } catch (err) {
        console.error("Error actualizando:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// 3. ELIMINAR CLIENTE (Borrado Lógico)
app.delete('/api/clientes/:cedula', async (req, res) => {
    const { cedula } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        // Tu SP de eliminar cliente ya hace el borrado lógico en cascada al usuario (según tu SQL)
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_ELIMINAR_SP(:ced); END;`,
            { ced: cedula }
        );
        res.json({ message: 'Cliente eliminado (inactivo)' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});


// 1. CREAR RESERVACIÓN
app.post('/api/reservaciones', async (req, res) => {
    const { fecha, horaInicio, horaFin, clienteId, direccionId } = req.body;
    
    // Generamos un ID numérico aleatorio (simulación de secuencia)
    const idReserva = Math.floor(Math.random() * 100000);

    // Construimos timestamps para Oracle (Fecha + Hora)
    // Asumimos que fecha viene "YYYY-MM-DD" y horas "HH:mm"
    const tsInicio = new Date(`${fecha}T${horaInicio}:00`);
    const tsFin = new Date(`${fecha}T${horaFin}:00`);

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN 
                G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(
                    :id, :fecha, :inicio, :fin, :cliente, :dir
                ); 
             END;`,
            {
                id: idReserva,
                fecha: new Date(fecha), // Oracle driver maneja JS Date a DATE
                inicio: tsInicio,       // Oracle driver maneja JS Date a TIMESTAMP
                fin: tsFin,
                cliente: clienteId,
                dir: direccionId
            }
        );
        res.status(201).json({ message: 'Reservación creada' });
    } catch (err) {
        console.error("Error crear reserva:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// 2. EDITAR RESERVACIÓN
app.put('/api/reservaciones/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha, horaInicio, horaFin, clienteId, direccionId, estado } = req.body;

    const tsInicio = new Date(`${fecha}T${horaInicio}:00`);
    const tsFin = new Date(`${fecha}T${horaFin}:00`);

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN 
                G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_ACTUALIZAR_SP(
                    :id, :fecha, :inicio, :fin, :estado, :cliente, :dir
                ); 
             END;`,
            {
                id: id,
                fecha: new Date(fecha),
                inicio: tsInicio,
                fin: tsFin,
                estado: estado,
                cliente: clienteId,
                dir: direccionId
            }
        );
        res.json({ message: 'Reservación actualizada' });
    } catch (err) {
        console.error("Error actualizar reserva:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// 3. CANCELAR RESERVACIÓN (Borrado Lógico)
app.delete('/api/reservaciones/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_ELIMINAR_SP(:id); END;`,
            { id: id }
        );
        res.json({ message: 'Reservación cancelada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

app.post('/api/productos', async (req, res) => {
    const { nombre, descripcion, precio, cantidad, categoriaId } = req.body;
    
    // Generar ID aleatorio (simulando secuencia)
    const idProducto = Math.floor(Math.random() * 100000);

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN 
                G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_INSERTAR_SP(
                    :id, :nom, :desc, :prec, :cant, :cat
                ); 
             END;`,
            {
                id: idProducto,
                nom: nombre,
                desc: descripcion,
                prec: precio,
                cant: cantidad,
                cat: categoriaId
            }
        );
        res.status(201).json({ message: 'Producto creado' });
    } catch (err) {
        console.error("Error crear producto:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// 2. EDITAR PRODUCTO
app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, cantidad, categoriaId, estado } = req.body;

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN 
                G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_ACTUALIZAR_SP(
                    :id, :nom, :desc, :prec, :cant, :cat, :estado
                ); 
             END;`,
            {
                id: id,
                nom: nombre,
                desc: descripcion,
                prec: precio,
                cant: cantidad,
                cat: categoriaId,
                estado: estado || 1 // Default activo si no viene
            }
        );
        res.json({ message: 'Producto actualizado' });
    } catch (err) {
        console.error("Error actualizar producto:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// 3. ELIMINAR PRODUCTO (Borrado Lógico)
app.delete('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        // El SP por defecto pone estado 2 (inactivo)
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_ELIMINAR_SP(:id); END;`,
            { id: id }
        );
        res.json({ message: 'Producto eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

app.post('/api/servicios', async (req, res) => {
    const { nombre, descripcion, precio, categoriaId } = req.body;
    
    // ID aleatorio
    const idServicio = Math.floor(Math.random() * 100000);

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN 
                G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_SERVICIOS_INSERTAR_SP(
                    :id, :nom, :desc, :prec, :cat
                ); 
             END;`,
            {
                id: idServicio,
                nom: nombre,
                desc: descripcion,
                prec: precio,
                cat: categoriaId
            }
        );
        res.status(201).json({ message: 'Servicio creado' });
    } catch (err) {
        console.error("Error crear servicio:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// 2. EDITAR SERVICIO
app.put('/api/servicios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, categoriaId, estado } = req.body;

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN 
                G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_SERVICIOS_ACTUALIZAR_SP(
                    :id, :nom, :desc, :prec, :cat, :estado
                ); 
             END;`,
            {
                id: id,
                nom: nombre,
                desc: descripcion,
                prec: precio,
                cat: categoriaId,
                estado: estado || 1
            }
        );
        res.json({ message: 'Servicio actualizado' });
    } catch (err) {
        console.error("Error actualizar servicio:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// 3. ELIMINAR SERVICIO (Borrado Lógico)
app.delete('/api/servicios/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_SERVICIOS_ELIMINAR_SP(:id); END;`,
            { id: id }
        );
        res.json({ message: 'Servicio eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});