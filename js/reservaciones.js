document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosIniciales();
    
    const filtroEstado = document.getElementById('filtro-estado');
    if(filtroEstado) filtroEstado.addEventListener('change', filtrarReservaciones);
    
    const formReserva = document.getElementById('form-reserva');
    if(formReserva) formReserva.addEventListener('submit', manejarGuardado);
    
    const inputCliente = document.getElementById('input-cliente');
    if(inputCliente) inputCliente.addEventListener('change', detectarClienteSeleccionado);
});

// Cachés Globales
let reservasCache = [];
let usuariosCache = []; // CAMBIO: Usaremos Usuarios, no Clientes para el nombre
let direccionesCache = [];
let detallesCache = { servicios: [], asignaciones: [] }; 
let productosCache = []; 
let serviciosCache = []; 
let editandoId = null;

async function cargarDatosIniciales() {
    const tbody = document.getElementById('tabla-reservaciones');
    if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando sistema completo...</td></tr>';

    try {
        // CAMBIO: Pedimos getUsuarios() en vez de getClientes() para asegurar tener TODOS los nombres
        const [reservas, usuarios, direcciones, detalles, asignaciones, servicios, productos] = await Promise.all([
            ApiService.getReservaciones(),
            ApiService.getUsuarios(), 
            ApiService.getDirecciones(),
            ApiService.getDetallesReserva(), 
            ApiService.getAsignaciones(),    
            ApiService.getServicios(),
            ApiService.getProductos()
        ]);

        reservasCache = reservas;
        usuariosCache = usuarios; // Guardamos en cache global
        direccionesCache = direcciones;
        detallesCache = { servicios: detalles, asignaciones: asignaciones };
        serviciosCache = servicios;
        productosCache = productos;

        // Renderizar listas y tablas
        if(document.getElementById('lista-clientes')) renderDatalistClientes(usuarios); // Usamos usuarios para el autocomplete
        if(document.getElementById('select-direccion')) renderSelectDirecciones(direcciones);
        if(tbody) renderReservaciones(reservasCache);

    } catch (error) {
        console.error("Error Carga Inicial:", error);
        if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center error">Error de datos. Ver consola.</td></tr>';
    }
}

function renderReservaciones(reservas) {
    const tbody = document.getElementById('tabla-reservaciones');
    if(!tbody) return;
    tbody.innerHTML = '';

    if (!reservas || reservas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:40px;">Sin reservaciones registradas.</td></tr>`;
        return;
    }

    reservas.sort((a, b) => new Date(b.fecha_reservacion) - new Date(a.fecha_reservacion));

    reservas.forEach(r => {
        // CORRECCIÓN PROFESIONAL: Buscamos en UsuariosCache usando conversión estricta a String
        const usuario = usuariosCache.find(u => String(u.usuarios_id_cedula_pk).trim() === String(r.usuarios_id_cedula_pk).trim());
        
        // Si no encuentra usuario, muestra el ID crudo para depuración
        const nombreCliente = usuario 
            ? `<span style="color:#fff; font-weight:500;">${usuario.nombre} ${usuario.primer_apellido}</span> <br><small style="color:#888;">${usuario.usuarios_id_cedula_pk}</small>` 
            : `<span style="color:#ff5252;">Usuario Desconocido</span> <br><small>${r.usuarios_id_cedula_pk}</small>`;
        
        const estadoInfo = obtenerInfoEstado(r.estados_id_estado_pk);
        
        // CORRECCIÓN DE FECHAS: Evitar new Date() directo con strings de Oracle que pueden ser ambiguos
        let fechaStr = 'Fecha Inválida';
        let horaStr = '-- : --';
        
        if(r.fecha_reservacion) {
            // Tomamos solo la parte YYYY-MM-DD si viene en ISO
            fechaStr = new Date(r.fecha_reservacion).toLocaleDateString('es-CR');
        }

        // Formateo manual de hora para evitar errores de zona horaria
        if(r.hora_inicio) {
            const fechaHora = new Date(r.hora_inicio);
            horaStr = fechaHora.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true});
        }

        const dir = direccionesCache.find(d => d.direcciones_id_direccion_pk == r.direcciones_id_direccion_pk);
        const ubicacion = dir ? dir.descripcion : 'Ubicación ID ' + r.direcciones_id_direccion_pk;

        const fila = tbody.insertRow();
        fila.innerHTML = `
            <td><strong>#${r.reservaciones_id_reservacion_pk}</strong></td>
            <td>${nombreCliente}</td>
            <td>${fechaStr}</td>
            <td>${horaStr}</td>
            <td><div style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${ubicacion}">${ubicacion}</div></td>
            <td><span class="badge badge-${estadoInfo.clase}">${estadoInfo.nombre}</span></td>
            <td style="text-align: center; min-width: 120px;">
                <button class="btn-icon" onclick="verDetalles(${r.reservaciones_id_reservacion_pk})" title="Ver Productos" style="color:#4FC3F7; margin-right:5px;">👁️</button>
                <button class="btn-icon editar" onclick="abrirModalEditar(${r.reservaciones_id_reservacion_pk})" title="Editar">✏️</button>
                <button class="btn-icon eliminar" onclick="confirmarEliminar(${r.reservaciones_id_reservacion_pk})" title="Cancelar">🚫</button>
            </td>
        `;
    });
}

