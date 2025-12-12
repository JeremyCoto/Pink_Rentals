// ====================================================================
// PINK RENTALS - SERVER.JS (MODO ESTRICTO: SOLO STORED PROCEDURES)
// ====================================================================

// 1. IMPORTACIONES
// ----------------
require('dotenv').config(); // Para variables de entorno (opcional)
const express = require('express'); // Framework del servidor
const oracledb = require('oracledb'); // Driver de Oracle
const cors = require('cors'); // Permite que tu Frontend (HTML/JS) se comunique con este Backend

// 2. CONFIGURACIÓN INICIAL
// ------------------------
const app = express();
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(express.json()); // Permitir que el servidor entienda JSON en el cuerpo de las peticiones

// Configuración global de Oracle
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT; // Recibir datos como Objetos { id: 1 } en vez de Arrays [1]

// Datos de conexión (Asegúrate que coincidan con tu máquina virtual/local)
const dbConfig = {
    user: "G2_SC508_VT_PROYECTO",
    password: "1234",
    connectString: "localhost:1521/xe"
};

// ====================================================================
// 3. FUNCIÓN HELPER (AYUDA) - PARA LEER DATOS (GET)
// ====================================================================
// Esta función evita repetir código. Sirve para ejecutar cualquier SP que devuelva un cursor (lista).
async function executeCursorSP(spName) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Ejecutamos el SP indicando que esperamos un CURSOR de salida
        const result = await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.${spName}(:cursor); END;`,
            { 
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Parámetro de salida
            }
        );

        // Extraemos los datos del cursor
        const resultSet = result.outBinds.cursor;
        const rows = await resultSet.getRows();
        await resultSet.close(); // IMPORTANTE: Cerrar el cursor para liberar memoria
        
        // Convertimos las llaves a minúsculas (Oracle devuelve MAYÚSCULAS por defecto)
        // Esto facilita el uso en el Frontend (ej. usar 'nombre' en vez de 'NOMBRE')
        return rows.map(row => {
            const obj = {};
            Object.keys(row).forEach(key => obj[key.toLowerCase()] = row[key]);
            return obj;
        });

    } catch (err) {
        throw new Error(err.message);
    } finally {
        if (connection) await connection.close(); // Siempre cerrar la conexión
    }
}

// ====================================================================
// 4. AUTENTICACIÓN (LOGIN)
// ====================================================================
app.post('/api/login', async (req, res) => {
    const { cedula, password } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Llamada al SP de autenticación que agregamos en la Parte 1
        const result = await connection.execute(
            `BEGIN 
                G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_AUTENTICACION_SP(:c, :p, :cursor); 
            END;`,
            {
                c: cedula,
                p: password,
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        const resultSet = result.outBinds.cursor;
        const rows = await resultSet.getRows();
        await resultSet.close();

        if (rows.length > 0) {
            const user = rows[0];
            // Enviamos al frontend solo los datos necesarios
            res.json({ 
                success: true, 
                user: {
                    cedula: user.USUARIOS_ID_CEDULA_PK,
                    nombre: `${user.NOMBRE} ${user.PRIMER_APELLIDO}`,
                    rol: user.ROLES_ID_ROL_PK
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales inválidas o usuario inactivo' });
        }
    } catch (err) {
        console.error("Error Login:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ====================================================================
// 5. REGISTRO DE CLIENTES (TRANSACCIÓN DOBLE)
// ====================================================================
// Esta ruta es crítica: Crea el Usuario Y el Cliente al mismo tiempo.
app.post('/api/clientes', async (req, res) => {
    // Desestructuramos todos los datos que vienen del formulario
    const { cedula, nombre, apellido1, apellido2, telefono, password } = req.body;
    let connection;
    
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // PASO A: Crear el Usuario (Rol 30 = Cliente)
        // Usamos autoCommit: false para que NO se guarde todavía, por si falla el paso B.
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_INSERTAR_SP(:c, :n, :a1, :a2, :p, 30); END;`,
            { c: cedula, n: nombre, a1: apellido1, a2: apellido2, p: password },
            { autoCommit: false } 
        );

        // PASO B: Crear el registro en la tabla Clientes (vinculado por cédula)
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_INSERTAR_SP(:c, :t); END;`,
            { c: cedula, t: telefono },
            { autoCommit: false }
        );

        // Si ambos pasos funcionaron, "confirmamos" los cambios permanentemente
        await connection.commit();
        res.status(201).json({ success: true, message: 'Cliente registrado correctamente' });

    } catch (err) {
        // Si algo falló, "deshacemos" todo (Rollback) para no dejar datos corruptos
        if (connection) {
            try { await connection.rollback(); } catch (e) { console.error(e); }
        }
        console.error("Error en registro:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ====================================================================
// 6. CHECKOUT / RESERVA (TRANSACCIÓN COMPLEJA)
// ====================================================================
app.post('/api/checkout', async (req, res) => {
    const { clienteId, fecha, horaInicio, horaFin, direccionId, items, total } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Generamos IDs aleatorios (en un sistema real usarías secuencias de Oracle)
        const idReserva = Math.floor(Math.random() * 1000000);
        const idFactura = Math.floor(Math.random() * 1000000);
        
        // Formateo de fechas para Oracle
        const tsInicio = new Date(`${fecha}T${horaInicio}:00`);
        const tsFin = new Date(`${fecha}T${horaFin}:00`);

        // 1. Insertar la Reserva
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(:id, :f, :i, :fn, :c, :d); END;`,
            { id: idReserva, f: new Date(fecha), i: tsInicio, fn: tsFin, c: clienteId, d: direccionId },
            { autoCommit: false }
        );

        let lineaFactura = 1;
        let lineaReserva = 1;

        // 2. Recorrer el carrito de compras (items)
        for (const item of items) {
            if (item.tipo === 'servicio') {
                // Insertar detalle en la reserva
                await connection.execute(
                    `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(:rid, :ln, :cant, :prec, :sid, :pid); END;`,
                    { rid: idReserva, ln: lineaReserva++, cant: 1, prec: item.precio, sid: item.id, pid: null },
                    { autoCommit: false }
                );
                // Insertar línea en la factura (detalle de cobro)
                await connection.execute(
                    `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(:fid, :ln, :cant, :prec, :sub, :sid); END;`,
                    { fid: idFactura, ln: lineaFactura++, cant: 1, prec: item.precio, sub: item.precio, sid: item.id },
                    { autoCommit: false }
                );
            } else if (item.tipo === 'producto') {
                 // Si es un producto (ej. Props), se guarda en Asignaciones
                 const idAsignacion = Math.floor(Math.random() * 1000000);
                 await connection.execute(
                    `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(:id, :n, :pid, :rid); END;`,
                    { id: idAsignacion, n: 'Producto Web', pid: item.id, rid: idReserva },
                    { autoCommit: false }
                );
            }
        }

        // 3. Crear la Factura Global
        const impuesto = total * 0.13;
        const granTotal = total + impuesto;
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(:fid, :f, :m, :imp, :det, :pid, :rid); END;`,
            { fid: idFactura, f: new Date(), m: granTotal, imp: impuesto, det: 'Compra Web', pid: 1, rid: idReserva }, // pid 1 = estado pendiente/pagado (ajustar segun tu lógica)
            { autoCommit: false }
        );

        // 4. Todo salió bien: COMMIT
        await connection.commit();
        res.json({ success: true, reservaId: idReserva });

    } catch (err) {
        if (connection) try { await connection.rollback(); } catch (e) {}
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ====================================================================
// 7. LECTURAS MASIVAS (GET)
// ====================================================================
// Mapeamos el nombre de la ruta URL -> Nombre del SP en Oracle
const TABLE_ENDPOINTS = {
    'estados': 'FIDE_ESTADOS_LISTAR_SP',
    'roles': 'FIDE_ROLES_LISTAR_SP',
    'provincias': 'FIDE_PROVINCIA_LISTAR_SP',
    'cantones': 'FIDE_CANTON_LISTAR_SP',
    'distritos': 'FIDE_DISTRITO_LISTAR_SP',
    'direcciones': 'FIDE_DIRECCIONES_LISTAR_SP', 
    'clientes': 'FIDE_CLIENTES_LISTAR_SP',
    'reservaciones': 'FIDE_RESERVACIONES_LISTAR_SP',
    'productos': 'FIDE_PRODUCTOS_LISTAR_SP',
    'servicios': 'FIDE_SERVICIOS_LISTAR_SP',
    'detalles-reserva': 'FIDE_DETALLE_RES_LISTAR_SP',
    'facturas': 'FIDE_FACTURACION_LISTAR_SP',
    'metodos-pago': 'FIDE_METODO_PAGO_LISTAR_SP',
    'categorias-producto': 'FIDE_CATEGORIA_PRODUCTO_LISTAR_SP',
    'categorias-servicio': 'FIDE_CATEGORIA_SERVICIO_LISTAR_SP',
    'paquetes': 'FIDE_PAQUETE_LISTAR_SP',
    'usuarios': 'FIDE_USUARIOS_LISTAR_SP',
    'detalles-factura': 'FIDE_DETALLE_FACT_LISTAR_SP',
    'asignaciones': 'FIDE_ASIGNACION_LISTAR_SP', 
    'paquetes-servicio': 'FIDE_PAQUETES_POR_SERV_LISTAR_SP'
};

// Generamos automáticamente las rutas GET para todo lo anterior
Object.entries(TABLE_ENDPOINTS).forEach(([route, spName]) => {
    app.get(`/api/${route}`, async (req, res) => {
        try {
            // Usamos la función helper creada al inicio
            const data = await executeCursorSP(spName);
            res.json(data);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });
});

// ====================================================================
// 8. CRUDs ESPECÍFICOS (PUT / DELETE / POSTs Adicionales)
// ====================================================================

// --- GESTIÓN DE CLIENTES (Actualizar y Eliminar) ---
app.put('/api/clientes/:cedula', async (req, res) => {
    const { nombre, apellido1, apellido2, telefono, password } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Obtenemos la contraseña vieja usando el SP (NO SELECT)
        // Esto es necesario por si el usuario dejó el campo "password" vacío en el form
        const result = await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_OBTENER_SP(:c, :cursor); END;`,
            { c: req.params.cedula, cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } }
        );
        const resultSet = result.outBinds.cursor;
        const rows = await resultSet.getRows();
        await resultSet.close();

        let finalPass = password;
        if (!password && rows.length > 0) {
            finalPass = rows[0].CONTRASENA; // Mantenemos la anterior
        }

        // 2. Actualizamos Usuario
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_ACTUALIZAR_SP(:c, :n, :a1, :a2, :p, 1, 30); END;`,
            { c: req.params.cedula, n: nombre, a1: apellido1, a2: apellido2, p: finalPass }, { autoCommit: false });
            
        // 3. Actualizamos Cliente (teléfono)
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_ACTUALIZAR_SP(:c, :t); END;`,
            { c: req.params.cedula, t: telefono }, { autoCommit: false });

        await connection.commit();
        res.json({ message: 'OK' });

    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally { 
        if (connection) await connection.close(); 
    }
});

