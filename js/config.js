// ============================================
// PINK RENTALS - CONFIGURACIÓN GLOBAL
// ============================================
// Configuración y catálogos basados en la BD real de Oracle

const CONFIG = {
    APP_NAME: 'Pink Rentals',
    TAGLINE: 'Photobooth',
    VERSION: '2.0 - Avance 2',
    
    // Configuración de "conexión" a Oracle (simulada)
    DATABASE: {
        HOST: 'localhost',
        PORT: '1521',
        SERVICE: 'ORCL',
        USER: 'G2_SC508_VT_PROYECTO',
        STATUS: 'Conectado (Simulado)'
    }
};

// ============================================
// ESTADOS (FIDE_ESTADOS_TB)
// ============================================
const ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2,
    PENDIENTE: 3,
    CONFIRMADO: 4,
    COMPLETADO: 4,
    CANCELADO: 5,
    PAGADO: 6
};

const ESTADOS_NOMBRES = {
    1: 'Activo',
    2: 'Inactivo/Anulado',
    3: 'Pendiente',
    4: 'Confirmado/Completado',
    5: 'Cancelado',
    6: 'Pagado'
};

// ============================================
// ROLES (FIDE_ROLES_TB)
// ============================================
const ROLES = {
    ADMINISTRADOR: 10,
    EMPLEADO: 20,
    CLIENTE: 30,
    INVITADO: 40
};

const ROLES_NOMBRES = {
    10: 'Administrador',
    20: 'Empleado',
    30: 'Cliente',
    40: 'Invitado'
};

// ============================================
// MÉTODOS DE PAGO (FIDE_METODO_PAGO_TB)
// ============================================
const METODOS_PAGO = {
    TARJETA: 100,
    SINPE: 101,
    EFECTIVO: 102,
    BILLETERA: 103
};

const METODOS_PAGO_NOMBRES = {
    100: 'Tarjeta de Crédito',
    101: 'Transferencia SINPE',
    102: 'Efectivo',
    103: 'Billetera Digital'
};

// ============================================
// TIPOS DE EVENTO
// ============================================
const TIPOS_EVENTO = [
    'Boda',
    'XV Años',
    'Cumpleaños',
    'Corporativo',
    'Graduación',
    'Baby Shower',
    'Otro'
];

// ============================================
// CATEGORÍAS DE PRODUCTO (FIDE_CATEGORIA_PRODUCTO_TB)
// ============================================
const CATEGORIAS_PRODUCTO = {
    1: 'Letras Luminosas',
    2: 'Props',
    3: 'Backdrops',
    4: 'Marcos'
};

// ============================================
// CATEGORÍAS DE SERVICIO (FIDE_CATEGORIA_SERVICIO_TB)
// ============================================
const CATEGORIAS_SERVICIO = {
    1: 'Photobooth',
    2: 'Pista LED',
    3: 'Video Booth',
    4: 'Letras Luminosas',
    5: 'Decoración'
};

// ============================================
// PROVINCIAS DE COSTA RICA (FIDE_PROVINCIA_TB)
// ============================================
const PROVINCIAS = {
    1: 'San José',
    2: 'Alajuela',
    3: 'Cartago',
    4: 'Heredia',
    5: 'Guanacaste',
    6: 'Puntarenas',
    7: 'Limón'
};

// ============================================
// CANTONES (FIDE_CANTON_TB) - Simplificado
// ============================================
const CANTONES = {
    1: [
        { id: 101, nombre: 'San José' },
        { id: 102, nombre: 'Escazú' },
        { id: 103, nombre: 'Desamparados' },
        { id: 104, nombre: 'Puriscal' }
    ],
    2: [
        { id: 201, nombre: 'Alajuela' },
        { id: 202, nombre: 'San Ramón' },
        { id: 203, nombre: 'Grecia' }
    ],
    3: [
        { id: 301, nombre: 'Cartago' },
        { id: 302, nombre: 'Paraíso' },
        { id: 303, nombre: 'La Unión' }
    ],
    4: [
        { id: 401, nombre: 'Heredia' },
        { id: 402, nombre: 'Barva' },
        { id: 403, nombre: 'Santo Domingo' }
    ],
    5: [
        { id: 501, nombre: 'Liberia' },
        { id: 502, nombre: 'Nicoya' },
        { id: 503, nombre: 'Santa Cruz' }
    ],
    6: [
        { id: 601, nombre: 'Puntarenas' },
        { id: 602, nombre: 'Esparza' },
        { id: 603, nombre: 'Buenos Aires' }
    ],
    7: [
        { id: 701, nombre: 'Limón' },
        { id: 702, nombre: 'Pococí' },
        { id: 703, nombre: 'Siquirres' }
    ]
};

// ============================================
// DISTRITOS (FIDE_DISTRITO_TB) - Simplificado
// ============================================
const DISTRITOS = {
    101: [
        { id: 10101, nombre: 'Carmen' },
        { id: 10102, nombre: 'Merced' },
        { id: 10103, nombre: 'Hospital' },
        { id: 10104, nombre: 'Catedral' }
    ],
    102: [
        { id: 10201, nombre: 'Escazú Centro' },
        { id: 10202, nombre: 'San Antonio' },
        { id: 10203, nombre: 'San Rafael' }
    ],
    201: [
        { id: 20101, nombre: 'Alajuela' },
        { id: 20102, nombre: 'San José' },
        { id: 20103, nombre: 'Carrizal' }
    ],
    301: [
        { id: 30101, nombre: 'Oriental' },
        { id: 30102, nombre: 'Occidental' },
        { id: 30103, nombre: 'Carmen' }
    ]
    // Agregar más según necesites
};

// ============================================
// ICONOS PARA SERVICIOS
// ============================================
const ICONOS_SERVICIOS = {
    'Photobooth': '📸',
    'Letras Luminosas': '💡',
    'Video Booth': '🎬',
    'Pista LED': '🪩',
    'Decoración': '🎨'
};

// ============================================
// COLORES DE ESTADO (para badges)
// ============================================
const COLORES_ESTADO = {
    1: 'success',      // Activo
    2: 'danger',       // Inactivo
    3: 'warning',      // Pendiente
    4: 'info',         // Confirmado
    5: 'danger',       // Cancelado
    6: 'success'       // Pagado
};

// Exportar configuración (para usar en otros archivos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        ESTADOS,
        ESTADOS_NOMBRES,
        ROLES,
        ROLES_NOMBRES,
        METODOS_PAGO,
        METODOS_PAGO_NOMBRES,
        TIPOS_EVENTO,
        CATEGORIAS_PRODUCTO,
        CATEGORIAS_SERVICIO,
        PROVINCIAS,
        CANTONES,
        DISTRITOS,
        ICONOS_SERVICIOS,
        COLORES_ESTADO
    };
}

console.log('✅ Configuración cargada correctamente');
console.log('📊 Base de Datos:', CONFIG.DATABASE.STATUS);