// FUNCIONALIDAD "OJO" 👁️ (Ver qué compraron)
window.verDetalles = function(idReserva) {
    const contenedor = document.getElementById('contenido-detalles'); // Asegúrate de tener este ID en el HTML
    const modal = document.getElementById('modal-detalles'); // Y este modal
    
    if(!contenedor || !modal) {
        console.error("Falta el modal de detalles en el HTML");
        return;
    }
    
    contenedor.innerHTML = '<p class="text-center">Cargando items...</p>';

    // 1. Filtrar Servicios (Tabla Detalle Reserva)
    const serviciosAsociados = detallesCache.servicios.filter(d => d.reservaciones_id_reservacion_pk == idReserva);
    
    // 2. Filtrar Productos (Tabla Asignaciones)
    const productosAsociados = detallesCache.asignaciones.filter(a => a.reservaciones_id_reservacion_pk == idReserva);

    let html = '<div style="display:flex; flex-direction:column; gap:10px;">';

    if (serviciosAsociados.length === 0 && productosAsociados.length === 0) {
        html += '<div style="padding:20px; text-align:center; color:#aaa;">No hay servicios ni productos registrados en esta reserva.</div>';
    } else {
        // Listar Servicios
        if(serviciosAsociados.length > 0) {
            html += '<h4 style="color:#ff4081; margin-bottom:5px; border-bottom:1px solid #444; padding-bottom:5px;">Servicios Contratados</h4>';
            serviciosAsociados.forEach(item => {
                const info = serviciosCache.find(s => s.servicios_id_servicio_pk == item.servicios_id_servicio_pk);
                const nombre = info ? info.nombre : 'Servicio ID ' + item.servicios_id_servicio_pk;
                const precio = item.precio_unitario ? `₡${Number(item.precio_unitario).toLocaleString()}` : '';
                
                html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#2d2d2d; padding:8px; border-radius:5px;">
                    <span>📸 ${nombre}</span>
                    <span style="font-weight:bold;">${precio}</span>
                </div>`;
            });
        }

        // Listar Productos
        if(productosAsociados.length > 0) {
            html += '<h4 style="color:#4caf50; margin:15px 0 5px 0; border-bottom:1px solid #444; padding-bottom:5px;">Productos Extra</h4>';
            productosAsociados.forEach(item => {
                const info = productosCache.find(p => p.producto_id_producto_pk == item.producto_id_producto_pk);
                const nombre = info ? info.nombre : 'Producto ID ' + item.producto_id_producto_pk;
                
                html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#2d2d2d; padding:8px; border-radius:5px;">
                    <span>📦 ${nombre}</span>
                    <small style="color:#aaa;">${item.notas || ''}</small>
                </div>`;
            });
        }
    }
    html += '</div>';
    
    contenedor.innerHTML = html;
    modal.style.display = 'flex';
};

// Helpers de Estado
function obtenerInfoEstado(id) {
    switch(Number(id)) {
        case 3: return { nombre: 'Pendiente', clase: 'warning' };
        case 4: return { nombre: 'Confirmada', clase: 'success' };
        case 5: return { nombre: 'Cancelada', clase: 'danger' };
        default: return { nombre: 'Desconocido', clase: 'secondary' };
    }
}