app.delete('/api/clientes/:cedula', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        // Borrado lógico via SP
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_ELIMINAR_SP(:c); END;`, 
            { c: req.params.cedula }, 
            { autoCommit: true }
        );
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

// --- GESTIÓN DE USUARIOS (ADMIN) ---
app.post('/api/usuarios', async (req, res) => {
    const { cedula, nombre, apellido1, apellido2, password, rol } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_INSERTAR_SP(:c, :n, :a1, :a2, :p, :r); END;`,
            { c: cedula, n: nombre, a1: apellido1, a2: apellido2, p: password, r: rol }, 
            { autoCommit: true }
        );
        res.status(201).json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

// --- GESTIÓN DE PRODUCTOS / PAQUETES / SERVICIOS (Ejemplos) ---
// Se sigue el mismo patrón: Conexión -> Ejecutar SP -> Responder.

app.post('/api/paquetes', async (req, res) => {
    const { nombre, descripcion, precio } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PAQUETE_INSERTAR_SP(:id, :n, :d, :p); END;`,
            { id: Math.floor(Math.random() * 100000), n: nombre, d: descripcion, p: precio }, 
            { autoCommit: true }
        );
        res.status(201).json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

app.post('/api/productos', async (req, res) => {
    const { nombre, descripcion, precio, cantidad, categoriaId } = req.body;
    let connection; 
    try { 
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_INSERTAR_SP(:id, :n, :d, :p, :c, :cat); END;`, 
            { id: Math.floor(Math.random()*100000), n: nombre, d: descripcion, p: precio, c: cantidad, cat: categoriaId },
            { autoCommit: true }
        );
        res.status(201).json({message: 'OK'}); 
    } catch(e){ res.status(500).json({error:e.message}) } finally { if(connection) await connection.close() }
});

app.delete('/api/productos/:id', async (req, res) => {
    let connection; 
    try { 
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_ELIMINAR_SP(:id); END;`, 
            { id: req.params.id },
            { autoCommit: true }
        );
        res.json({message: 'OK'}); 
    } catch(e){ res.status(500).json({error:e.message}) } finally { if(connection) await connection.close() }
});

// ====================================================================
// 9. INICIO DEL SERVIDOR
// ====================================================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Pink Rentals corriendo en http://localhost:${PORT}`);
});