document.addEventListener('DOMContentLoaded', async () => {
    await cargarClientesReales();
    document.getElementById('buscar-cliente').addEventListener('input', filtrarClientes);
    
    // Listener para guardar formulario
    document.getElementById('form-cliente').addEventListener('submit', manejarGuardado);
});

let clientesCache = [];
let editandoCedula = null; // null = Crear, valor = Editar

async function cargarClientesReales() {
    const tbody = document.getElementById('tabla-clientes');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';

    try {
        clientesCache = await ApiService.getClientes();
        document.getElementById('clientes-total').textContent = clientesCache.length;
        renderClientes(clientesCache);
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error cargando datos</td></tr>';
    }
}

function renderClientes(clientes) {
    const tbody = document.getElementById('tabla-clientes');
    tbody.innerHTML = '';

    if (clientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;">No hay clientes.</td></tr>`;
        return;
    }

    clientes.forEach(c => {
        const fila = tbody.insertRow();
        fila.innerHTML = `
            <td>${c.usuarios_id_cedula_pk}</td>
            <td>${c.nombre} ${c.primer_apellido} ${c.segundo_apellido || ''}</td>
            <td>${c.telefono}</td>
            <td>2025-01-01</td> <td style="text-align: center;">
                <button class="btn-icon editar" onclick="abrirModalEditar('${c.usuarios_id_cedula_pk}')" title="Editar">✏️</button>
                <button class="btn-icon eliminar" onclick="confirmarEliminar('${c.usuarios_id_cedula_pk}')" title="Eliminar">🗑️</button>
            </td>
        `;
    });
}

// --- LÓGICA DEL MODAL ---

window.abrirModalCrear = function() {
    editandoCedula = null;
    document.getElementById('modal-titulo').textContent = "Nuevo Cliente";
    document.getElementById('form-cliente').reset();
    document.getElementById('cedula').disabled = false; // Cédula editable al crear
    document.getElementById('grupo-password').style.display = 'block'; // Mostrar pass
    document.getElementById('modal-cliente').style.display = 'flex';
};

window.abrirModalEditar = function(cedula) {
    const cliente = clientesCache.find(c => c.usuarios_id_cedula_pk === cedula);
    if (!cliente) return;

    editandoCedula = cedula;
    document.getElementById('modal-titulo').textContent = "Editar Cliente";
    
    // Llenar campos
    document.getElementById('cedula').value = cliente.usuarios_id_cedula_pk;
    document.getElementById('cedula').disabled = true; // No se puede cambiar la PK
    document.getElementById('nombre').value = cliente.nombre;
    document.getElementById('apellido1').value = cliente.primer_apellido;
    document.getElementById('apellido2').value = cliente.segundo_apellido || '';
    document.getElementById('telefono').value = cliente.telefono;
    
    // Ocultar contraseña al editar (para no sobreescribirla accidentalmente)
    document.getElementById('grupo-password').style.display = 'none';
    
    document.getElementById('modal-cliente').style.display = 'flex';
};

window.cerrarModal = function() {
    document.getElementById('modal-cliente').style.display = 'none';
};

async function manejarGuardado(e) {
    e.preventDefault();
    
    const datos = {
        cedula: document.getElementById('cedula').value,
        nombre: document.getElementById('nombre').value,
        apellido1: document.getElementById('apellido1').value,
        apellido2: document.getElementById('apellido2').value,
        telefono: document.getElementById('telefono').value,
        password: document.getElementById('password').value
    };

    try {
        if (editandoCedula) {
            // MODO EDICIÓN
            await ApiService.actualizarCliente(editandoCedula, datos);
            alert('Cliente actualizado correctamente');
        } else {
            // MODO CREACIÓN
            await ApiService.crearCliente(datos);
            alert('Cliente creado exitosamente');
        }
        cerrarModal();
        cargarClientesReales(); // Recargar tabla
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

window.confirmarEliminar = async function(cedula) {
    if (confirm(`¿Estás seguro de eliminar al cliente ${cedula}? Esta acción desactivará al usuario.`)) {
        try {
            await ApiService.eliminarCliente(cedula);
            cargarClientesReales();
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }
};

// Función de filtrado (se mantiene igual)
function filtrarClientes(e) {
    const term = e.target.value.toLowerCase();
    const filtrados = clientesCache.filter(c =>
        String(c.usuarios_id_cedula_pk).includes(term) ||
        `${c.nombre} ${c.primer_apellido}`.toLowerCase().includes(term)
    );
    renderClientes(filtrados);
}

// Estilo extra para botones de acción
const style = document.createElement('style');
style.textContent = `
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 16px; padding: 5px; transition: transform 0.2s; }
    .btn-icon:hover { transform: scale(1.2); }
    .editar:hover { color: #FFB300; }
    .eliminar:hover { color: #F44336; }
`;
document.head.appendChild(style);