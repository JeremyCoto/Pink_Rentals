// ============================================
// PINK RENTALS - DATOS SIMULADOS (MOCK DATA)
// ============================================
// Estos datos simulan lo que vendría de Oracle
// Estructura basada en FIDE_PROYECTO_FINAL_PKG

// ============================================
// CLIENTES (FIDE_CLIENTES_TB)
// ============================================
const MOCK_CLIENTES = [
    {
        CLIENTES_ID_CEDULA_PK: 118520347,
        nombre: 'María',
        primer_apellido: 'García',
        segundo_apellido: 'López',
        DISTRITO_ID_DISTRITO_PK: 10101,
        ESTADOS_ID_ESTADO_PK: 1,
        fecha_registro: '2024-10-15'
    },
    {
        CLIENTES_ID_CEDULA_PK: 207890123,
        nombre: 'Carlos',
        primer_apellido: 'Rodríguez',
        segundo_apellido: 'Pérez',
        DISTRITO_ID_DISTRITO_PK: 10201,
        ESTADOS_ID_ESTADO_PK: 1,
        fecha_registro: '2024-11-02'
    },
    {
        CLIENTES_ID_CEDULA_PK: 305670890,
        nombre: 'Ana',
        primer_apellido: 'Martínez',
        segundo_apellido: 'Solís',
        DISTRITO_ID_DISTRITO_PK: 20101,
        ESTADOS_ID_ESTADO_PK: 1,
        fecha_registro: '2024-09-20'
    },
    {
        CLIENTES_ID_CEDULA_PK: 401230567,
        nombre: 'José',
        primer_apellido: 'Ramírez',
        segundo_apellido: 'Castro',
        DISTRITO_ID_DISTRITO_PK: 10102,
        ESTADOS_ID_ESTADO_PK: 1,
        fecha_registro: '2024-08-10'
    },
    {
        CLIENTES_ID_CEDULA_PK: 509876543,
        nombre: 'Laura',
        primer_apellido: 'Fernández',
        segundo_apellido: 'Mora',
        DISTRITO_ID_DISTRITO_PK: 30101,
        ESTADOS_ID_ESTADO_PK: 1,
        fecha_registro: '2024-07-25'
    }
];

// ============================================
// PAQUETES (FIDE_PAQUETE_TB)
// ============================================
const MOCK_PAQUETES = [
    {
        PAQUETE_ID_PAQUETE_PK: 1,
        nombre_paquete: 'Paquete Básico',
        descripcion: 'Photobooth clásico con impresión instantánea',
        precio_total: 120000,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        PAQUETE_ID_PAQUETE_PK: 2,
        nombre_paquete: 'Paquete Premium',
        descripcion: 'Photobooth + Letras LED + Props',
        precio_total: 180000,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        PAQUETE_ID_PAQUETE_PK: 3,
        nombre_paquete: 'Paquete VIP',
        descripcion: 'Photobooth + Letras LED + Pista LED + Video Booth',
        precio_total: 280000,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        PAQUETE_ID_PAQUETE_PK: 4,
        nombre_paquete: 'Paquete Corporativo',
        descripcion: 'Ideal para eventos empresariales',
        precio_total: 150000,
        ESTADOS_ID_ESTADO_PK: 1
    }
];

