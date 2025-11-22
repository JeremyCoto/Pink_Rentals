require('dotenv').config();
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

const dbConfig = {
    user: "G2_SC508_VT_PROYECTO",
    password: "1234",
    connectString: "localhost:1521/xe"
};

// ==========================================
// 1. AUTENTICACIÓN (LOGIN)
// ==========================================
app.post('/api/login', async (req, res) => {
    const { cedula, password } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT USUARIOS_ID_CEDULA_PK, NOMBRE, PRIMER_APELLIDO, ROLES_ID_ROL_PK 
             FROM G2_SC508_VT_PROYECTO.FIDE_USUARIOS_TB 
             WHERE USUARIOS_ID_CEDULA_PK = :ced AND CONTRASENA = :pass AND ESTADOS_ID_ESTADO_PK = 1`,
            [cedula, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
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
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 2. TRANSACCIÓN COMPLEJA: CHECKOUT
// ==========================================
app.post('/api/checkout', async (req, res) => {
    const { clienteId, fecha, horaInicio, horaFin, direccionId, items, total } = req.body;
    
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const idReserva = Math.floor(Math.random() * 1000000);
        const idFactura = Math.floor(Math.random() * 1000000);
        const tsInicio = new Date(`${fecha}T${horaInicio}:00`);
        const tsFin = new Date(`${fecha}T${horaFin}:00`);

        // Insertar Reserva con Dirección Real
        await connection.execute(
            `BEGIN 
                G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(
                    :id, :fecha, :inicio, :fin, :cliente, :dir
                ); 
             END;`,
            {
                id: idReserva, fecha: new Date(fecha), inicio: tsInicio, fin: tsFin,
                cliente: clienteId, 
                dir: direccionId 
            },
            { autoCommit: false }
        );

        let lineaReserva = 1;
        let lineaFactura = 1;

        for (const item of items) {
            if (item.tipo === 'servicio') {
                await connection.execute(
                    `BEGIN 
                        G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(
                            :res_id, :linea, :cant, :precio, :serv_id, :paq_id
                        ); 
                     END;`,
                    {
                        res_id: idReserva, linea: lineaReserva++, cant: 1, 
                        precio: item.precio, serv_id: item.id, paq_id: null
                    },
                    { autoCommit: false }
                );

                await connection.execute(
                    `BEGIN 
                        G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(
                            :fact_id, :linea, :cant, :precio, :subtotal, :serv_id
                        ); 
                     END;`,
                    {
                        fact_id: idFactura, linea: lineaFactura++, cant: 1,
                        precio: item.precio, subtotal: item.precio, serv_id: item.id
                    },
                    { autoCommit: false }
                );
            } else if (item.tipo === 'producto') {
                 const idAsignacion = Math.floor(Math.random() * 1000000);
                 await connection.execute(
                    `BEGIN 
                        G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(
                            :id_asig, :notas, :prod_id, :res_id
                        ); 
                     END;`,
                    {
                        id_asig: idAsignacion, notas: 'Producto Web',
                        prod_id: item.id, res_id: idReserva
                    },
                    { autoCommit: false }
                );
            }
        }

        const impuesto = total * 0.13;
        const granTotal = total + impuesto;

        await connection.execute(
            `BEGIN 
                G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(
                    :fact_id, :fecha, :monto, :imp, :det, :pago_id, :res_id
                ); 
             END;`,
            {
                fact_id: idFactura, fecha: new Date(), monto: granTotal, imp: impuesto,
                det: 'Compra Web', pago_id: 1, res_id: idReserva
            },
            { autoCommit: false }
        );

        await connection.commit();
        res.json({ success: true, reservaId: idReserva });

    } catch (err) {
        console.error("Rollback:", err);
        if (connection) try { await connection.rollback(); } catch (e) {}
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 3. RUTAS DE LECTURA (GET GENÉRICOS)
// ==========================================
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
    'asignaciones': 'FIDE_ASIGNACION_LISTAR_SP',
    'facturas': 'FIDE_FACTURACION_LISTAR_SP',
    'metodos-pago': 'FIDE_METODO_PAGO_LISTAR_SP',
    'categorias-producto': 'FIDE_CATEGORIA_PRODUCTO_LISTAR_SP',
    'categorias-servicio': 'FIDE_CATEGORIA_SERVICIO_LISTAR_SP',
    'paquetes': 'FIDE_PAQUETE_LISTAR_SP',
    'usuarios': 'FIDE_USUARIOS_LISTAR_SP',
    'pagos': 'FIDE_PAGOS_LISTAR_SP',
    'empleados': 'FIDE_EMPLEADOS_LISTAR_SP',
    'correos': 'FIDE_CORREO_LISTAR_SP',
    'paquetes-servicios': 'FIDE_PAQUETES_POR_SERV_LISTAR_SP',
    'detalles-factura': 'FIDE_DETALLE_FACT_LISTAR_SP'
};

Object.entries(TABLE_ENDPOINTS).forEach(([route, spName]) => {
    app.get(`/api/${route}`, async (req, res) => {
        ejecutarConsulta(res, spName);
    });
});

async function ejecutarConsulta(res, spName) {
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
        
        const data = rows.map(row => {
            const obj = {};
            Object.keys(row).forEach(key => obj[key.toLowerCase()] = row[key]);
            return obj;
        });
        res.json(data);
    } catch (err) {
        res.status(500).send(err.message);
    } finally {
        if (connection) await connection.close();
    }
}

// ==========================================
// 4. CRUDS ESPECÍFICOS
// ==========================================

// --- CLIENTES ---
app.post('/api/clientes', async (req, res) => {
    const { cedula, nombre, apellido1, apellido2, telefono, password } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_INSERTAR_SP(:ced, :nom, :ape1, :ape2, :pass, :rol); END;`,
            { ced: cedula, nom: nombre, ape1: apellido1, ape2: apellido2, pass: password || 'Pink123', rol: 30 }
        );
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_INSERTAR_SP(:ced, :tel); END;`,
            { ced: cedula, tel: telefono }
        );
        res.status(201).json({ message: 'Cliente creado' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

app.put('/api/clientes/:cedula', async (req, res) => {
    const { cedula } = req.params;
    const { nombre, apellido1, apellido2, telefono, password } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        let passFinal = password;
        if (!password) {
            const r = await connection.execute(`SELECT contrasena FROM G2_SC508_VT_PROYECTO.FIDE_USUARIOS_TB WHERE USUARIOS_ID_CEDULA_PK=:c`, [cedula]);
            if(r.rows.length > 0) passFinal = r.rows[0].CONTRASENA;
        }
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_ACTUALIZAR_SP(:c, :n, :a1, :a2, :p, 1, 30); END;`,
            { c: cedula, n: nombre, a1: apellido1, a2: apellido2, p: passFinal }
        );
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_ACTUALIZAR_SP(:c, :t); END;`,
            { c: cedula, t: telefono }
        );
        res.json({ message: 'Cliente actualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

app.delete('/api/clientes/:cedula', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_ELIMINAR_SP(:c); END;`, { c: req.params.cedula });
        res.json({ message: 'Cliente eliminado' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

// --- RESERVACIONES (ADMIN) ---
app.post('/api/reservaciones', async (req, res) => {
    const { fecha, horaInicio, horaFin, clienteId, direccionId } = req.body;
    const idReserva = Math.floor(Math.random() * 100000);
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const tsInicio = new Date(`${fecha}T${horaInicio}:00`);
        const tsFin = new Date(`${fecha}T${horaFin}:00`);
        
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(:id, :f, :i, :fn, :c, :d); END;`,
            { id: idReserva, f: new Date(fecha), i: tsInicio, fn: tsFin, c: clienteId, d: direccionId }
        );
        res.status(201).json({ message: 'Reservación creada' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

app.put('/api/reservaciones/:id', async (req, res) => {
    const { fecha, horaInicio, horaFin, clienteId, direccionId, estado } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const tsInicio = new Date(`${fecha}T${horaInicio}:00`);
        const tsFin = new Date(`${fecha}T${horaFin}:00`);

        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_ACTUALIZAR_SP(:id, :f, :i, :fn, :e, :c, :d); END;`,
            { id: req.params.id, f: new Date(fecha), i: tsInicio, fn: tsFin, e: estado, c: clienteId, d: direccionId }
        );
        res.json({ message: 'Reservación actualizada' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

app.delete('/api/reservaciones/:id', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_ELIMINAR_SP(:id); END;`, { id: req.params.id });
        res.json({ message: 'Reservación cancelada' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

// --- PRODUCTOS ---
app.post('/api/productos', async (req, res) => {
    const { nombre, descripcion, precio, cantidad, categoriaId } = req.body;
    const id = Math.floor(Math.random() * 100000);
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_INSERTAR_SP(:id, :n, :d, :p, :c, :cat); END;`,
            { id: id, n: nombre, d: descripcion, p: precio, c: cantidad, cat: categoriaId }
        );
        res.status(201).json({ message: 'Producto creado' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

app.put('/api/productos/:id', async (req, res) => {
    const { nombre, descripcion, precio, cantidad, categoriaId, estado } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_ACTUALIZAR_SP(:id, :n, :d, :p, :c, :cat, :e); END;`,
            { id: req.params.id, n: nombre, d: descripcion, p: precio, c: cantidad, cat: categoriaId, e: estado || 1 }
        );
        res.json({ message: 'Producto actualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

app.delete('/api/productos/:id', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_ELIMINAR_SP(:id); END;`, { id: req.params.id });
        res.json({ message: 'Producto eliminado' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

// --- SERVICIOS ---
app.post('/api/servicios', async (req, res) => {
    const { nombre, descripcion, precio, categoriaId } = req.body;
    const id = Math.floor(Math.random() * 100000);
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_SERVICIOS_INSERTAR_SP(:id, :n, :d, :p, :c); END;`,
            { id: id, n: nombre, d: descripcion, p: precio, c: categoriaId }
        );
        res.status(201).json({ message: 'Servicio creado' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

app.put('/api/servicios/:id', async (req, res) => {
    const { nombre, descripcion, precio, categoriaId, estado } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_SERVICIOS_ACTUALIZAR_SP(:id, :n, :d, :p, :c, :e); END;`,
            { id: req.params.id, n: nombre, d: descripcion, p: precio, c: categoriaId, e: estado || 1 }
        );
        res.json({ message: 'Servicio actualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

app.delete('/api/servicios/:id', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_SERVICIOS_ELIMINAR_SP(:id); END;`, { id: req.params.id });
        res.json({ message: 'Servicio eliminado' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

// ==========================================
// INICIO DEL SERVIDOR
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Pink Rentals corriendo en http://localhost:${PORT}`);
});