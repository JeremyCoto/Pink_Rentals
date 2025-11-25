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
// 1. AUTENTICACIÓN
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
// 2. CHECKOUT (TRANSACCIÓN)
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

        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(:id, :f, :i, :fn, :c, :d); END;`,
            { id: idReserva, f: new Date(fecha), i: tsInicio, fn: tsFin, c: clienteId, d: direccionId },
            { autoCommit: false }
        );

        let lineaReserva = 1;
        let lineaFactura = 1;

        for (const item of items) {
            if (item.tipo === 'servicio') {
                await connection.execute(
                    `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(:rid, :ln, :cant, :prec, :sid, :pid); END;`,
                    { rid: idReserva, ln: lineaReserva++, cant: 1, prec: item.precio, sid: item.id, pid: null },
                    { autoCommit: false }
                );
                await connection.execute(
                    `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(:fid, :ln, :cant, :prec, :sub, :sid); END;`,
                    { fid: idFactura, ln: lineaFactura++, cant: 1, prec: item.precio, sub: item.precio, sid: item.id },
                    { autoCommit: false }
                );
            } else if (item.tipo === 'producto') {
                 const idAsignacion = Math.floor(Math.random() * 1000000);
                 await connection.execute(
                    `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(:id, :n, :pid, :rid); END;`,
                    { id: idAsignacion, n: 'Producto Web', pid: item.id, rid: idReserva },
                    { autoCommit: false }
                );
            }
        }

        const impuesto = total * 0.13;
        const granTotal = total + impuesto;

        await connection.execute(
            `BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(:fid, :f, :m, :imp, :det, :pid, :rid); END;`,
            { fid: idFactura, f: new Date(), m: granTotal, imp: impuesto, det: 'Compra Web', pid: 1, rid: idReserva },
            { autoCommit: false }
        );

        await connection.commit();
        res.json({ success: true, reservaId: idReserva });

    } catch (err) {
        if (connection) try { await connection.rollback(); } catch (e) {}
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 3. LECTURAS GENÉRICAS (GET)
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
    'facturas': 'FIDE_FACTURACION_LISTAR_SP',
    'metodos-pago': 'FIDE_METODO_PAGO_LISTAR_SP',
    'categorias-producto': 'FIDE_CATEGORIA_PRODUCTO_LISTAR_SP',
    'categorias-servicio': 'FIDE_CATEGORIA_SERVICIO_LISTAR_SP',
    'paquetes': 'FIDE_PAQUETE_LISTAR_SP',
    'usuarios': 'FIDE_USUARIOS_LISTAR_SP',
    'detalles-factura': 'FIDE_DETALLE_FACT_LISTAR_SP',
    'asignaciones': 'FIDE_ASIGNACION_LISTAR_SP', // ¡AGREGADO!
    'paquetes-servicio': 'FIDE_PAQUETES_POR_SERV_LISTAR_SP' // ¡AGREGADO!
};

Object.entries(TABLE_ENDPOINTS).forEach(([route, spName]) => {
    app.get(`/api/${route}`, async (req, res) => {
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
    });
});

// ==========================================
// 4. CRUDS ESPECÍFICOS (POST/PUT/DELETE)
// ==========================================
// (Mantener el resto de tus endpoints de POST/PUT/DELETE exactamente como los tenías.
//  No los repito aquí para no hacer el archivo kilométrico, pero NO LOS BORRES).
//  ... Pega aquí debajo los endpoints de clientes, usuarios, paquetes, productos, etc ...

// --- CLIENTES ---
app.post('/api/clientes', async (req, res) => {
    const { cedula, nombre, apellido1, apellido2, telefono, password } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_INSERTAR_SP(:c, :n, :a1, :a2, :p, 30); END;`,
            { c: cedula, n: nombre, a1: apellido1, a2: apellido2, p: password });
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_INSERTAR_SP(:c, :t); END;`,
            { c: cedula, t: telefono });
        res.status(201).json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});
app.put('/api/clientes/:cedula', async (req, res) => {
    const { nombre, apellido1, apellido2, telefono, password } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        let passFinal = password;
        if (!password) {
            const r = await connection.execute(`SELECT contrasena FROM G2_SC508_VT_PROYECTO.FIDE_USUARIOS_TB WHERE USUARIOS_ID_CEDULA_PK=:c`, [req.params.cedula]);
            if(r.rows.length > 0) passFinal = r.rows[0].CONTRASENA;
        }
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_ACTUALIZAR_SP(:c, :n, :a1, :a2, :p, 1, 30); END;`,
            { c: req.params.cedula, n: nombre, a1: apellido1, a2: apellido2, p: passFinal });
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_ACTUALIZAR_SP(:c, :t); END;`,
            { c: req.params.cedula, t: telefono });
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});
app.delete('/api/clientes/:cedula', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CLIENTES_ELIMINAR_SP(:c); END;`, { c: req.params.cedula });
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