// ============================================
// RESERVACIONES (FIDE_RESERVACIONES_TB)
// ============================================
const MOCK_RESERVACIONES = [
    {
        RESERVACIONES_ID_RESERVA_PK: 1,
        fecha_reserva: '2024-11-01',
        fecha_evento: '2024-12-20',
        USUARIOS_ID_CEDULA_PK: 118520347,
        CLIENTES_ID_CEDULA_PK: 118520347,
        PAQUETE_ID_PAQUETE_PK: 2,
        ESTADOS_ID_ESTADO_PK: 4,
        nombre_evento: 'Boda González-Pérez'
    },
    {
        RESERVACIONES_ID_RESERVA_PK: 2,
        fecha_reserva: '2024-11-10',
        fecha_evento: '2025-01-15',
        USUARIOS_ID_CEDULA_PK: 118520347,
        CLIENTES_ID_CEDULA_PK: 118520347,
        PAQUETE_ID_PAQUETE_PK: 3,
        ESTADOS_ID_ESTADO_PK: 3,
        nombre_evento: 'XV Años Valentina'
    },
    {
        RESERVACIONES_ID_RESERVA_PK: 3,
        fecha_reserva: '2024-10-15',
        fecha_evento: '2024-11-30',
        USUARIOS_ID_CEDULA_PK: 207890123,
        CLIENTES_ID_CEDULA_PK: 207890123,
        PAQUETE_ID_PAQUETE_PK: 4,
        ESTADOS_ID_ESTADO_PK: 4,
        nombre_evento: 'Evento Corporativo Tech Solutions'
    },
    {
        RESERVACIONES_ID_RESERVA_PK: 4,
        fecha_reserva: '2024-09-20',
        fecha_evento: '2024-10-05',
        USUARIOS_ID_CEDULA_PK: 305670890,
        CLIENTES_ID_CEDULA_PK: 305670890,
        PAQUETE_ID_PAQUETE_PK: 1,
        ESTADOS_ID_ESTADO_PK: 4,
        nombre_evento: 'Cumpleaños Andrea 30 años'
    },
    {
        RESERVACIONES_ID_RESERVA_PK: 5,
        fecha_reserva: '2024-11-15',
        fecha_evento: '2024-12-25',
        USUARIOS_ID_CEDULA_PK: 509876543,
        CLIENTES_ID_CEDULA_PK: 509876543,
        PAQUETE_ID_PAQUETE_PK: 2,
        ESTADOS_ID_ESTADO_PK: 3,
        nombre_evento: 'Baby Shower Laura'
    }
];

// ============================================
// PRODUCTOS (FIDE_PRODUCTOS_TB)
// ============================================
const MOCK_PRODUCTOS = [
    {
        PRODUCTO_ID_PRODUCTO_PK: 1,
        nombre: 'LOVE - Letras LED',
        descripcion: 'Letras luminosas LED de 1.2m de altura',
        precio_unitario: 35000,
        cantidad: 3,
        CATEGORIA_PRODUCTO_ID_CATEGORIA_PK: 1,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        PRODUCTO_ID_PRODUCTO_PK: 2,
        nombre: 'Set Props Boda',
        descripcion: 'Set de 20 props temáticos para bodas',
        precio_unitario: 8000,
        cantidad: 5,
        CATEGORIA_PRODUCTO_ID_CATEGORIA_PK: 2,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        PRODUCTO_ID_PRODUCTO_PK: 3,
        nombre: 'Backdrop Floral',
        descripcion: 'Fondo decorativo con flores artificiales 2x2m',
        precio_unitario: 25000,
        cantidad: 2,
        CATEGORIA_PRODUCTO_ID_CATEGORIA_PK: 3,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        PRODUCTO_ID_PRODUCTO_PK: 4,
        nombre: 'Marco Vintage',
        descripcion: 'Marco decorativo estilo vintage grande',
        precio_unitario: 12000,
        cantidad: 4,
        CATEGORIA_PRODUCTO_ID_CATEGORIA_PK: 4,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        PRODUCTO_ID_PRODUCTO_PK: 5,
        nombre: 'MR & MRS Letras LED',
        descripcion: 'Letras luminosas para bodas',
        precio_unitario: 30000,
        cantidad: 2,
        CATEGORIA_PRODUCTO_ID_CATEGORIA_PK: 1,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        PRODUCTO_ID_PRODUCTO_PK: 6,
        nombre: 'Set Props XV Años',
        descripcion: 'Props temáticos para quinceañeras',
        precio_unitario: 10000,
        cantidad: 3,
        CATEGORIA_PRODUCTO_ID_CATEGORIA_PK: 2,
        ESTADOS_ID_ESTADO_PK: 1
    }
];

