document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosIniciales();
    document.getElementById('form-servicio').addEventListener('submit', manejarGuardado);
});

let serviciosCache = [];
let categoriasCache = []; 
let editandoId = null;

async function cargarDatosIniciales() {
    const contenedor = document.getElementById('grid-servicios');
    contenedor.innerHTML = '<p class="text-center">Cargando catálogo...</p>';

    try {
        const [servicios, categorias] = await Promise.all([
            ApiService.getServicios(),
            ApiService.getCategoriasServicio()
        ]);

        serviciosCache = servicios;
        categoriasCache = categorias;

        renderSelectCategorias(categorias);
        
        // Filtrar solo activos (si no lo hace el SP)
        const activos = servicios.filter(s => s.estados_id_estado_pk === 1);
        renderServicios(activos);

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<p class="text-center error">Error de conexión</p>';
    }
}

function renderServicios(servicios) {
    const contenedor = document.getElementById('grid-servicios');
    contenedor.innerHTML = '';

    if (servicios.length === 0) {
        contenedor.innerHTML = '<p class="text-center">No hay servicios registrados.</p>';
        return;
    }

    servicios.forEach(s => {
        // Buscar nombre categoría
        const cat = categoriasCache.find(c => c.categoria_servicio_id_categoria_pk === s.categoria_servicio_id_categoria_pk);
        const nombreCategoria = cat ? cat.nombre : 'General';
        
        // Icono según categoría (lógica visual simple)
        const icono = ICONOS_SERVICIOS[nombreCategoria] || '✨';

        const card = document.createElement('div');
        card.className = 'servicio-card';
        
        card.innerHTML = `
            <div class="servicio-actions">
                <button class="btn-mini" onclick="abrirModalEditar(${s.servicios_id_servicio_pk})" title="Editar">✏️</button>
                <button class="btn-mini delete" onclick="confirmarEliminar(${s.servicios_id_servicio_pk})" title="Eliminar">🗑️</button>
            </div>
            <div class="servicio-icon">${icono}</div>
            <h3>${s.nombre}</h3>
            <p>${s.descripcion || 'Sin descripción'}</p>
            <p style="margin-top:10px; font-weight:600; font-size:1.1em;">₡ ${Number(s.precio).toLocaleString('es-CR')}</p>
            <div class="servicio-footer">
                <span class="info-badge">${nombreCategoria}</span>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

function renderSelectCategorias(categorias) {
    const select = document.getElementById('select-categoria');
    select.innerHTML = '<option value="">Seleccione...</option>';
    
    categorias.forEach(c => {
        if (c.estados_id_estado_fk === 1) {
            const option = document.createElement('option');
            option.value = c.categoria_servicio_id_categoria_pk;
            option.textContent = c.nombre;
            select.appendChild(option);
        }
    });
}

// --- LÓGICA DEL MODAL ---
window.abrirModalCrear = function() {
    editandoId = null;
    document.getElementById('modal-titulo').textContent = "Nuevo Servicio";
    document.getElementById('form-servicio').reset();
    document.getElementById('group-estado').style.display = 'none';
    document.getElementById('modal-servicio').style.display = 'flex';
};

window.abrirModalEditar = function(id) {
    const serv = serviciosCache.find(s => s.servicios_id_servicio_pk == id);
    if (!serv) return;

    editandoId = id;
    document.getElementById('modal-titulo').textContent = `Editar Servicio #${id}`;
    
    document.getElementById('nombre').value = serv.nombre;
    document.getElementById('descripcion').value = serv.descripcion || '';
    document.getElementById('select-categoria').value = serv.categoria_servicio_id_categoria_pk;
    document.getElementById('precio').value = serv.precio;
    
    document.getElementById('group-estado').style.display = 'flex';
    document.getElementById('select-estado').value = serv.estados_id_estado_pk;

    document.getElementById('modal-servicio').style.display = 'flex';
};

window.cerrarModal = function() {
    document.getElementById('modal-servicio').style.display = 'none';
};

async function manejarGuardado(e) {
    e.preventDefault();

    const datos = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        categoriaId: document.getElementById('select-categoria').value,
        precio: document.getElementById('precio').value,
        estado: document.getElementById('select-estado').value
    };

    try {
        if (editandoId) {
            await ApiService.actualizarServicio(editandoId, datos);
            alert('Servicio actualizado');
        } else {
            await ApiService.crearServicio(datos);
            alert('Servicio creado exitosamente');
        }
        cerrarModal();
        cargarDatosIniciales();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

window.confirmarEliminar = async function(id) {
    if (confirm(`¿Seguro de eliminar el servicio #${id}?`)) {
        try {
            await ApiService.eliminarServicio(id);
            cargarDatosIniciales();
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }
};