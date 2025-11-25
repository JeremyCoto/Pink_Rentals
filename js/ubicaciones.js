document.addEventListener('DOMContentLoaded', async () => {
    await cargarTodo();
    document.getElementById('form-geo').addEventListener('submit', manejarGuardado);
});

// Cache Global
let datos = {
    provincias: [],
    cantones: [],
    distritos: []
};

// Estado de selección actual
let seleccion = {
    provinciaId: null,
    cantonId: null
};

async function cargarTodo() {
    try {
        const [p, c, d] = await Promise.all([
            ApiService.getProvincias(),
            ApiService.getCantones(),
            ApiService.getDistritos()
        ]);
        
        // Filtrar solo activos (estados_id_estado_fk == 1)
        // Opcional: si el admin quiere ver todo, quitamos el filtro. Lo dejamos para limpieza.
        datos.provincias = p.filter(x => x.estados_id_estado_fk === 1);
        datos.cantones = c.filter(x => x.estados_id_estado_fk === 1);
        datos.distritos = d.filter(x => x.estados_id_estado_fk === 1);

        renderProvincias();
    } catch(e) {
        console.error(e);
        alert("Error cargando datos geográficos");
    }
}

// --- RENDERS ---

function renderProvincias() {
    const div = document.getElementById('lista-provincias');
    div.innerHTML = '';
    
    datos.provincias.forEach(p => {
        const el = document.createElement('div');
        el.className = `geo-item ${seleccion.provinciaId === p.provincia_id_provincia_pk ? 'active' : ''}`;
        el.innerHTML = `<span>${p.nombre}</span> <button class="btn-mini" style="background:transparent; color:#f44336;" onclick="borrar('provincia', ${p.provincia_id_provincia_pk}, event)">×</button>`;
        el.onclick = (e) => {
            if(e.target.tagName === 'BUTTON') return;
            seleccionarProvincia(p.provincia_id_provincia_pk);
        };
        div.appendChild(el);
    });
}

function renderCantones() {
    const div = document.getElementById('lista-cantones');
    div.innerHTML = '';
    
    if(!seleccion.provinciaId) {
        div.innerHTML = '<p class="text-center" style="padding:20px; color:#666;">Selecciona una provincia</p>';
        document.getElementById('btn-add-canton').disabled = true;
        return;
    }
    document.getElementById('btn-add-canton').disabled = false;

    const filtrados = datos.cantones.filter(c => c.provincia_id_provincia_pk == seleccion.provinciaId);
    
    filtrados.forEach(c => {
        const el = document.createElement('div');
        el.className = `geo-item ${seleccion.cantonId === c.canton_id_canton_pk ? 'active' : ''}`;
        el.innerHTML = `<span>${c.nombre}</span> <button class="btn-mini" style="background:transparent; color:#f44336;" onclick="borrar('canton', ${c.canton_id_canton_pk}, event)">×</button>`;
        el.onclick = (e) => {
            if(e.target.tagName === 'BUTTON') return;
            seleccionarCanton(c.canton_id_canton_pk);
        };
        div.appendChild(el);
    });
}

function renderDistritos() {
    const div = document.getElementById('lista-distritos');
    div.innerHTML = '';

    if(!seleccion.cantonId) {
        div.innerHTML = '<p class="text-center" style="padding:20px; color:#666;">Selecciona un cantón</p>';
        document.getElementById('btn-add-distrito').disabled = true;
        return;
    }
    document.getElementById('btn-add-distrito').disabled = false;

    const filtrados = datos.distritos.filter(d => d.canton_id_canton_pk == seleccion.cantonId);

    filtrados.forEach(d => {
        const el = document.createElement('div');
        el.className = 'geo-item';
        el.innerHTML = `<span>${d.nombre}</span> <button class="btn-mini" style="background:transparent; color:#f44336;" onclick="borrar('distrito', ${d.distrito_id_distrito_pk}, event)">×</button>`;
        div.appendChild(el);
    });
}

// --- LOGICA SELECCION ---

function seleccionarProvincia(id) {
    seleccion.provinciaId = id;
    seleccion.cantonId = null; // Reset hijos
    renderProvincias(); // Update active class
    renderCantones();
    renderDistritos(); // Limpia distritos
}

function seleccionarCanton(id) {
    seleccion.cantonId = id;
    renderCantones(); // Update active class
    renderDistritos();
}

// --- CRUD ---

window.abrirModal = function(tipo) {
    document.getElementById('modal-geo').style.display = 'flex';
    document.getElementById('form-geo').reset();
    document.getElementById('tipo-entidad').value = tipo;
    
    let titulo = '';
    if(tipo === 'provincia') titulo = 'Nueva Provincia';
    else if(tipo === 'canton') {
        titulo = 'Nuevo Cantón';
        document.getElementById('id-padre').value = seleccion.provinciaId;
    } else {
        titulo = 'Nuevo Distrito';
        document.getElementById('id-padre').value = seleccion.cantonId;
    }
    document.getElementById('modal-titulo').textContent = titulo;
};

window.cerrarModal = function() {
    document.getElementById('modal-geo').style.display = 'none';
};

async function manejarGuardado(e) {
    e.preventDefault();
    const tipo = document.getElementById('tipo-entidad').value;
    const nombre = document.getElementById('nombre-geo').value;
    const padre = document.getElementById('id-padre').value;

    try {
        if(tipo === 'provincia') {
            await ApiService.crearProvincia({ nombre });
        } else if(tipo === 'canton') {
            await ApiService.crearCanton({ nombre, provinciaId: padre });
        } else if(tipo === 'distrito') {
            await ApiService.crearDistrito({ nombre, cantonId: padre });
        }
        cerrarModal();
        await cargarTodo(); // Recargar para ver cambios
        
        // Restaurar vistas
        renderProvincias();
        renderCantones();
        renderDistritos();
    } catch(err) {
        alert("Error: " + err.message);
    }
}

window.borrar = async function(tipo, id, e) {
    e.stopPropagation(); // Evitar click en el item
    if(!confirm("¿Eliminar ubicación? Esto podría afectar direcciones existentes.")) return;

    try {
        if(tipo === 'provincia') await ApiService.eliminarProvincia(id);
        if(tipo === 'canton') await ApiService.eliminarCanton(id);
        if(tipo === 'distrito') await ApiService.eliminarDistrito(id);
        
        await cargarTodo();
        renderProvincias();
        // Si borramos el seleccionado, resetear
        if(tipo === 'provincia' && id == seleccion.provinciaId) seleccionarProvincia(null);
        if(tipo === 'canton' && id == seleccion.cantonId) seleccionarCanton(null);
        
        renderCantones();
        renderDistritos();
    } catch(err) {
        alert("Error: " + err.message);
    }
};