// ============================================
// SERVICIOS (FIDE_SERVICIOS_TB)
// ============================================
const MOCK_SERVICIOS = [
    {
        SERVICIOS_ID_SERVICIO_PK: 1,
        nombre: 'Photobooth Clásico',
        descripcion: 'Cabina fotográfica con impresión instantánea y props divertidos',
        precio: 120000,
        CATEGORIA_SERVICIO_ID_CATEGORIA_PK: 1,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        SERVICIOS_ID_SERVICIO_PK: 2,
        nombre: 'Letras Luminosas',
        descripcion: 'Letras LED personalizadas para decorar tu evento',
        precio: 45000,
        CATEGORIA_SERVICIO_ID_CATEGORIA_PK: 4,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        SERVICIOS_ID_SERVICIO_PK: 3,
        nombre: 'Video Booth',
        descripcion: 'Cabina de video con efectos especiales y música',
        precio: 95000,
        CATEGORIA_SERVICIO_ID_CATEGORIA_PK: 3,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        SERVICIOS_ID_SERVICIO_PK: 4,
        nombre: 'Pista LED',
        descripcion: 'Pista de baile iluminada con efectos dinámicos',
        precio: 80000,
        CATEGORIA_SERVICIO_ID_CATEGORIA_PK: 2,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        SERVICIOS_ID_SERVICIO_PK: 5,
        nombre: 'Decoración Premium',
        descripcion: 'Decoración completa temática para tu evento',
        precio: 65000,
        CATEGORIA_SERVICIO_ID_CATEGORIA_PK: 5,
        ESTADOS_ID_ESTADO_PK: 1
    }
];

// ============================================
// EMPLEADOS (FIDE_EMPLEADOS_TB)
// ============================================
const MOCK_EMPLEADOS = [
    {
        EMPLEADOS_ID_CEDULA_PK: 601234567,
        nombre: 'Roberto',
        primer_apellido: 'Campos',
        segundo_apellido: 'Mora',
        fecha_contratacion: '2023-01-15',
        salario: 450000,
        DISTRITO_ID_DISTRITO_PK: 10101,
        ESTADOS_ID_ESTADO_PK: 1
    },
    {
        EMPLEADOS_ID_CEDULA_PK: 702345678,
        nombre: 'Sofía',
        primer_apellido: 'Vargas',
        segundo_apellido: 'Díaz',
        fecha_contratacion: '2023-06-20',
        salario: 420000,
        DISTRITO_ID_DISTRITO_PK: 10201,
        ESTADOS_ID_ESTADO_PK: 1
    }
];

// ============================================
// FUNCIONES AUXILIARES PARA MOCK DATA
// ============================================

/**
 * Inicializa LocalStorage con datos mock
 */
function inicializarMockData() {
    if (!localStorage.getItem('mock_clientes')) {
        localStorage.setItem('mock_clientes', JSON.stringify(MOCK_CLIENTES));
        localStorage.setItem('mock_paquetes', JSON.stringify(MOCK_PAQUETES));
        localStorage.setItem('mock_reservaciones', JSON.stringify(MOCK_RESERVACIONES));
        localStorage.setItem('mock_productos', JSON.stringify(MOCK_PRODUCTOS));
        localStorage.setItem('mock_servicios', JSON.stringify(MOCK_SERVICIOS));
        localStorage.setItem('mock_empleados', JSON.stringify(MOCK_EMPLEADOS));
        
        // Contadores
        localStorage.setItem('counter_clientes', '509876544');
        localStorage.setItem('counter_reservaciones', '6');
        localStorage.setItem('counter_productos', '7');
        localStorage.setItem('counter_servicios', '6');
        
        console.log('✅ Datos mock inicializados en LocalStorage');
    }
}

/**
 * Limpia todos los datos mock
 */
function limpiarMockData() {
    localStorage.clear();
    console.log('🗑️ Datos mock limpiados');
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MOCK_CLIENTES,
        MOCK_PAQUETES,
        MOCK_RESERVACIONES,
        MOCK_PRODUCTOS,
        MOCK_SERVICIOS,
        MOCK_EMPLEADOS,
        inicializarMockData,
        limpiarMockData
    };
}