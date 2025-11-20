// js/api.js
const API_BASE = 'http://localhost:3000/api';

const ApiService = {
    // Función interna para fetch
    async _fetch(endpoint) {
        try {
            const res = await fetch(`${API_BASE}/${endpoint}`);
            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error(`Error cargando ${endpoint}:`, error);
            return []; // Retorna vacío para evitar romper la UI
        }
    },

    // --- Métodos para las 23 Tablas ---
    // Usamos los mismos nombres definidos en server.js (TABLE_ENDPOINTS)
    
    // Catálogos Principales
    getClientes: () => ApiService._fetch('clientes'),
    getProductos: () => ApiService._fetch('productos'),
    getServicios: () => ApiService._fetch('servicios'),
    getReservaciones: () => ApiService._fetch('reservaciones'),
    getFacturas: () => ApiService._fetch('facturas'),
    getEmpleados: () => ApiService._fetch('empleados'),

    // Geografía
    getProvincias: () => ApiService._fetch('provincias'),
    getCantones: () => ApiService._fetch('cantones'),
    getDistritos: () => ApiService._fetch('distritos'),
    getDirecciones: () => ApiService._fetch('direcciones'),

    // Configuración
    getEstados: () => ApiService._fetch('estados'),
    getRoles: () => ApiService._fetch('roles'),
    getMetodosPago: () => ApiService._fetch('metodos-pago'),
    getUsuarios: () => ApiService._fetch('usuarios'),
    getCorreos: () => ApiService._fetch('correos'),

    // Categorías y Paquetes
    getCategoriasProducto: () => ApiService._fetch('categorias-producto'),
    getCategoriasServicio: () => ApiService._fetch('categorias-servicio'),
    getPaquetes: () => ApiService._fetch('paquetes'),
    
    // Tablas Intermedias / Detalles
    getPaquetesPorServicio: () => ApiService._fetch('paquetes-servicios'),
    getAsignaciones: () => ApiService._fetch('asignaciones'),
    getDetallesReserva: () => ApiService._fetch('detalles-reserva'),
    getDetallesFactura: () => ApiService._fetch('detalles-factura'),


    getClientes: () => ApiService._fetch('clientes'),
    // NUEVOS MÉTODOS CRUD
    crearCliente: async (cliente) => {
        const res = await fetch(`${API_BASE}/clientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cliente)
        });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    },

    actualizarCliente: async (cedula, cliente) => {
        const res = await fetch(`${API_BASE}/clientes/${cedula}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cliente)
        });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    },

    eliminarCliente: async (cedula) => {
        const res = await fetch(`${API_BASE}/clientes/${cedula}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    },

    crearReservacion: async (data) => {
        const res = await fetch(`${API_BASE}/reservaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    },

    actualizarReservacion: async (id, data) => {
        const res = await fetch(`${API_BASE}/reservaciones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    },

    eliminarReservacion: async (id) => {
        const res = await fetch(`${API_BASE}/reservaciones/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    }
};