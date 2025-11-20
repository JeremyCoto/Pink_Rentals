document.addEventListener('DOMContentLoaded', async () => {
    await cargarClientesReales();
    document.getElementById('buscar-cliente').addEventListener('input', filtrarClientes);
});

let clientesCache = [];

async function cargarClientesReales() {
    const tbody = document.getElementById('tabla-clientes');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Consultando Oracle...</td></tr>';

    try {
        const clientes = await ApiService.getClientes();
        clientesCache = clientes;
        
        document.getElementById('clientes-total').textContent = clientes.length;
        renderClientes(clientes);
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error de conexión.</td></tr>';
    }
}

function renderClientes(clientes) {
    const tbody = document.getElementById('tabla-clientes');
    tbody.innerHTML = '';

    if (clientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;">No hay clientes registrados.</td></tr>`;
        return;
    }

    clientes.forEach(c => {
        // NOTA: Eliminé las columnas de Provincia/Cantón/Distrito temporalmente 
        // porque esa info está en otra tabla (DIRECCIONES) y requiere un JOIN más complejo.
        // Por ahora mostramos " - " para que la tabla se vea bien.
        
        const fila = tbody.insertRow();
        fila.innerHTML = `
            <td>${c.usuarios_id_cedula_pk}</td>
            <td>${c.nombre} ${c.primer_apellido} ${c.segundo_apellido || ''}</td>
            <td> - </td> 
            <td> - </td>
            <td> - </td>
            <td>${c.telefono}</td> `;
    });
}

function filtrarClientes(e) {
    const term = e.target.value.toLowerCase();
    const filtrados = clientesCache.filter(c =>
        String(c.usuarios_id_cedula_pk).includes(term) ||
        `${c.nombre} ${c.primer_apellido}`.toLowerCase().includes(term)
    );
    renderClientes(filtrados);
}