// --- RESTO DE LA LÓGICA DE EDICIÓN/CREACIÓN ---
function renderDatalistClientes(usuarios) {
    const datalist = document.getElementById('lista-clientes');
    if(!datalist) return;
    datalist.innerHTML = '';
    usuarios.forEach(u => {
        const option = document.createElement('option');
        option.value = `${u.usuarios_id_cedula_pk} - ${u.nombre} ${u.primer_apellido}`;
        datalist.appendChild(option);
    });
}

function renderSelectDirecciones(direcciones) {
    const select = document.getElementById('select-direccion');
    if(!select) return;
    select.innerHTML = '<option value="">Seleccione ubicación...</option>';
    direcciones.forEach(d => {
        const option = document.createElement('option');
        option.value = d.direcciones_id_direccion_pk;
        option.textContent = `${d.descripcion}`;
        select.appendChild(option);
    });
}

function detectarClienteSeleccionado() {
    const input = document.getElementById('input-cliente');
    const hidden = document.getElementById('cliente-id-real');
    if(input.value.includes('-')) {
        hidden.value = input.value.split('-')[0].trim();
    } else {
        hidden.value = '';
    }
}

window.abrirModalCrear = function() {
    editandoId = null;
    document.getElementById('modal-titulo').textContent = "Nueva Reservación";
    document.getElementById('form-reserva').reset();
    document.getElementById('cliente-id-real').value = '';
    document.getElementById('group-estado').style.display = 'none';
    document.getElementById('modal-reserva').style.display = 'flex';
};

window.abrirModalEditar = function(id) {
    const reserva = reservasCache.find(r => r.reservaciones_id_reservacion_pk == id);
    if(!reserva) return;
    editandoId = id;
    document.getElementById('reserva-id').value = id;
    
    // Cargar cliente
    const cliente = clientesCacheR.find(c => c.usuarios_id_cedula_pk == reserva.usuarios_id_cedula_pk);
    if(cliente) {
        document.getElementById('input-cliente').value = `${cliente.usuarios_id_cedula_pk} - ${cliente.nombre}`;
        document.getElementById('cliente-id-real').value = cliente.usuarios_id_cedula_pk;
    }

    // Cargar fechas
    if(reserva.fecha_reservacion) document.getElementById('fecha').value = reserva.fecha_reservacion.split('T')[0];
    
    // Cargar horas (formato HH:mm)
    const fmtHora = (iso) => iso ? new Date(iso).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}) : '';
    document.getElementById('hora-inicio').value = fmtHora(reserva.hora_inicio);
    document.getElementById('hora-fin').value = fmtHora(reserva.hora_fin);

    document.getElementById('select-direccion').value = reserva.direcciones_id_direccion_pk;
    document.getElementById('group-estado').style.display = 'block';
    document.getElementById('select-estado').value = reserva.estados_id_estado_pk;
    
    document.getElementById('modal-reserva').style.display = 'flex';
};

window.cerrarModal = function() {
    document.getElementById('modal-reserva').style.display = 'none';
    // Cerrar también el de detalles si está abierto
    const detalles = document.getElementById('modal-detalles');
    if(detalles) detalles.style.display = 'none';
};

async function manejarGuardado(e) {
    e.preventDefault();
    const clienteId = document.getElementById('cliente-id-real').value;
    
    if(!clienteId) { alert("Selecciona un cliente válido"); return; }

    const datos = {
        clienteId: clienteId,
        fecha: document.getElementById('fecha').value,
        horaInicio: document.getElementById('hora-inicio').value,
        horaFin: document.getElementById('hora-fin').value,
        direccionId: document.getElementById('select-direccion').value,
        estado: document.getElementById('select-estado').value
    };

    try {
        if(editandoId) {
            await ApiService.actualizarReservacion(editandoId, datos);
            alert("Reserva actualizada");
        } else {
            await ApiService.crearReservacion(datos); // Nota: Esto solo crea cabecera, para full items usar Checkout
            alert("Reserva administrativa creada");
        }
        cerrarModal();
        cargarDatosIniciales();
    } catch(e) { alert("Error: " + e.message); }
}

window.confirmarEliminar = async function(id) {
    if(confirm("¿Cancelar esta reserva?")) {
        try {
            await ApiService.eliminarReservacion(id);
            cargarDatosIniciales();
        } catch(e) { alert("Error: " + e.message); }
    }
};

function filtrarReservaciones(e) {
    const val = e.target.value;
    const filtradas = val ? reservasCache.filter(r => r.estados_id_estado_pk == val) : reservasCache;
    renderReservaciones(filtradas);
}