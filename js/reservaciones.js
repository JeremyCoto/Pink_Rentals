document.addEventListener('DOMContentLoaded', () => {
    inicializarMockData();
    cargarReservaciones();
    document.getElementById('filtro-estado')
        .addEventListener('change', filtrarReservaciones);
});

let reservasCache = [];
let clientesCacheR = [];

function cargarReservaciones() {
    reservasCache = JSON.parse(localStorage.getItem('mock_reservaciones')) || [];
    clientesCacheR = JSON.parse(localStorage.getItem('mock_clientes')) || [];
    renderReservaciones(reservasCache);
}

function renderReservaciones(reservas) {
    const tbody = document.getElementById('tabla-reservaciones');
    tbody.innerHTML = '';

    if (reservas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center" style="padding:40px;">
                    No hay reservaciones registradas.
                </td>
            </tr>`;
        return;
    }

    reservas
        .slice()
        .sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento))
        .forEach(r => {
            const cliente = clientesCacheR.find(
                c => c.CLIENTES_ID_CEDULA_PK === r.CLIENTES_ID_CEDULA_PK
            );
            const nombreCliente = cliente
                ? `${cliente.nombre} ${cliente.primer_apellido}`
                : 'Cliente desconocido';

            const estadoNombre = ESTADOS_NOMBRES[r.ESTADOS_ID_ESTADO_PK] || 'Desconocido';
            const estadoClase = obtenerClaseEstado(r.ESTADOS_ID_ESTADO_PK);

            const fila = tbody.insertRow();
            fila.classList.add('row-animated');
            fila.innerHTML = `
                <td>#${r.RESERVACIONES_ID_RESERVA_PK}</td>
                <td>${r.nombre_evento}</td>
                <td>${nombreCliente}</td>
                <td>${PinkUtils.formatearFechaES(r.fecha_evento)}</td>
                <td><span class="estado-badge estado-${estadoClase}">${estadoNombre}</span></td>
            `;
        });
}

function filtrarReservaciones(e) {
    const estadoId = e.target.value;
    const filtradas = estadoId
        ? reservasCache.filter(r => String(r.ESTADOS_ID_ESTADO_PK) === estadoId)
        : reservasCache;
    renderReservaciones(filtradas);
}

function obtenerClaseEstado(estadoId) {
    const mapa = {
        3: 'pendiente',
        4: 'completado',
        5: 'cancelado',
        6: 'confirmado'
    };
    return mapa[estadoId] || 'pendiente';
}