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
let usuariosCache = []; 
let direccionesCache = [];
let detallesCache = { servicios: [], asignaciones: [] }; 
let productosCache = []; 
let serviciosCache = []; 
let editandoId = null;

// Helper: Obtiene valor de propiedad sin importar Mayúsculas/Minúsculas
function getProp(obj, key) {
    if (!obj) return null;
    if (obj[key] !== undefined) return obj[key];
    if (obj[key.toUpperCase()] !== undefined) return obj[key.toUpperCase()];
    if (obj[key.toLowerCase()] !== undefined) return obj[key.toLowerCase()];
    return null;
}

async function cargarDatosIniciales() {
    const tbody = document.getElementById('tabla-reservaciones');
    if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando sistema completo...</td></tr>';

    try {
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
        usuariosCache = usuarios;
        direccionesCache = direcciones;
        detallesCache = { servicios: detalles, asignaciones: asignaciones };
        serviciosCache = servicios;
        productosCache = productos;

        if(document.getElementById('lista-clientes')) renderDatalistClientes(usuarios);
        if(document.getElementById('select-direccion')) renderSelectDirecciones(direcciones);
        if(tbody) renderReservaciones(reservasCache);

    } catch (error) {
        console.error("Error Carga Inicial:", error);
        if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center error">Error de conexión. Ver consola.</td></tr>';
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

    // Ordenar por fecha (ISO String seguro)
    reservas.sort((a, b) => {
        const da = new Date(getProp(a, 'fecha_reservacion') || 0);
        const db = new Date(getProp(b, 'fecha_reservacion') || 0);
        return db - da; 
    });

    reservas.forEach(r => {
        // Extracción segura de datos
        const idReserva = getProp(r, 'reservaciones_id_reservacion_pk');
        const idUsuario = getProp(r, 'usuarios_id_cedula_pk'); 
        const idDireccion = getProp(r, 'direcciones_id_direccion_pk');
        const idEstado = getProp(r, 'estados_id_estado_pk');
        const fechaRaw = getProp(r, 'fecha_reservacion');
        const horaRaw = getProp(r, 'hora_inicio');

        // Buscar Relaciones
        const usuario = usuariosCache.find(u => String(getProp(u, 'usuarios_id_cedula_pk')).trim() === String(idUsuario).trim());
        
        const nombreCliente = usuario 
            ? `<span style="color:#fff; font-weight:500;">${getProp(usuario, 'nombre')} ${getProp(usuario, 'primer_apellido')}</span> <br><small style="color:#888;">${idUsuario}</small>` 
            : `<span style="color:#ff5252;">ID: ${idUsuario || 'N/A'}</span>`;
        
        const estadoInfo = obtenerInfoEstado(idEstado);
        
        // Formato Fecha
        let fechaStr = '---';
        let horaStr = '-- : --';
        
        if(fechaRaw) {
            // Extraer solo YYYY-MM-DD si es ISO largo
            const fechaObj = new Date(fechaRaw);
            fechaStr = fechaObj.toLocaleDateString('es-CR');
        }
        if(horaRaw) {
            const horaObj = new Date(horaRaw);
            horaStr = horaObj.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true});
        }

        const dir = direccionesCache.find(d => getProp(d, 'direcciones_id_direccion_pk') == idDireccion);
        const ubicacion = dir ? getProp(dir, 'descripcion') : 'Ubicación ID ' + (idDireccion || '?');

        const fila = tbody.insertRow();
        fila.innerHTML = `
            <td><strong>#${idReserva}</strong></td>
            <td>${nombreCliente}</td>
            <td>${fechaStr}</td>
            <td>${horaStr}</td>
            <td><div style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${ubicacion}">${ubicacion}</div></td>
            <td><span class="badge badge-${estadoInfo.clase}">${estadoInfo.nombre}</span></td>
            <td style="text-align: center; min-width: 120px;">
                <button class="btn-icon" onclick="verDetalles(${idReserva})" title="Ver Productos" style="color:#4FC3F7; margin-right:5px;">👁️</button>
                <button class="btn-icon editar" onclick="abrirModalEditar(${idReserva})" title="Editar">✏️</button>
                <button class="btn-icon eliminar" onclick="confirmarEliminar(${idReserva})" title="Cancelar">🚫</button>
            </td>
        `;
    });
}

