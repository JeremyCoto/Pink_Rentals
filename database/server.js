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