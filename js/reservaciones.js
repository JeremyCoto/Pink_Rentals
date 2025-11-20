document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosIniciales();
    document.getElementById('filtro-estado').addEventListener('change', filtrarReservaciones);
    document.getElementById('form-reserva').addEventListener('submit', manejarGuardado);
    
    // Listener para detectar qué cliente seleccionó el usuario en el datalist
    document.getElementById('input-cliente').addEventListener('change', detectarClienteSeleccionado);
});

let reservasCache = [];
let clientesCacheR = [];
let direccionesCache = [];
let editandoId = null; // null = Crear

async function cargarDatosIniciales() {
    const tbody = document.getElementById('tabla-reservaciones');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando datos...</td></tr>';

    try {
        // Cargar todo lo necesario en paralelo
        const [reservas, clientes, direcciones] = await Promise.all([
            ApiService.getReservaciones(),
            ApiService.getClientes(),
            ApiService.getDirecciones()
        ]);

        reservasCache = reservas;
        clientesCacheR = clientes;
        direccionesCache = direcciones;

        // Preparar los selectores del Modal
        renderDatalistClientes(clientes);
        renderSelectDirecciones(direcciones);

        renderReservaciones(reservasCache);

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error conectando a Oracle.</td></tr>';
    }
}

// --- RENDERIZADO DE TABLA ---
function renderReservaciones(reservas) {
    const tbody = document.getElementById('tabla-reservaciones');
    tbody.innerHTML = '';

    if (reservas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:40px;">No hay reservaciones.</td></tr>`;
        return;
    }

    // Ordenar por fecha descendente
    reservas.sort((a, b) => new Date(b.fecha_reservacion) - new Date(a.fecha_reservacion));

    reservas.forEach(r => {
        const cliente = clientesCacheR.find(c => c.usuarios_id_cedula_pk === r.usuarios_id_cedula_pk);
        const nombreCliente = cliente ? `${cliente.nombre} ${cliente.primer_apellido}` : r.usuarios_id_cedula_pk;
        
        const estadoNombre = ESTADOS_NOMBRES[r.estados_id_estado_pk] || 'Desc';
        const estadoClase = obtenerClaseEstado(r.estados_id_estado_pk);

        // Extraer hora limpia del timestamp ISO
        const horaInicio = r.hora_inicio ? new Date(r.hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
        const horaFin = r.hora_fin ? new Date(r.hora_fin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';

        const fila = tbody.insertRow();
        fila.innerHTML = `
            <td>#${r.reservaciones_id_reservacion_pk}</td>
            <td>${nombreCliente} <br><small style="color:#888">${r.usuarios_id_cedula_pk}</small></td>
            <td>${PinkUtils.formatearFechaES(r.fecha_reservacion)}</td>
            <td>${horaInicio} - ${horaFin}</td>
            <td>Dir ID: ${r.direcciones_id_direccion_pk}</td>
            <td><span class="estado-badge estado-${estadoClase}">${estadoNombre}</span></td>
            <td style="text-align: center;">
                <button class="btn-icon editar" onclick="abrirModalEditar(${r.reservaciones_id_reservacion_pk})" title="Editar">✏️</button>
                <button class="btn-icon eliminar" onclick="confirmarEliminar(${r.reservaciones_id_reservacion_pk})" title="Cancelar">🗑️</button>
            </td>
        `;
    });
}

// --- POPULAR SELECTORES (DATALIST) ---
function renderDatalistClientes(clientes) {
    const datalist = document.getElementById('lista-clientes');
    datalist.innerHTML = '';
    clientes.forEach(c => {
        const option = document.createElement('option');
        // El valor es lo que se muestra, ponemos Cédula - Nombre
        option.value = `${c.usuarios_id_cedula_pk} - ${c.nombre} ${c.primer_apellido}`;
        datalist.appendChild(option);
    });
}

function renderSelectDirecciones(direcciones) {
    const select = document.getElementById('select-direccion');
    // Limpiar (dejando el placeholder)
    select.innerHTML = '<option value="">Seleccione una ubicación...</option>';
    
    direcciones.forEach(d => {
        const option = document.createElement('option');
        option.value = d.direcciones_id_direccion_pk;
        option.textContent = `ID ${d.direcciones_id_direccion_pk} - ${d.descripcion}`;
        select.appendChild(option);
    });
}

// Detectar selección en el datalist para guardar solo el ID limpio
function detectarClienteSeleccionado() {
    const inputVal = document.getElementById('input-cliente').value;
    const hiddenInput = document.getElementById('cliente-id-real');
    
    // Extraemos la cédula (lo que está antes del guion)
    if (inputVal.includes('-')) {
        const cedula = inputVal.split('-')[0].trim();
        hiddenInput.value = cedula;
    } else {
        // Si el usuario borró o escribió algo inválido
        hiddenInput.value = ''; 
    }
}

// --- LÓGICA DEL MODAL ---
window.abrirModalCrear = function() {
    editandoId = null;
    document.getElementById('modal-titulo').textContent = "Nueva Reservación";
    document.getElementById('form-reserva').reset();
    document.getElementById('cliente-id-real').value = '';
    document.getElementById('group-estado').style.display = 'none'; // Ocultar estado al crear
    document.getElementById('modal-reserva').style.display = 'flex';
};

window.abrirModalEditar = function(id) {
    const reserva = reservasCache.find(r => r.reservaciones_id_reservacion_pk == id);
    if (!reserva) return;

    editandoId = id;
    document.getElementById('modal-titulo').textContent = `Editar Reserva #${id}`;
    
    // Pre-llenar datos
    // 1. Cliente
    const cliente = clientesCacheR.find(c => c.usuarios_id_cedula_pk === reserva.usuarios_id_cedula_pk);
    if (cliente) {
        document.getElementById('input-cliente').value = `${cliente.usuarios_id_cedula_pk} - ${cliente.nombre} ${cliente.primer_apellido}`;
        document.getElementById('cliente-id-real').value = cliente.usuarios_id_cedula_pk;
    }

    // 2. Fechas y Horas (Convertir de ISO a formato input)
    if (reserva.fecha_reservacion) {
        document.getElementById('fecha').value = reserva.fecha_reservacion.split('T')[0];
    }
    
    // Extraer HH:mm de los timestamps
    if (reserva.hora_inicio) {
        const dt = new Date(reserva.hora_inicio);
        const hh = String(dt.getHours()).padStart(2, '0');
        const mm = String(dt.getMinutes()).padStart(2, '0');
        document.getElementById('hora-inicio').value = `${hh}:${mm}`;
    }
    if (reserva.hora_fin) {
        const dt = new Date(reserva.hora_fin);
        const hh = String(dt.getHours()).padStart(2, '0');
        const mm = String(dt.getMinutes()).padStart(2, '0');
        document.getElementById('hora-fin').value = `${hh}:${mm}`;
    }

    // 3. Dirección y Estado
    document.getElementById('select-direccion').value = reserva.direcciones_id_direccion_pk;
    document.getElementById('group-estado').style.display = 'flex';
    document.getElementById('select-estado').value = reserva.estados_id_estado_pk;

    document.getElementById('modal-reserva').style.display = 'flex';
};

window.cerrarModal = function() {
    document.getElementById('modal-reserva').style.display = 'none';
};

async function manejarGuardado(e) {
    e.preventDefault();

    // Validar que se haya seleccionado un cliente válido
    const clienteId = document.getElementById('cliente-id-real').value;
    if (!clienteId) {
        alert('Por favor selecciona un cliente válido de la lista.');
        return;
    }

    const datos = {
        fecha: document.getElementById('fecha').value,
        horaInicio: document.getElementById('hora-inicio').value,
        horaFin: document.getElementById('hora-fin').value,
        clienteId: clienteId,
        direccionId: document.getElementById('select-direccion').value,
        estado: document.getElementById('select-estado').value // Solo útil en update
    };

    try {
        if (editandoId) {
            await ApiService.actualizarReservacion(editandoId, datos);
            alert('Reservación actualizada');
        } else {
            await ApiService.crearReservacion(datos);
            alert('Reservación creada con éxito');
        }
        cerrarModal();
        cargarDatosIniciales();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

window.confirmarEliminar = async function(id) {
    if (confirm(`¿Seguro de cancelar la reservación #${id}?`)) {
        try {
            await ApiService.eliminarReservacion(id);
            cargarDatosIniciales();
        } catch (error) {
            alert('Error al cancelar: ' + error.message);
        }
    }
};

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