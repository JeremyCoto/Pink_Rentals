document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosIniciales();
    
    document.getElementById('form-usuario').addEventListener('submit', manejarGuardado);
    document.getElementById('buscar-usuario').addEventListener('input', filtrarUsuarios);
});

let usuariosCache = [];
let rolesCache = [];
let editandoCedula = null;

async function cargarDatosIniciales() {
    const tbody = document.getElementById('tabla-usuarios');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';

    try {
        const [usuarios, roles] = await Promise.all([
            ApiService.getUsuarios(),
            ApiService.getRoles()
        ]);
        
        usuariosCache = usuarios;
        rolesCache = roles;
        
        renderSelectRoles(roles);
        renderUsuarios(usuarios);
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center error">Error cargando datos.</td></tr>';
    }
}

function renderUsuarios(lista) {
    const tbody = document.getElementById('tabla-usuarios');
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron usuarios.</td></tr>';
        return;
    }

    lista.forEach(u => {
        const rol = rolesCache.find(r => r.roles_id_rol_pk == u.roles_id_rol_pk);
        const nombreRol = rol ? rol.nombre_rol : 'Desconocido';
        
        const estadoBadge = u.estados_id_estado_pk == 1 
            ? '<span class="estado-badge estado-completado">Activo</span>' 
            : '<span class="estado-badge estado-cancelado">Inactivo</span>';

        // --- LÓGICA DE AUDITORÍA ---
        // Si no hay dato, mostramos 'Sistema' o '-'
        const creadoPor = u.creado_por || 'Sistema'; 
        
        // Formatear la fecha ISO que viene de Oracle a algo legible
        let fechaRegistro = '-';
        if (u.fecha_creacion) {
            const fechaObj = new Date(u.fecha_creacion);
            fechaRegistro = fechaObj.toLocaleDateString('es-CR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
        }
        // ---------------------------

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.usuarios_id_cedula_pk}</td>
            <td>${u.nombre} ${u.primer_apellido} ${u.segundo_apellido || ''}</td>
            <td>${nombreRol}</td>
            <td>${estadoBadge}</td>
            
            <td style="color:#aaa; font-size:0.9em;">${creadoPor}</td>
            <td style="color:#aaa; font-size:0.9em;">${fechaRegistro}</td>
            
            <td class="text-center">
                <button class="btn-icon editar" onclick="abrirModalEditar('${u.usuarios_id_cedula_pk}')">✏️</button>
                <button class="btn-icon eliminar" onclick="confirmarEliminar('${u.usuarios_id_cedula_pk}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderSelectRoles(roles) {
    const select = document.getElementById('select-rol');
    select.innerHTML = '<option value="">Seleccione Rol...</option>';
    roles.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.roles_id_rol_pk;
        opt.textContent = r.nombre_rol;
        select.appendChild(opt);
    });
}

// --- MODALES ---
window.abrirModalCrear = function() {
    editandoCedula = null;
    document.getElementById('modal-titulo').textContent = "Nuevo Usuario";
    document.getElementById('form-usuario').reset();
    document.getElementById('cedula').disabled = false;
    document.getElementById('group-estado').style.display = 'none';
    document.getElementById('modal-usuario').style.display = 'flex';
};

window.abrirModalEditar = function(cedula) {
    const u = usuariosCache.find(x => x.usuarios_id_cedula_pk == cedula);
    if (!u) return;

    editandoCedula = cedula;
    document.getElementById('modal-titulo').textContent = "Editar Usuario";
    
    document.getElementById('cedula').value = u.usuarios_id_cedula_pk;
    document.getElementById('cedula').disabled = true; // No se edita PK
    
    document.getElementById('nombre').value = u.nombre;
    document.getElementById('apellido1').value = u.primer_apellido;
    document.getElementById('apellido2').value = u.segundo_apellido || '';
    document.getElementById('select-rol').value = u.roles_id_rol_pk;
    document.getElementById('password').value = ''; // Limpiar pass
    
    document.getElementById('group-estado').style.display = 'block';
    document.getElementById('select-estado').value = u.estados_id_estado_pk;

    document.getElementById('modal-usuario').style.display = 'flex';
};

window.cerrarModal = function() {
    document.getElementById('modal-usuario').style.display = 'none';
};

// --- CRUD ---
async function manejarGuardado(e) {
    e.preventDefault();
    
    const datos = {
        cedula: document.getElementById('cedula').value,
        nombre: document.getElementById('nombre').value,
        apellido1: document.getElementById('apellido1').value,
        apellido2: document.getElementById('apellido2').value,
        rol: document.getElementById('select-rol').value,
        password: document.getElementById('password').value,
        estado: document.getElementById('select-estado').value
    };

    try {
        if (editandoCedula) {
            await ApiService.actualizarUsuario(editandoCedula, datos);
            alert("Usuario actualizado correctamente.");
        } else {
            await ApiService.crearUsuario(datos);
            alert("Usuario creado correctamente.");
        }
        cerrarModal();
        cargarDatosIniciales();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

window.confirmarEliminar = async function(cedula) {
    if (confirm(`¿Desactivar usuario ${cedula}?`)) {
        try {
            await ApiService.eliminarUsuario(cedula);
            cargarDatosIniciales();
        } catch (err) {
            alert("Error: " + err.message);
        }
    }
};

function filtrarUsuarios(e) {
    const term = e.target.value.toLowerCase();
    const filtrados = usuariosCache.filter(u => 
        String(u.usuarios_id_cedula_pk).includes(term) ||
        `${u.nombre} ${u.primer_apellido}`.toLowerCase().includes(term)
    );
    renderUsuarios(filtrados);
}