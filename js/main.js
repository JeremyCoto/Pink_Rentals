// ============================================
// PINK RENTALS - SCRIPT PRINCIPAL (DASHBOARD)
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🎉 Pink Rentals - Sistema cargado');
    console.log('📊 Versión:', CONFIG.VERSION);

    inicializarMockData();     // de database/mock-data.js
    cargarEstadisticas();
    cargarActividadReciente();
    mostrarEstadoConexion();
    inicializarInfoCardsInteractivas();
});

// Carga estadísticas principales
function cargarEstadisticas() {
    try {
        const clientes = JSON.parse(localStorage.getItem('mock_clientes')) || [];
        const reservaciones = JSON.parse(localStorage.getItem('mock_reservaciones')) || [];
        const productos = JSON.parse(localStorage.getItem('mock_productos')) || [];
        const servicios = JSON.parse(localStorage.getItem('mock_servicios')) || [];

        animarContador('total-clientes', clientes.length);
        animarContador('total-reservaciones', reservaciones.length);
        animarContador('total-productos', productos.length);
        animarContador('total-servicios', servicios.length);
    } catch (error) {
        console.error('❌ Error al cargar estadísticas:', error);
    }
}

// Actividad reciente (últimas 5 reservaciones)
function cargarActividadReciente() {
    try {
        const reservaciones = JSON.parse(localStorage.getItem('mock_reservaciones')) || [];
        const clientes = JSON.parse(localStorage.getItem('mock_clientes')) || [];
        const tbody = document.getElementById('tabla-actividad-reciente');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (reservaciones.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center" style="padding: 40px;">
                        <p style="font-size: 16px; color: #999;">No hay actividad reciente</p>
                    </td>
                </tr>`;
            return;
        }

        const ordenadas = reservaciones
            .slice()
            .sort((a, b) => new Date(b.fecha_reserva) - new Date(a.fecha_reserva))
            .slice(0, 5);

        ordenadas.forEach(reserva => {
            const cliente = clientes.find(
                c => c.CLIENTES_ID_CEDULA_PK === reserva.CLIENTES_ID_CEDULA_PK
            );

            const nombreCliente = cliente
                ? `${cliente.nombre} ${cliente.primer_apellido}`
                : 'Cliente desconocido';

            const estadoNombre = ESTADOS_NOMBRES[reserva.ESTADOS_ID_ESTADO_PK] || 'Desconocido';
            const estadoClase = obtenerClaseEstado(reserva.ESTADOS_ID_ESTADO_PK);

            const fila = tbody.insertRow();
            fila.classList.add('row-animated');
            fila.innerHTML = `
                <td><strong>#${reserva.RESERVACIONES_ID_RESERVA_PK}</strong></td>
                <td>${reserva.nombre_evento || 'Sin nombre'}</td>
                <td>${nombreCliente}</td>
                <td>${PinkUtils.formatearFechaES(reserva.fecha_evento)}</td>
                <td><span class="estado-badge estado-${estadoClase}">${estadoNombre}</span></td>
            `;
        });
    } catch (error) {
        console.error('❌ Error al cargar actividad reciente:', error);
    }
}

function mostrarEstadoConexion() {
    const statusElement = document.getElementById('db-status');
    if (statusElement) {
        statusElement.textContent = CONFIG.DATABASE.STATUS;
    }
}

// Helpers
function animarContador(elementId, valorFinal) {
    const elemento = document.getElementById(elementId);
    if (!elemento) return;

    let valorActual = 0;
    const duracion = 900;
    const incremento = valorFinal / (duracion / 16);

    const intervalo = setInterval(() => {
        valorActual += incremento;
        if (valorActual >= valorFinal) {
            valorActual = valorFinal;
            clearInterval(intervalo);
        }
        elemento.textContent = Math.floor(valorActual);
    }, 16);
}

function obtenerClaseEstado(estadoId) {
    const mapa = {
        1: 'confirmado',   // Activo
        2: 'cancelado',    // Inactivo
        3: 'pendiente',    // Pendiente
        4: 'completado',   // Completado
        5: 'cancelado',    // Cancelado
        6: 'confirmado'    // Pagado
    };
    return mapa[estadoId] || 'pendiente';
}

function inicializarInfoCardsInteractivas() {
    const cards = document.querySelectorAll('.info-card');
    if (!cards.length || !window.PinkUtils) return;

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const titulo = card.querySelector('h3')?.textContent || 'Sección informativa';

            card.classList.add('info-card-active');
            setTimeout(() => card.classList.remove('info-card-active'), 350);

            PinkUtils.mostrarToast(`Sección "${titulo}" seleccionada (informativo)`, 'info');
        });
    });
}