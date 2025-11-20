// ============================================
// PINK RENTALS - SCRIPT PRINCIPAL (DASHBOARD)
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🎉 Pink Rentals - Sistema Conectado a Oracle');
    
    // Eliminamos inicializarMockData();
    mostrarEstadoConexion();
    cargarEstadisticasReales();
    cargarActividadRecienteReales();
    inicializarInfoCardsInteractivas();
});

async function cargarEstadisticasReales() {
    try {
        // Peticiones en paralelo para velocidad
        const [clientes, reservaciones, productos, servicios] = await Promise.all([
            ApiService.getClientes(),
            ApiService.getReservaciones(),
            ApiService.getProductos(),
            ApiService.getServicios()
        ]);

        animarContador('total-clientes', clientes.length);
        animarContador('total-reservaciones', reservaciones.length);
        animarContador('total-productos', productos.length);
        animarContador('total-servicios', servicios.length);
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
    }
}

async function cargarActividadRecienteReales() {
    try {
        const tbody = document.getElementById('tabla-actividad-reciente');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';

        // Obtenemos datos reales
        const reservaciones = await ApiService.getReservaciones();
        const clientes = await ApiService.getClientes();

        tbody.innerHTML = '';

        if (reservaciones.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">No hay actividad reciente</td></tr>`;
            return;
        }

        // Ordenar por fecha (más reciente primero)
        const ordenadas = reservaciones.sort((a, b) => 
            new Date(b.fecha_reservacion) - new Date(a.fecha_reservacion)
        ).slice(0, 5);

        ordenadas.forEach(r => {
            // Buscar nombre del cliente (Cruzamos datos de las 2 tablas)
            const cliente = clientes.find(c => c.usuarios_id_cedula_pk === r.usuarios_id_cedula_pk);
            
            // NOTA: Oracle devuelve las columnas en minúscula gracias a nuestro server.js
            const nombreCliente = cliente 
                ? `${cliente.nombre} ${cliente.primer_apellido}` 
                : 'Cliente desconocido';
            
            const estadoNombre = ESTADOS_NOMBRES[r.estados_id_estado_pk] || 'Desconocido';
            const estadoClase = obtenerClaseEstado(r.estados_id_estado_pk);

            const fila = tbody.insertRow();
            fila.classList.add('row-animated');
            fila.innerHTML = `
                <td><strong>#${r.reservaciones_id_reservacion_pk}</strong></td>
                <td>Reservación General</td> <td>${nombreCliente}</td>
                <td>${PinkUtils.formatearFechaES(r.fecha_reservacion)}</td>
                <td><span class="estado-badge estado-${estadoClase}">${estadoNombre}</span></td>
            `;
        });

    } catch (error) {
        console.error('❌ Error actividad reciente:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Error de conexión</td></tr>';
    }
}

function mostrarEstadoConexion() {
    const statusElement = document.getElementById('db-status');
    if (statusElement) {
        statusElement.textContent = "Conectado a Oracle (Real)";
        statusElement.style.color = "#4caf50"; // Verde éxito
    }
}

// ... (Mantener funciones Helpers: animarContador, obtenerClaseEstado, inicializarInfoCardsInteractivas igual que antes) ...
// Copia aquí las funciones helpers que ya tenías abajo en tu archivo original
function animarContador(elementId, valorFinal) {
    const elemento = document.getElementById(elementId);
    if (!elemento) return;
    let valorActual = 0;
    const duracion = 900;
    const incremento = valorFinal / (duracion / 16);
    const intervalo = setInterval(() => {
        valorActual += incremento;
        if (valorActual >= valorFinal) { valorActual = valorFinal; clearInterval(intervalo); }
        elemento.textContent = Math.floor(valorActual);
    }, 16);
}

function obtenerClaseEstado(estadoId) {
    const mapa = { 1: 'confirmado', 2: 'cancelado', 3: 'pendiente', 4: 'completado', 5: 'cancelado', 6: 'confirmado' };
    return mapa[estadoId] || 'pendiente';
}

function inicializarInfoCardsInteractivas() {
    const cards = document.querySelectorAll('.info-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.add('info-card-active');
            setTimeout(() => card.classList.remove('info-card-active'), 350);
        });
    });
}