document.addEventListener('DOMContentLoaded', () => {
    cargarServiciosReales();
});

async function cargarServiciosReales() {
    const contenedor = document.getElementById('grid-servicios');
    contenedor.innerHTML = '<p class="text-center">Cargando catálogo...</p>';

    try {
        const servicios = await ApiService.getServicios();
        contenedor.innerHTML = '';

        if (servicios.length === 0) {
            contenedor.innerHTML = '<p class="text-center">No hay servicios en la Base de Datos.</p>';
            return;
        }

        servicios.forEach(s => {
            // Atento a las mayúsculas/minúsculas. Usamos las del backend (minúsculas)
            const catId = s.categoria_servicio_id_categoria_pk; 
            const categoria = CATEGORIAS_SERVICIO[catId] || 'Servicio';
            const icono = ICONOS_SERVICIOS[categoria] || '✨';

            const card = document.createElement('div');
            card.className = 'servicio-card';

            card.innerHTML = `
                <div class="servicio-icon">${icono}</div>
                <h3>${s.nombre}</h3>
                <p>${s.descripcion || 'Sin descripción'}</p>
                <p style="margin-top:10px; font-weight:600;">₡ ${Number(s.precio).toLocaleString('es-CR')}</p>
                <div class="servicio-footer">
                    <span class="info-badge">${categoria}</span>
                    <button class="btn btn-primary">+ Agregar</button>
                </div>
            `;

            card.querySelector('button').addEventListener('click', () => {
                PinkUtils.mostrarToast(`Servicio "${s.nombre}" seleccionado`, 'success');
            });

            contenedor.appendChild(card);
        });
    } catch (error) {
        contenedor.innerHTML = '<p class="text-center error">Error de conexión</p>';
    }
}