// --- USUARIOS ---
app.post('/api/usuarios', async (req, res) => {
    const { cedula, nombre, apellido1, apellido2, password, rol } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_INSERTAR_SP(:c, :n, :a1, :a2, :p, :r); END;`,
            { c: cedula, n: nombre, a1: apellido1, a2: apellido2, p: password, r: rol });
        res.status(201).json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});
app.put('/api/usuarios/:cedula', async (req, res) => {
    const { nombre, apellido1, apellido2, password, rol, estado } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        let passFinal = password;
        if (!password) {
            const r = await connection.execute(`SELECT contrasena FROM G2_SC508_VT_PROYECTO.FIDE_USUARIOS_TB WHERE USUARIOS_ID_CEDULA_PK=:c`, [req.params.cedula]);
            if(r.rows.length > 0) passFinal = r.rows[0].CONTRASENA;
        }
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_ACTUALIZAR_SP(:c, :n, :a1, :a2, :p, :e, :r); END;`,
            { c: req.params.cedula, n: nombre, a1: apellido1, a2: apellido2, p: passFinal, e: estado, r: rol });
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});
app.delete('/api/usuarios/:cedula', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_USUARIOS_ELIMINAR_SP(:c); END;`, { c: req.params.cedula });
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

// --- PAQUETES ---
app.post('/api/paquetes', async (req, res) => {
    const { nombre, descripcion, precio } = req.body;
    const id = Math.floor(Math.random() * 100000);
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PAQUETE_INSERTAR_SP(:id, :n, :d, :p); END;`,
            { id: id, n: nombre, d: descripcion, p: precio });
        res.status(201).json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});
app.put('/api/paquetes/:id', async (req, res) => {
    const { nombre, descripcion, precio, estado } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PAQUETE_ACTUALIZAR_SP(:id, :n, :d, :p, :e); END;`,
            { id: req.params.id, n: nombre, d: descripcion, p: precio, e: estado });
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});
app.delete('/api/paquetes/:id', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PAQUETE_ELIMINAR_SP(:id); END;`, { id: req.params.id });
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if (connection) await connection.close(); }
});

// --- UBICACIONES ---
app.post('/api/provincias', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const id = Math.floor(Math.random() * 10000);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PROVINCIA_INSERTAR_SP(:id, :n); END;`, { id, n: req.body.nombre });
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if(connection) await connection.close(); }
});
app.delete('/api/provincias/:id', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PROVINCIA_ELIMINAR_SP(:id); END;`, {id:req.params.id});
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if(connection) await connection.close(); }
});
app.post('/api/cantones', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const id = Math.floor(Math.random() * 10000);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CANTON_INSERTAR_SP(:id, :p, :n); END;`, { id, p: req.body.provinciaId, n: req.body.nombre });
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if(connection) await connection.close(); }
});
app.delete('/api/cantones/:id', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_CANTON_ELIMINAR_SP(:id); END;`, {id:req.params.id});
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if(connection) await connection.close(); }
});
app.post('/api/distritos', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const id = Math.floor(Math.random() * 10000);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_DISTRITO_INSERTAR_SP(:id, :c, :n); END;`, { id, c: req.body.cantonId, n: req.body.nombre });
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if(connection) await connection.close(); }
});
app.delete('/api/distritos/:id', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_DISTRITO_ELIMINAR_SP(:id); END;`, {id:req.params.id});
        res.json({ message: 'OK' });
    } catch (err) { res.status(500).json({ error: err.message }); } finally { if(connection) await connection.close(); }
});

