document.addEventListener('DOMContentLoaded', () => {
    inicializarMockData();
    cargarServicios();
});

function cargarServicios() {
    const servicios = JSON.parse(localStorage.getItem('mock_servicios')) || [];
    const contenedor = document.getElementById('grid-servicios');
    contenedor.innerHTML = '';

    if (servicios.length === 0) {
        contenedor.innerHTML = '<p class="text-center">No hay servicios configurados.</p>';
        return;
    }

    servicios.forEach(s => {
        const categoria = CATEGORIAS_SERVICIO[s.CATEGORIA_SERVICIO_ID_CATEGORIA_PK] || 'Servicio';
        const icono = ICONOS_SERVICIOS[categoria] || '';

        const card = document.createElement('div');
        card.className = 'servicio-card';

        card.innerHTML = `
            <div class="servicio-icon">${icono}</div>
            <h3>${s.nombre}</h3>
            <p>${s.descripcion}</p>
            <p style="margin-top:10px; font-weight:600;">₡ ${s.precio.toLocaleString('es-CR')}</p>
            <div class="servicio-footer">
                <span class="info-badge">${categoria}</span>
                <button class="btn btn-primary">+ Agregar</button>
            </div>
        `;

        card.querySelector('button').addEventListener('click', () => {
            PinkUtils.mostrarToast(`Servicio "${s.nombre}" agregado (simulado)`, 'success');
        });

        contenedor.appendChild(card);
    });
}