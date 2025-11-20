document.addEventListener('DOMContentLoaded', () => {
    inicializarMockData();
    cargarProductos();
});

function cargarProductos() {
    const productos = JSON.parse(localStorage.getItem('mock_productos')) || [];
    const tbody = document.getElementById('tabla-productos');
    tbody.innerHTML = '';

    if (productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center" style="padding:40px;">
                    No hay productos registrados.
                </td>
            </tr>`;
        return;
    }

    productos.forEach(p => {
        const categoria = CATEGORIAS_PRODUCTO[p.CATEGORIA_PRODUCTO_ID_CATEGORIA_PK] || '-';
        const fila = tbody.insertRow();
        fila.innerHTML = `
            <td>${p.PRODUCTO_ID_PRODUCTO_PK}</td>
            <td>${p.nombre}</td>
            <td>${categoria}</td>
            <td>₡ ${p.precio_unitario.toLocaleString('es-CR')}</td>
            <td>${p.cantidad}</td>
        `;
    });
}