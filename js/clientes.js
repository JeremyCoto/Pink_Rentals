document.addEventListener('DOMContentLoaded', () => {
    inicializarMockData();
    cargarClientes();
    document.getElementById('buscar-cliente')
        .addEventListener('input', filtrarClientes);
});

let clientesCache = [];

function cargarClientes() {
    const clientes = JSON.parse(localStorage.getItem('mock_clientes')) || [];
    clientesCache = clientes;
    document.getElementById('clientes-total').textContent = clientes.length;
    renderClientes(clientes);
}

function renderClientes(clientes) {
    const tbody = document.getElementById('tabla-clientes');
    tbody.innerHTML = '';

    if (clientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding:40px;">
                    No hay clientes registrados.
                </td>
            </tr>`;
        return;
    }

    clientes.forEach(c => {
        const provincia = getProvinciaFromDistrito(c.DISTRITO_ID_DISTRITO_PK);
        const canton = getCantonFromDistrito(c.DISTRITO_ID_DISTRITO_PK);
        const distrito = getNombreDistrito(c.DISTRITO_ID_DISTRITO_PK);

        const fila = tbody.insertRow();
        fila.innerHTML = `
            <td>${c.CLIENTES_ID_CEDULA_PK}</td>
            <td>${c.nombre} ${c.primer_apellido} ${c.segundo_apellido}</td>
            <td>${provincia}</td>
            <td>${canton}</td>
            <td>${distrito}</td>
            <td>${PinkUtils.formatearFechaES(c.fecha_registro)}</td>
        `;
    });
}

function filtrarClientes(e) {
    const term = e.target.value.toLowerCase();
    const filtrados = clientesCache.filter(c =>
        String(c.CLIENTES_ID_CEDULA_PK).includes(term) ||
        `${c.nombre} ${c.primer_apellido} ${c.segundo_apellido}`.toLowerCase().includes(term)
    );
    renderClientes(filtrados);
}

// Helpers geográficos basados en config.js
function getProvinciaFromDistrito(distritoId) {
    for (const [provId, cantones] of Object.entries(CANTONES)) {
        for (const c of cantones) {
            if (DISTRITOS[c.id]?.some?.(d => d.id === distritoId)) {
                return PROVINCIAS[Number(provId)] || '-';
            }
        }
    }
    // versión simplificada usando rangos
    if (String(distritoId).startsWith('101') || String(distritoId).startsWith('102')) return PROVINCIAS[1];
    if (String(distritoId).startsWith('201')) return PROVINCIAS[2];
    if (String(distritoId).startsWith('301')) return PROVINCIAS[3];
    return '-';
}

function getCantonFromDistrito(distritoId) {
    const prefix = Number(String(distritoId).slice(0, 3));
    for (const cantones of Object.values(CANTONES)) {
        const c = cantones.find(cn => cn.id === prefix);
        if (c) return c.nombre;
    }
    return '-';
}

function getNombreDistrito(distritoId) {
    const list = DISTRITOS[Number(String(distritoId).slice(0, 3))];
    const d = list && list.find(x => x.id === distritoId);
    return d ? d.nombre : '-';
}