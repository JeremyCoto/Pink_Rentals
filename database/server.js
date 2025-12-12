// ====================================================================
// PINK RENTALS - SERVER.JS (CORREGIDO Y OPTIMIZADO)
// ====================================================================

// 1. IMPORTACIONES
// ----------------
require('dotenv').config();
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

// 2. CONFIGURACIÓN INICIAL
// ------------------------
const app = express();
app.use(cors());
app.use(express.json());

// Configuración global de Oracle
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT; // Retorna objetos { id: 1 }
oracledb.autoCommit = false; // Control manual de transacciones (Importante)

// Datos de conexión
const dbConfig = {
    user: "G2_SC508_VT_PROYECTO",
    password: "1234",
    connectString: "localhost:1521/xe"
};

// ====================================================================
// 3. FUNCIONES HELPER (AYUDA)
// ====================================================================

// Ejecuta un SP que devuelve un cursor (para consultas GET)
async function executeCursorSP(spName) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.${spName}(:cursor); END;`,
            { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } }
        );

        const resultSet = result.outBinds.cursor;
        const rows = await resultSet.getRows();
        await resultSet.close();
        
        // Convertir keys a minúsculas
        return rows.map(row => {
            const obj = {};
            Object.keys(row).forEach(key => obj[key.toLowerCase()] = row[key]);
            return obj;
        });

    } catch (err) {
        throw new Error(err.message);
    } finally {
        if (connection) await connection.close();
    }
}

// NUEVO: Obtiene el siguiente valor de una secuencia de Oracle
// Necesario para procesos complejos (Checkout) donde requerimos el ID antes de insertar hijos.
async function getNextSequenceValue(connection, sequenceName) {
    const result = await connection.execute(
        `SELECT G2_SC508_VT_PROYECTO.${sequenceName}.NEXTVAL AS "val" FROM DUAL`
    );
    return result.rows[0].val; // Retorna el número (ej. 942)
}

// ====================================================================
// 4. AUTENTICACIÓN (LOGIN)
// ====================================================================
app.post('/api/login', async (req, res) => {
    const { cedula, password } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Nota: Asegúrate de tener el SP FIDE_AUTENTICACION_SP creado en tu base de datos
        // Si no lo tienes, puedes usar FIDE_USUARIOS_LISTAR_SP y filtrar en JS temporalmente.
        // Aquí asumo que usaremos el método seguro de SP si existiera, o validación directa.
        
        // OPCIÓN ROBUSTA: Usar el listado y filtrar (Si no tienes el SP de Auth específico)
        const result = await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_LISTAR_SP(:cursor); END;`,
            { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } }
        );
        
        const resultSet = result.outBinds.cursor;
        let rows = await resultSet.getRows();
        await resultSet.close();

        // Buscamos el usuario manualmente (Temporal hasta tener SP Auth específico)
        const user = rows.find(u => u.USUARIOS_ID_CEDULA_PK == cedula && u.CONTRASENA == password && u.ESTADOS_ID_ESTADO_PK == 1);

        if (user) {
            res.json({ 
                success: true, 
                user: {
                    cedula: user.USUARIOS_ID_CEDULA_PK,
                    nombre: `${user.NOMBRE} ${user.PRIMER_APELLIDO}`,
                    rol: user.ROLES_ID_ROL_PK
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
    } catch (err) {
        console.error("Error Login:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ====================================================================
// 5. REGISTRO DE CLIENTES
// ====================================================================
app.post('/api/clientes', async (req, res) => {
    const { cedula, nombre, apellido1, apellido2, telefono, password } = req.body;
    let connection;
    
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Crear Usuario
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_INSERTAR_SP(:c, :n, :a1, :a2, :p, 30); END;`,
            { c: cedula, n: nombre, a1: apellido1, a2: apellido2, p: password }
        );

        // 2. Crear Cliente
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_INSERTAR_SP(:c, :t); END;`,
            { c: cedula, t: telefono }
        );

        await connection.commit();
        res.status(201).json({ success: true, message: 'Cliente registrado' });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error registro:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ====================================================================
// 6. CHECKOUT / RESERVA (CORREGIDO CON SECUENCIAS)
// ====================================================================
app.post('/api/checkout', async (req, res) => {
    const { clienteId, fecha, horaInicio, horaFin, direccionId, items, total } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // A. OBTENER IDs DE LAS SECUENCIAS (Ya no usamos Math.random)
        const idReserva = await getNextSequenceValue(connection, 'FIDE_RESERVACIONES_SEQ');
        const idFactura = await getNextSequenceValue(connection, 'FIDE_FACTURACION_SEQ');
        
        // Formateo de fechas
        const tsInicio = new Date(`${fecha}T${horaInicio}:00`);
        const tsFin = new Date(`${fecha}T${horaFin}:00`);

        // B. INSERTAR RESERVA (Usando el ID obtenido de la secuencia)
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(:id, :f, :i, :fn, :c, :d); END;`,
            { id: idReserva, f: new Date(fecha), i: tsInicio, fn: tsFin, c: clienteId, d: direccionId }
        );

        let lineaFactura = 1;
        let lineaReserva = 1;

        // C. PROCESAR ITEMS
        for (const item of items) {
            if (item.tipo === 'servicio') {
                // Detalle Reserva
                await connection.execute(
                    `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(:rid, :ln, :cant, :prec, :sid, :pid); END;`,
                    { rid: idReserva, ln: lineaReserva++, cant: 1, prec: item.precio, sid: item.id, pid: null }
                );
                // Detalle Factura
                await connection.execute(
                    `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(:fid, :ln, :cant, :prec, :sub, :sid); END;`,
                    { fid: idFactura, ln: lineaFactura++, cant: 1, prec: item.precio, sub: item.precio, sid: item.id }
                );
            } else if (item.tipo === 'producto') {
                 // Asignación (Obtenemos secuencia para asignación también)
                 const idAsignacion = await getNextSequenceValue(connection, 'FIDE_ASIGNACION_SEQ');
                 await connection.execute(
                    `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(:id, :n, :pid, :rid); END;`,
                    { id: idAsignacion, n: 'Reserva Web', pid: item.id, rid: idReserva }
                );
            }
        }

        // D. CREAR FACTURA
        const impuesto = total * 0.13;
        const granTotal = total + impuesto;
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(:fid, :f, :m, :imp, :det, :pid, :rid); END;`,
            { fid: idFactura, f: new Date(), m: granTotal, imp: impuesto, det: 'Compra Web', pid: null, rid: idReserva } 
            // Nota: pid (Pago ID) se envía null si no hay pago inmediato, o deberías crear un pago primero.
        );

        // E. CONFIRMAR TODO
        await connection.commit();
        res.json({ success: true, reservaId: idReserva });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error Checkout:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ====================================================================
// 7. LECTURAS MASIVAS (GET)
// ====================================================================
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

Object.entries(TABLE_ENDPOINTS).forEach(([route, spName]) => {
    app.get(`/api/${route}`, async (req, res) => {
        try {
            const data = await executeCursorSP(spName);
            res.json(data);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });
});

// ====================================================================
// 8. CRUDs ESPECÍFICOS (CORREGIDOS: IDS AUTOMÁTICOS)
// ====================================================================

// CLIENTES (PUT / DELETE)
app.put('/api/clientes/:cedula', async (req, res) => {
    const { nombre, apellido1, apellido2, telefono, password } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        // Aquí no usamos SP de "Obtener", simplificamos usando listado o update directo si la pass es opcional
        // Para este ejemplo asumimos que el usuario envía la contraseña o manejamos lógica extra
        
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_ACTUALIZAR_SP(:c, :n, :a1, :a2, :p, 1, 30); END;`,
            { c: req.params.cedula, n: nombre, a1: apellido1, a2: apellido2, p: password });
            
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_ACTUALIZAR_SP(:c, :t); END;`,
            { c: req.params.cedula, t: telefono });

        await connection.commit();
        res.json({ message: 'OK' });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally { if (connection) await connection.close(); }
});

app.delete('/api/clientes/:cedula', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_ELIMINAR_SP(:c); END;`, 
            { c: req.params.cedula }
        );
        await connection.commit(); // Importante commit
        res.json({ message: 'OK' });
    } catch (err) { 
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message }); 
    } finally { if (connection) await connection.close(); }
});

// USUARIOS (ADMIN)
app.post('/api/usuarios', async (req, res) => {
    const { cedula, nombre, apellido1, apellido2, password, rol } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_INSERTAR_SP(:c, :n, :a1, :a2, :p, :r); END;`,
            { c: cedula, n: nombre, a1: apellido1, a2: apellido2, p: password, r: rol }
        );
        await connection.commit();
        res.status(201).json({ message: 'OK' });
    } catch (err) { 
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message }); 
    } finally { if (connection) await connection.close(); }
});

// PAQUETES (ID AUTOMÁTICO)
app.post('/api/paquetes', async (req, res) => {
    const { nombre, descripcion, precio } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        // ENVIAMOS NULL EN EL ID: El Trigger de la BD asignará el valor de la secuencia.
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PAQUETE_INSERTAR_SP(:id, :n, :d, :p); END;`,
            { id: null, n: nombre, d: descripcion, p: precio }
        );
        await connection.commit();
        res.status(201).json({ message: 'OK' });
    } catch (err) { 
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message }); 
    } finally { if (connection) await connection.close(); }
});

// PRODUCTOS (ID AUTOMÁTICO)
app.post('/api/productos', async (req, res) => {
    const { nombre, descripcion, precio, cantidad, categoriaId } = req.body;
    let connection; 
    try { 
        connection = await oracledb.getConnection(dbConfig);
        // ENVIAMOS NULL EN EL ID para que el Trigger use la secuencia FIDE_PRODUCTOS_SEQ
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_INSERTAR_SP(:id, :n, :d, :p, :c, :cat); END;`, 
            { id: null, n: nombre, d: descripcion, p: precio, c: cantidad, cat: categoriaId }
        );
        await connection.commit();
        res.status(201).json({message: 'OK'}); 
    } catch(e){ 
        if (connection) await connection.rollback();
        res.status(500).json({error:e.message}) 
    } finally { if(connection) await connection.close() }
});

// PRODUCTOS ELIMINAR
app.delete('/api/productos/:id', async (req, res) => {
    let connection; 
    try { 
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_ELIMINAR_SP(:id); END;`, 
            { id: req.params.id }
        );
        await connection.commit();
        res.json({message: 'OK'}); 
    } catch(e){ 
        if (connection) await connection.rollback();
        res.status(500).json({error:e.message}) 
    } finally { if(connection) await connection.close() }
});

// ====================================================================
// 9. INICIO DEL SERVIDOR
// ====================================================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Pink Rentals corriendo en http://localhost:${PORT}`);
});