// --- PRODUCTOS / SERVICIOS / RESERVAS (RESTO) ---
app.post('/api/productos', async (req, res) => {
    const { nombre, descripcion, precio, cantidad, categoriaId } = req.body;
    let connection; try { connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_INSERTAR_SP(:id, :n, :d, :p, :c, :cat); END;`, 
    { id: Math.floor(Math.random()*100000), n: nombre, d: descripcion, p: precio, c: cantidad, cat: categoriaId });
    res.status(201).json({message: 'OK'}); } catch(e){res.status(500).json({error:e.message})} finally {if(connection) await connection.close()}
});
app.put('/api/productos/:id', async (req, res) => {
    const { nombre, descripcion, precio, cantidad, categoriaId, estado } = req.body;
    let connection; try { connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_ACTUALIZAR_SP(:id, :n, :d, :p, :c, :cat, :e); END;`, 
    { id: req.params.id, n: nombre, d: descripcion, p: precio, c: cantidad, cat: categoriaId, e: estado });
    res.json({message: 'OK'}); } catch(e){res.status(500).json({error:e.message})} finally {if(connection) await connection.close()}
});
app.delete('/api/productos/:id', async (req, res) => {
    let connection; try { connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_PRODUCTOS_ELIMINAR_SP(:id); END;`, { id: req.params.id });
    res.json({message: 'OK'}); } catch(e){res.status(500).json({error:e.message})} finally {if(connection) await connection.close()}
});

app.post('/api/servicios', async (req, res) => {
    const { nombre, descripcion, precio, categoriaId } = req.body;
    let connection; try { connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_SERVICIOS_INSERTAR_SP(:id, :n, :d, :p, :c); END;`, 
    { id: Math.floor(Math.random()*100000), n: nombre, d: descripcion, p: precio, c: categoriaId });
    res.status(201).json({message: 'OK'}); } catch(e){res.status(500).json({error:e.message})} finally {if(connection) await connection.close()}
});
app.put('/api/servicios/:id', async (req, res) => {
    const { nombre, descripcion, precio, categoriaId, estado } = req.body;
    let connection; try { connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_SERVICIOS_ACTUALIZAR_SP(:id, :n, :d, :p, :c, :e); END;`, 
    { id: req.params.id, n: nombre, d: descripcion, p: precio, c: categoriaId, e: estado });
    res.json({message: 'OK'}); } catch(e){res.status(500).json({error:e.message})} finally {if(connection) await connection.close()}
});
app.delete('/api/servicios/:id', async (req, res) => {
    let connection; try { connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_SERVICIOS_ELIMINAR_SP(:id); END;`, { id: req.params.id });
    res.json({message: 'OK'}); } catch(e){res.status(500).json({error:e.message})} finally {if(connection) await connection.close()}
});

app.post('/api/reservaciones', async (req, res) => {
    const { fecha, horaInicio, horaFin, clienteId, direccionId } = req.body;
    let connection; try { connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(:id, :f, :i, :fn, :c, :d); END;`, 
    { id: Math.floor(Math.random()*100000), f: new Date(fecha), i: new Date(`${fecha}T${horaInicio}:00`), fn: new Date(`${fecha}T${horaFin}:00`), c: clienteId, d: direccionId });
    res.status(201).json({message: 'OK'}); } catch(e){res.status(500).json({error:e.message})} finally {if(connection) await connection.close()}
});
app.put('/api/reservaciones/:id', async (req, res) => { 
    const { fecha, horaInicio, horaFin, clienteId, direccionId, estado } = req.body;
    let connection; try { connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_ACTUALIZAR_SP(:id, :f, :i, :fn, :e, :c, :d); END;`, 
    { id: req.params.id, f: new Date(fecha), i: new Date(`${fecha}T${horaInicio}:00`), fn: new Date(`${fecha}T${horaFin}:00`), e: estado, c: clienteId, d: direccionId });
    res.json({message: 'OK'}); } catch(e){res.status(500).json({error:e.message})} finally {if(connection) await connection.close()}
});
app.delete('/api/reservaciones/:id', async (req, res) => {
    let connection; try { connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_ELIMINAR_SP(:id); END;`, { id: req.params.id });
    res.json({message: 'OK'}); } catch(e){res.status(500).json({error:e.message})} finally {if(connection) await connection.close()}
});
app.delete('/api/facturas/:id', async (req, res) => {
    let connection; try { connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`BEGIN G2_SC508_VT_PROYECTO.FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_ELIMINAR_SP(:id); END;`, { id: req.params.id });
    res.json({message: 'OK'}); } catch(e){res.status(500).json({error:e.message})} finally {if(connection) await connection.close()}
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Pink Rentals corriendo en http://localhost:${PORT}`);
});