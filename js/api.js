// js/api.js
const API_BASE = 'http://localhost:3000/api';

const ApiService = {
    // Helper privado
    async _fetch(endpoint) {
        try {
            const res = await fetch(`${API_BASE}/${endpoint}`);
            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error(`Error cargando ${endpoint}:`, error);
            return [];
        }
    },
    
    // --- LECTURAS ---
    getClientes: () => ApiService._fetch('clientes'),
    getProductos: () => ApiService._fetch('productos'),
    getServicios: () => ApiService._fetch('servicios'),
    getReservaciones: () => ApiService._fetch('reservaciones'),
    getFacturas: () => ApiService._fetch('facturas'),
    getEmpleados: () => ApiService._fetch('empleados'),
    getProvincias: () => ApiService._fetch('provincias'),
    getCantones: () => ApiService._fetch('cantones'),
    getDistritos: () => ApiService._fetch('distritos'),
    getDirecciones: () => ApiService._fetch('direcciones'),
    getEstados: () => ApiService._fetch('estados'),
    getRoles: () => ApiService._fetch('roles'),
    getMetodosPago: () => ApiService._fetch('metodos-pago'),
    getUsuarios: () => ApiService._fetch('usuarios'),
    getCategoriasProducto: () => ApiService._fetch('categorias-producto'),
    getCategoriasServicio: () => ApiService._fetch('categorias-servicio'),
    getPaquetes: () => ApiService._fetch('paquetes'),
    getDetallesReserva: () => ApiService._fetch('detalles-reserva'),
    getDetallesFactura: () => ApiService._fetch('detalles-factura'),
    getAsignaciones: () => ApiService._fetch('asignaciones'),

    // --- ESCRITURAS (CRUD) ---

    // Generic Helper
    async _request(method, endpoint, data) {
        const options = { method: method };
        if (data) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(data);
        }
        const res = await fetch(`${API_BASE}/${endpoint}`, options);
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    },

    // Clientes
    crearCliente: (d) => ApiService._request('POST', 'clientes', d),
    actualizarCliente: (id, d) => ApiService._request('PUT', `clientes/${id}`, d),
    eliminarCliente: (id) => ApiService._request('DELETE', `clientes/${id}`),

    // Usuarios (Admin)
    crearUsuario: (d) => ApiService._request('POST', 'usuarios', d),
    actualizarUsuario: (id, d) => ApiService._request('PUT', `usuarios/${id}`, d),
    eliminarUsuario: (id) => ApiService._request('DELETE', `usuarios/${id}`),

    // Paquetes
    crearPaquete: (d) => ApiService._request('POST', 'paquetes', d),
    actualizarPaquete: (id, d) => ApiService._request('PUT', `paquetes/${id}`, d),
    eliminarPaquete: (id) => ApiService._request('DELETE', `paquetes/${id}`),

    // Productos/Servicios/Reservas
    crearProducto: (d) => ApiService._request('POST', 'productos', d),
    actualizarProducto: (id, d) => ApiService._request('PUT', `productos/${id}`, d),
    eliminarProducto: (id) => ApiService._request('DELETE', `productos/${id}`),
    
    crearServicio: (d) => ApiService._request('POST', 'servicios', d),
    actualizarServicio: (id, d) => ApiService._request('PUT', `servicios/${id}`, d),
    eliminarServicio: (id) => ApiService._request('DELETE', `servicios/${id}`),

    crearReservacion: (d) => ApiService._request('POST', 'reservaciones', d),
    actualizarReservacion: (id, d) => ApiService._request('PUT', `reservaciones/${id}`, d),
    eliminarReservacion: (id) => ApiService._request('DELETE', `reservaciones/${id}`),

    // Facturación
    anularFactura: (id) => ApiService._request('DELETE', `facturas/${id}`),

    // Ubicaciones
    crearProvincia: (d) => ApiService._request('POST', 'provincias', d),
    eliminarProvincia: (id) => ApiService._request('DELETE', `provincias/${id}`),
    
    crearCanton: (d) => ApiService._request('POST', 'cantones', d),
    eliminarCanton: (id) => ApiService._request('DELETE', `cantones/${id}`),
    
    crearDistrito: (d) => ApiService._request('POST', 'distritos', d),
    eliminarDistrito: (id) => ApiService._request('DELETE', `distritos/${id}`)
};