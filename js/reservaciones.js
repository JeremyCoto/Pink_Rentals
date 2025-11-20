document.addEventListener('DOMContentLoaded', () => {
    cargarReservacionesReales();
    document.getElementById('filtro-estado').addEventListener('change', filtrarReservaciones);
});

let reservasCache = [];
let clientesCacheR = [];

async function cargarReservacionesReales() {
    const tbody = document.getElementById('tabla-reservaciones');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando datos...</td></tr>';

    try {
        // Cargar Reservas y Clientes (para saber quién reservó)
        const [reservasData, clientesData] = await Promise.all([
            ApiService.getReservaciones(),
            ApiService.getClientes()
        ]);

        reservasCache = reservasData;
        clientesCacheR = clientesData;
        
        renderReservaciones(reservasCache);

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Error conectando a Oracle.</td></tr>';
    }
}

function renderReservaciones(reservas) {
    const tbody = document.getElementById('tabla-reservaciones');
    tbody.innerHTML = '';

    if (reservas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:40px;">No hay reservaciones.</td></tr>`;
        return;
    }

    reservas.sort((a, b) => new Date(b.fecha_reservacion) - new Date(a.fecha_reservacion));

    reservas.forEach(r => {
        // Match de cliente usando las llaves foráneas reales
        const cliente = clientesCacheR.find(c => c.usuarios_id_cedula_pk === r.usuarios_id_cedula_pk);
        
        const nombreCliente = cliente
            ? `${cliente.nombre} ${cliente.primer_apellido}`
            : 'Cliente No Encontrado';

        const estadoNombre = ESTADOS_NOMBRES[r.estados_id_estado_pk] || 'Estado Desconocido';
        const estadoClase = obtenerClaseEstado(r.estados_id_estado_pk);

        const fila = tbody.insertRow();
        fila.classList.add('row-animated');
        fila.innerHTML = `
            <td>#${r.reservaciones_id_reservacion_pk}</td>
            <td>Evento General</td> <td>${nombreCliente}</td>
            <td>${PinkUtils.formatearFechaES(r.fecha_reservacion)}</td>
            <td><span class="estado-badge estado-${estadoClase}">${estadoNombre}</span></td>
        `;
    });
}

function filtrarReservaciones(e) {
    const estadoId = e.target.value;
    const filtradas = estadoId
        ? reservasCache.filter(r => String(r.estados_id_estado_pk) === estadoId)
        : reservasCache;
    renderReservaciones(filtradas);
}

function obtenerClaseEstado(estadoId) {
    const mapa = { 3: 'pendiente', 4: 'completado', 5: 'cancelado', 6: 'confirmado' };
    return mapa[estadoId] || 'pendiente';
}