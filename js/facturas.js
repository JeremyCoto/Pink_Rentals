document.addEventListener('DOMContentLoaded', async () => {
    await cargarFacturas();
    document.getElementById('buscar-factura').addEventListener('input', filtrarFacturas);
});

let facturasCache = [];
let detallesCache = []; // Cacheamos detalles para no hacer fetch por cada click
let serviciosCache = []; // Para saber el nombre del servicio

async function cargarFacturas() {
    const tbody = document.getElementById('tabla-facturas');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando datos financieros...</td></tr>';

    try {
        const [facturas, detalles, servicios] = await Promise.all([
            ApiService.getFacturas(),
            ApiService.getDetallesFactura(),
            ApiService.getServicios()
        ]);
        
        facturasCache = facturas;
        detallesCache = detalles;
        serviciosCache = servicios;
        
        renderFacturas(facturas);
    } catch(e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center error">Error cargando facturación.</td></tr>';
    }
}

function renderFacturas(lista) {
    const tbody = document.getElementById('tabla-facturas');
    const totalEl = document.getElementById('gran-total');
    tbody.innerHTML = '';

    if(lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay registros.</td></tr>';
        totalEl.textContent = '₡0';
        return;
    }

    // Ordenar por fecha descendente (más reciente primero)
    lista.sort((a,b) => new Date(b.fecha_emision) - new Date(a.fecha_emision));

    let sumaTotal = 0;

    lista.forEach(f => {
        // Estado 1 = Activo/Pagado, Estado 2 = Anulado
        const activo = f.estados_id_estado_pk == 1;
        const estadoHtml = activo 
            ? '<span class="estado-badge estado-completado">Pagada</span>' 
            : '<span class="estado-badge estado-cancelado">Anulada</span>';
        
        if(activo) sumaTotal += Number(f.monto_total);

        const tr = document.createElement('tr');
        if(!activo) tr.style.opacity = "0.5"; // Visualmente anulada

        tr.innerHTML = `
            <td>#${f.facturacion_id_numero_factura_pk}</td>
            <td>${new Date(f.fecha_emision).toLocaleDateString()}</td>
            <td style="font-weight:bold;">₡${Number(f.monto_total).toLocaleString()}</td>
            <td>Reserva #${f.reservaciones_id_reservacion_pk}</td>
            <td>${estadoHtml}</td>
            <td class="text-center">
                <button class="btn-icon" onclick="verDetalle(${f.facturacion_id_numero_factura_pk})" title="Ver Detalle">👁️</button>
                ${activo ? `<button class="btn-icon eliminar" onclick="anular(${f.facturacion_id_numero_factura_pk})" title="Anular">🚫</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });

    totalEl.textContent = '₡' + sumaTotal.toLocaleString();
}

// --- DETALLE ---
window.verDetalle = function(idFactura) {
    const factura = facturasCache.find(f => f.facturacion_id_numero_factura_pk == idFactura);
    const items = detallesCache.filter(d => d.facturacion_id_numero_factura_fk == idFactura);
    
    document.getElementById('lbl-id-factura').textContent = idFactura;
    document.getElementById('lbl-impuestos').textContent = '₡' + Number(factura.impuestos).toLocaleString();
    
    const tbody = document.getElementById('tabla-detalle-items');
    tbody.innerHTML = '';

    items.forEach(item => {
        const serv = serviciosCache.find(s => s.servicios_id_servicio_pk == item.servicios_id_servicio_pk);
        const nombre = serv ? serv.nombre : 'Servicio ID ' + item.servicios_id_servicio_pk;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${nombre}</td>
            <td>${item.cantidad}</td>
            <td>₡${Number(item.precio_unitario).toLocaleString()}</td>
            <td>₡${Number(item.subtotal_linea).toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('modal-detalle').style.display = 'flex';
};

window.cerrarModal = function() {
    document.getElementById('modal-detalle').style.display = 'none';
};

// --- ANULAR ---
window.anular = async function(id) {
    if(confirm(`¿Seguro que desea ANULAR la factura #${id}? Esta acción es irreversible.`)) {
        try {
            await ApiService.anularFactura(id);
            await cargarFacturas();
        } catch(err) {
            alert("Error: " + err.message);
        }
    }
};

function filtrarFacturas(e) {
    const term = e.target.value.toLowerCase();
    const filtrados = facturasCache.filter(f => 
        String(f.facturacion_id_numero_factura_pk).includes(term) ||
        String(f.reservaciones_id_reservacion_pk).includes(term)
    );
    renderFacturas(filtrados);
}