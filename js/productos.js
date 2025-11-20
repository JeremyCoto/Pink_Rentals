document.addEventListener('DOMContentLoaded', () => {
    // inicializarMockData(); // ELIMINADO
    cargarProductosReales();
});

async function cargarProductosReales() {
    const tbody = document.getElementById('tabla-productos');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Conectando con Oracle...</td></tr>';

    try {
        const productos = await ApiService.getProductos();
        tbody.innerHTML = '';

        if (productos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:40px;">No hay productos en la BD.</td></tr>`;
            return;
        }

        productos.forEach(p => {
            // Usamos nombres de columna en minúscula (mapeados por el backend)
            const categoria = CATEGORIAS_PRODUCTO[p.categoria_producto_id_categoria_pk] || 'General';
            
            const fila = tbody.insertRow();
            fila.innerHTML = `
                <td>${p.producto_id_producto_pk}</td>
                <td>${p.nombre}</td>
                <td>${categoria}</td>
                <td>₡ ${Number(p.precio_unitario).toLocaleString('es-CR')}</td>
                <td>${p.cantidad}</td>
            `;
        });
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Error al cargar datos.</td></tr>';
    }
}