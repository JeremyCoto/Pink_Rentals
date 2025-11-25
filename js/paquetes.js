document.addEventListener('DOMContentLoaded', async () => {
    await cargarPaquetes();
    document.getElementById('form-paquete').addEventListener('submit', manejarGuardado);
});

let paquetesCache = [];
let editandoId = null;

async function cargarPaquetes() {
    const tbody = document.getElementById('tabla-paquetes');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';

    try {
        const paquetes = await ApiService.getPaquetes();
        paquetesCache = paquetes;
        
        // Filtramos solo activos para mostrar en tabla por defecto, o todos para admin
        // Aquí mostramos todos pero indicamos el estado si no es activo
        renderPaquetes(paquetes);
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center error">Error cargando datos.</td></tr>';
    }
}

function renderPaquetes(lista) {
    const tbody = document.getElementById('tabla-paquetes');
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay paquetes registrados.</td></tr>';
        return;
    }

    lista.forEach(p => {
        // Si está inactivo, mostrarlo visualmente distinto
        const rowStyle = p.estados_id_estado_fk != 1 ? 'opacity: 0.5;' : '';
        
        const row = document.createElement('tr');
        row.style = rowStyle;
        row.innerHTML = `
            <td>${p.paquete_id_paquete_pk}</td>
            <td><strong>${p.nombre_paquete}</strong></td>
            <td>${p.descripcion}</td>
            <td style="color:var(--pink-primary); font-weight:bold;">₡${Number(p.precio_total).toLocaleString()}</td>
            <td class="text-center">
                <button class="btn-icon editar" onclick="abrirModalEditar(${p.paquete_id_paquete_pk})">✏️</button>
                <button class="btn-icon eliminar" onclick="confirmarEliminar(${p.paquete_id_paquete_pk})">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// --- MODALES ---
window.abrirModalCrear = function() {
    editandoId = null;
    document.getElementById('modal-titulo').textContent = "Nuevo Paquete";
    document.getElementById('form-paquete').reset();
    document.getElementById('group-estado').style.display = 'none';
    document.getElementById('modal-paquete').style.display = 'flex';
};

window.abrirModalEditar = function(id) {
    const p = paquetesCache.find(x => x.paquete_id_paquete_pk == id);
    if (!p) return;

    editandoId = id;
    document.getElementById('modal-titulo').textContent = "Editar Paquete";
    document.getElementById('paquete-id').value = id;
    document.getElementById('nombre').value = p.nombre_paquete;
    document.getElementById('descripcion').value = p.descripcion;
    document.getElementById('precio').value = p.precio_total;
    
    document.getElementById('group-estado').style.display = 'block';
    document.getElementById('select-estado').value = p.estados_id_estado_fk;

    document.getElementById('modal-paquete').style.display = 'flex';
};

window.cerrarModal = function() {
    document.getElementById('modal-paquete').style.display = 'none';
};

// --- CRUD ---
async function manejarGuardado(e) {
    e.preventDefault();
    
    const datos = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precio: document.getElementById('precio').value,
        estado: document.getElementById('select-estado').value
    };

    try {
        if (editandoId) {
            await ApiService.actualizarPaquete(editandoId, datos);
            alert("Paquete actualizado.");
        } else {
            await ApiService.crearPaquete(datos);
            alert("Paquete creado.");
        }
        cerrarModal();
        cargarPaquetes();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

window.confirmarEliminar = async function(id) {
    if (confirm("¿Eliminar este paquete?")) {
        try {
            await ApiService.eliminarPaquete(id);
            cargarPaquetes();
        } catch (err) {
            alert("Error: " + err.message);
        }
    }
};