window.verDetalles = function(idReserva) {
    const contenedor = document.getElementById('contenido-detalles'); 
    const modal = document.getElementById('modal-detalles'); 
    
    if(!contenedor || !modal) return;
    contenedor.innerHTML = '<p class="text-center">Cargando items...</p>';

    const serviciosAsociados = detallesCache.servicios.filter(d => getProp(d, 'reservaciones_id_reservacion_pk') == idReserva);
    const productosAsociados = detallesCache.asignaciones.filter(a => getProp(a, 'reservaciones_id_reservacion_pk') == idReserva);

    let html = '<div style="display:flex; flex-direction:column; gap:10px;">';

    if (serviciosAsociados.length === 0 && productosAsociados.length === 0) {
        html += '<div style="padding:20px; text-align:center; color:#aaa;">No hay items registrados.</div>';
    } else {
        if(serviciosAsociados.length > 0) {
            html += '<h4 style="color:#ff4081; margin-bottom:5px; border-bottom:1px solid #444; padding-bottom:5px;">Servicios</h4>';
            serviciosAsociados.forEach(item => {
                const sid = getProp(item, 'servicios_id_servicio_pk');
                const info = serviciosCache.find(s => getProp(s, 'servicios_id_servicio_pk') == sid);
                const nombre = info ? getProp(info, 'nombre') : 'ID ' + sid;
                const precio = getProp(item, 'precio_unitario');
                const precioStr = precio ? `₡${Number(precio).toLocaleString()}` : '';
                
                html += `<div style="display:flex; justify-content:space-between; background:#2d2d2d; padding:8px; border-radius:5px;"><span>📸 ${nombre}</span><b>${precioStr}</b></div>`;
            });
        }
        if(productosAsociados.length > 0) {
            html += '<h4 style="color:#4caf50; margin:15px 0 5px 0; border-bottom:1px solid #444; padding-bottom:5px;">Productos</h4>';
            productosAsociados.forEach(item => {
                const pid = getProp(item, 'producto_id_producto_pk');
                const info = productosCache.find(p => getProp(p, 'producto_id_producto_pk') == pid);
                const nombre = info ? getProp(info, 'nombre') : 'ID ' + pid;
                html += `<div style="background:#2d2d2d; padding:8px; border-radius:5px;"><span>📦 ${nombre}</span></div>`;
            });
        }
    }
    html += '</div>';
    contenedor.innerHTML = html;
    modal.style.display = 'flex';
};

function obtenerInfoEstado(id) {
    switch(Number(id)) {
        case 3: return { nombre: 'Pendiente', clase: 'warning' };
        case 4: return { nombre: 'Confirmada', clase: 'success' };
        case 5: return { nombre: 'Cancelada', clase: 'danger' };
        default: return { nombre: 'Desconocido', clase: 'secondary' };
    }
}

function renderDatalistClientes(usuarios) {
    const datalist = document.getElementById('lista-clientes');
    if(!datalist) return;
    datalist.innerHTML = '';
    usuarios.forEach(u => {
        const id = getProp(u, 'usuarios_id_cedula_pk');
        const nombre = getProp(u, 'nombre');
        const ape = getProp(u, 'primer_apellido');
        if(id) {
            const option = document.createElement('option');
            option.value = `${id} - ${nombre} ${ape}`;
            datalist.appendChild(option);
        }
    });
}

function renderSelectDirecciones(direcciones) {
    const select = document.getElementById('select-direccion');
    if(!select) return;
    select.innerHTML = '<option value="">Seleccione ubicación...</option>';
    direcciones.forEach(d => {
        const id = getProp(d, 'direcciones_id_direccion_pk');
        const desc = getProp(d, 'descripcion');
        if(id) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = desc;
            select.appendChild(option);
        }
    });
}

function detectarClienteSeleccionado() {
    const input = document.getElementById('input-cliente');
    const hidden = document.getElementById('cliente-id-real');
    if(input.value.includes('-')) hidden.value = input.value.split('-')[0].trim();
    else hidden.value = '';
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
    const reserva = reservasCache.find(r => getProp(r, 'reservaciones_id_reservacion_pk') == id);
    if(!reserva) return;
    editandoId = id;
    document.getElementById('reserva-id').value = id;
    
    const uid = getProp(reserva, 'usuarios_id_cedula_pk');
    const cliente = usuariosCache.find(c => getProp(c, 'usuarios_id_cedula_pk') == uid);
    
    if(cliente) {
        const idStr = getProp(cliente, 'usuarios_id_cedula_pk');
        const nomStr = getProp(cliente, 'nombre');
        document.getElementById('input-cliente').value = `${idStr} - ${nomStr}`;
        document.getElementById('cliente-id-real').value = idStr;
    }

    const fecha = getProp(reserva, 'fecha_reservacion');
    if(fecha) document.getElementById('fecha').value = new Date(fecha).toISOString().split('T')[0];
    
    const horaInicioRaw = getProp(reserva, 'hora_inicio');
    const horaFinRaw = getProp(reserva, 'hora_fin');
    
    if(horaInicioRaw) document.getElementById('hora-inicio').value = new Date(horaInicioRaw).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'});
    if(horaFinRaw) document.getElementById('hora-fin').value = new Date(horaFinRaw).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'});

    document.getElementById('select-direccion').value = getProp(reserva, 'direcciones_id_direccion_pk');
    document.getElementById('group-estado').style.display = 'block';
    document.getElementById('select-estado').value = getProp(reserva, 'estados_id_estado_pk');
    
    document.getElementById('modal-reserva').style.display = 'flex';
};

window.cerrarModal = function() {
    document.getElementById('modal-reserva').style.display = 'none';
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
            await ApiService.crearReservacion(datos);
            alert("Reserva creada");
        }
        cerrarModal();
        cargarDatosIniciales();
    } catch(e) { alert("Error: " + e.message); }
}

window.confirmarEliminar = async function(id) {
    if(confirm("¿Cancelar reserva?")) {
        try {
            await ApiService.eliminarReservacion(id);
            cargarDatosIniciales();
        } catch(e) { alert("Error: " + e.message); }
    }
};

function filtrarReservaciones(e) {
    const val = e.target.value;
    const filtradas = val ? reservasCache.filter(r => getProp(r, 'estados_id_estado_pk') == val) : reservasCache;
    renderReservaciones(filtradas);
}