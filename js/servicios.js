document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosIniciales();
    const form = document.getElementById('form-servicio');
    if(form) form.addEventListener('submit', manejarGuardado);
});

let serviciosCache = [];
let categoriasCache = []; 
let editandoId = null;

async function cargarDatosIniciales() {
    const contenedor = document.getElementById('grid-servicios');
    if(!contenedor) return;
    contenedor.innerHTML = '<p class="text-center">Cargando...</p>';

    try {
        const [servicios, categorias] = await Promise.all([
            ApiService.getServicios(),
            ApiService.getCategoriasServicio()
        ]);
        serviciosCache = servicios;
        categoriasCache = categorias;
        renderSelectCategorias(categorias);
        renderServicios(servicios.filter(s => s.estados_id_estado_pk === 1));
    } catch (e) { console.error(e); }
}

function renderServicios(servicios) {
    const contenedor = document.getElementById('grid-servicios');
    contenedor.innerHTML = '';

    if (servicios.length === 0) {
        contenedor.innerHTML = '<p class="text-center">No hay servicios.</p>';
        return;
    }

    const userStr = localStorage.getItem('pinkUser');
    const user = userStr ? JSON.parse(userStr) : null;
    const rol = user ? user.rol : 0;
    
    servicios.forEach(s => {
        const cat = categoriasCache.find(c => c.categoria_servicio_id_categoria_pk === s.categoria_servicio_id_categoria_pk);
        const card = document.createElement('div');
        card.className = 'servicio-card';
        
        let adminBtns = '';
        let clientBtn = '';

        // Botones ADMIN (Arriba a la derecha)
        if(rol == 10 || rol == 20) {
            adminBtns = `
            <div class="servicio-actions">
                <button class="btn-mini" onclick="abrirModalEditar(${s.servicios_id_servicio_pk})">✏️</button>
                <button class="btn-mini delete" onclick="confirmarEliminar(${s.servicios_id_servicio_pk})">🗑️</button>
            </div>`;
        } 
        // Botón CLIENTE (Siempre abajo)
        else if (rol == 30) {
            const itemData = JSON.stringify({
                id: s.servicios_id_servicio_pk, nombre: s.nombre, precio: Number(s.precio), tipo: 'servicio'
            }).replace(/"/g, '&quot;');
            
            // Usamos un div contenedor con estilo inline (o clase css) para empujar al fondo
            // Style: margin-top: auto asegura que se pegue al fondo en un flex column
            clientBtn = `
            <div style="margin-top: auto; width: 100%; padding-top: 15px;">
                <button class="btn-reserva" onclick="CartSystem.add(${itemData})">📅 Agregar a Reserva</button>
            </div>`;
        }

        card.innerHTML = `
            ${adminBtns}
            <div class="servicio-icon">✨</div>
            <h3>${s.nombre}</h3>
            <p>${s.descripcion || 'Sin descripción'}</p>
            <div style="margin: 10px 0; font-weight:700; color:var(--pink-primary);">
                ₡ ${Number(s.precio).toLocaleString('es-CR')}
            </div>
            <span class="info-badge" style="align-self: flex-start; margin-bottom:15px;">${cat ? cat.nombre : 'General'}</span>
            ${clientBtn}
        `;
        contenedor.appendChild(card);
    });
}

function renderSelectCategorias(categorias) {
    const select = document.getElementById('select-categoria');
    if(!select) return;
    select.innerHTML = '<option value="">Seleccione...</option>';
    categorias.forEach(c => {
        if(c.estados_id_estado_fk === 1) {
            const op = document.createElement('option');
            op.value = c.categoria_servicio_id_categoria_pk; op.textContent = c.nombre;
            select.appendChild(op);
        }
    });
}

// Funciones Modal Admin
window.abrirModalCrear = function() {
    editandoId = null;
    document.getElementById('modal-titulo').textContent = "Nuevo Servicio";
    document.getElementById('form-servicio').reset();
    document.getElementById('group-estado').style.display = 'none';
    document.getElementById('modal-servicio').style.display = 'flex';
};
window.abrirModalEditar = function(id) {
    const s = serviciosCache.find(x => x.servicios_id_servicio_pk == id);
    if(!s) return;
    editandoId = id;
    document.getElementById('modal-titulo').textContent = "Editar Servicio";
    document.getElementById('nombre').value = s.nombre;
    document.getElementById('descripcion').value = s.descripcion;
    document.getElementById('select-categoria').value = s.categoria_servicio_id_categoria_pk;
    document.getElementById('precio').value = s.precio;
    document.getElementById('group-estado').style.display = 'flex';
    document.getElementById('select-estado').value = s.estados_id_estado_pk;
    document.getElementById('modal-servicio').style.display = 'flex';
};
window.cerrarModal = function() { document.getElementById('modal-servicio').style.display = 'none'; };

// Guardar y Eliminar
async function manejarGuardado(e) {
    e.preventDefault();
    const d = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        categoriaId: document.getElementById('select-categoria').value,
        precio: document.getElementById('precio').value,
        estado: document.getElementById('select-estado').value
    };
    try {
        if(editandoId) await ApiService.actualizarServicio(editandoId, d);
        else await ApiService.crearServicio(d);
        cerrarModal(); cargarDatosIniciales();
    } catch(err) { alert(err.message); }
}
window.confirmarEliminar = async function(id) {
    if(confirm("¿Eliminar servicio?")) {
        try { await ApiService.eliminarServicio(id); cargarDatosIniciales(); }
        catch(err) { alert(err.message); }
    }
};