// ============================================
// PINK RENTALS - Sistema de Gestión
// JavaScript Principal - Versión Simplificada
// ============================================

// ============================================
// 1. INICIALIZACIÓN DE DATOS
// ============================================

/**
 * Carga datos de ejemplo en LocalStorage si no existen
 */
function inicializarDatos() {
    // Verificar si ya hay clientes guardados
    if (!localStorage.getItem('clientes')) {
        const clientesEjemplo = [
            {
                id: 1,
                nombre: "María García López",
                email: "maria.garcia@email.com",
                telefono: "+506 8888-7777",
                empresa: "Eventos Especiales CR",
                fechaRegistro: "2024-10-15",
                eventos: 3
            },
            {
                id: 2,
                nombre: "Carlos Rodríguez",
                email: "carlos.r@email.com",
                telefono: "+506 7777-6666",
                empresa: "Tech Solutions",
                fechaRegistro: "2024-11-02",
                eventos: 1
            },
            {
                id: 3,
                nombre: "Ana Martínez",
                email: "ana.martinez@email.com",
                telefono: "+506 6666-5555",
                empresa: "",
                fechaRegistro: "2024-09-20",
                eventos: 2
            }
        ];
        localStorage.setItem('clientes', JSON.stringify(clientesEjemplo));
    }

    // Verificar si ya hay eventos guardados
    if (!localStorage.getItem('eventos')) {
        const eventosEjemplo = [
            {
                id: 1,
                nombre: "Boda González-Pérez",
                clienteId: 1,
                fecha: "2024-12-20",
                tipo: "Boda",
                estado: "Confirmado"
            },
            {
                id: 2,
                nombre: "XV Años Valentina",
                clienteId: 1,
                fecha: "2025-01-15",
                tipo: "XV Años",
                estado: "Pendiente"
            },
            {
                id: 3,
                nombre: "Evento Corporativo Tech",
                clienteId: 2,
                fecha: "2024-11-30",
                tipo: "Corporativo",
                estado: "Completado"
            },
            {
                id: 4,
                nombre: "Cumpleaños Andrea",
                clienteId: 3,
                fecha: "2024-10-05",
                tipo: "Cumpleaños",
                estado: "Completado"
            }
        ];
        localStorage.setItem('eventos', JSON.stringify(eventosEjemplo));
    }

    // Inicializar contadores de IDs
    if (!localStorage.getItem('clienteIdCounter')) {
        localStorage.setItem('clienteIdCounter', '4');
    }
    if (!localStorage.getItem('eventoIdCounter')) {
        localStorage.setItem('eventoIdCounter', '5');
    }
}

// ============================================
// 2. FUNCIONES DE ACCESO A DATOS
// ============================================

/**
 * Obtiene todos los clientes del LocalStorage
 * @returns {Array} Lista de clientes
 */
function obtenerClientes() {
    return JSON.parse(localStorage.getItem('clientes')) || [];
}

/**
 * Guarda la lista de clientes en LocalStorage
 * @param {Array} clientes - Lista de clientes a guardar
 */
function guardarClientes(clientes) {
    localStorage.setItem('clientes', JSON.stringify(clientes));
}

/**
 * Obtiene todos los eventos del LocalStorage
 * @returns {Array} Lista de eventos
 */
function obtenerEventos() {
    return JSON.parse(localStorage.getItem('eventos')) || [];
}

/**
 * Guarda la lista de eventos en LocalStorage
 * @param {Array} eventos - Lista de eventos a guardar
 */
function guardarEventos(eventos) {
    localStorage.setItem('eventos', JSON.stringify(eventos));
}

/**
 * Busca un cliente por su ID
 * @param {number} id - ID del cliente
 * @returns {Object|undefined} Cliente encontrado o undefined
 */
function obtenerClientePorId(id) {
    const clientes = obtenerClientes();
    return clientes.find(c => c.id === parseInt(id));
}

// ============================================
// 3. FUNCIONES DE RENDERIZADO
// ============================================

/**
 * Renderiza la tabla de clientes
 * @param {Array} clientesFiltrados - Lista opcional de clientes filtrados
 */
function renderizarClientes(clientesFiltrados = null) {
    const clientes = clientesFiltrados || obtenerClientes();
    const tbody = document.getElementById('tabla-clientes');
    const mensajeSinClientes = document.getElementById('mensaje-sin-clientes');
    
    // Si no hay clientes, mostrar mensaje
    if (clientes.length === 0) {
        if (mensajeSinClientes) mensajeSinClientes.style.display = 'table-row';
        return;
    }
    
    // Ocultar mensaje y crear filas
    if (mensajeSinClientes) mensajeSinClientes.style.display = 'none';
    
    // Limpiar tabla excepto el mensaje
    Array.from(tbody.children).forEach(row => {
        if (row.id !== 'mensaje-sin-clientes') row.remove();
    });
    
    // Crear fila para cada cliente
    clientes.forEach(cliente => {
        const fila = tbody.insertRow();
        fila.innerHTML = `
            <td><strong>#${cliente.id}</strong></td>
            <td>${cliente.nombre}</td>
            <td>${cliente.email}</td>
            <td>${cliente.telefono}</td>
            <td>${formatearFecha(cliente.fechaRegistro)}</td>
            <td><span class="estado-badge estado-confirmado">${cliente.eventos} Eventos</span></td>
            <td>
                <button class="btn btn-edit" data-action="editar-cliente" data-id="${cliente.id}">✏️ Editar</button>
                <button class="btn btn-delete" data-action="eliminar-cliente" data-id="${cliente.id}">🗑️ Eliminar</button>
            </td>
        `;
    });
    
    // Agregar event listeners a los botones
    agregarEventListenersClientes();
}

/**
 * Renderiza la tabla de eventos
 */
function renderizarEventos() {
    const eventos = obtenerEventos();
    const tbody = document.getElementById('tabla-eventos');
    const mensajeSinEventos = document.getElementById('mensaje-sin-eventos');
    
    // Si no hay eventos, mostrar mensaje
    if (eventos.length === 0) {
        if (mensajeSinEventos) mensajeSinEventos.style.display = 'table-row';
        return;
    }
    
    // Ocultar mensaje y crear filas
    if (mensajeSinEventos) mensajeSinEventos.style.display = 'none';
    
    // Limpiar tabla excepto el mensaje
    Array.from(tbody.children).forEach(row => {
        if (row.id !== 'mensaje-sin-eventos') row.remove();
    });
    
    // Crear fila para cada evento
    eventos.forEach(evento => {
        const cliente = obtenerClientePorId(evento.clienteId);
        const nombreCliente = cliente ? cliente.nombre : 'Cliente desconocido';
        
        const fila = tbody.insertRow();
        fila.innerHTML = `
            <td><strong>#${evento.id}</strong></td>
            <td>${evento.nombre}</td>
            <td>${nombreCliente}</td>
            <td>${formatearFecha(evento.fecha)}</td>
            <td><span class="estado-badge estado-confirmado">${evento.tipo}</span></td>
            <td><span class="estado-badge estado-${evento.estado.toLowerCase()}">${evento.estado}</span></td>
            <td>
                <button class="btn btn-edit" data-action="editar-evento" data-id="${evento.id}">✏️ Editar</button>
                <button class="btn btn-delete" data-action="eliminar-evento" data-id="${evento.id}">🗑️ Eliminar</button>
            </td>
        `;
    });
    
    // Agregar event listeners a los botones
    agregarEventListenersEventos();
}

/**
 * Actualiza las estadísticas del dashboard
 */
function actualizarEstadisticas() {
    const clientes = obtenerClientes();
    const eventos = obtenerEventos();
    
    document.getElementById('total-clientes').textContent = clientes.length;
    document.getElementById('total-eventos').textContent = eventos.length;
    document.getElementById('total-servicios').textContent = '4';
}

/**
 * Carga los clientes en el select del formulario de eventos
 */
function cargarClientesEnSelect() {
    const clientes = obtenerClientes();
    const select = document.getElementById('evento-cliente');
    
    // Limpiar y agregar opción por defecto
    select.innerHTML = '<option value="">Selecciona un cliente</option>';
    
    // Agregar cada cliente como opción
    clientes.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.nombre;
        select.appendChild(option);
    });
}

// ============================================
// 4. CRUD - CLIENTES
// ============================================

/**
 * Abre el modal para agregar un nuevo cliente
 */
function abrirModalCliente() {
    document.getElementById('modal-cliente-titulo').textContent = 'Agregar Cliente';
    document.getElementById('form-cliente').reset();
    document.getElementById('cliente-id').value = '';
    document.getElementById('modal-cliente').style.display = 'block';
}

/**
 * Cierra el modal de clientes
 */
function cerrarModalCliente() {
    document.getElementById('modal-cliente').style.display = 'none';
}

/**
 * Guarda un cliente (nuevo o editado)
 * @param {Event} event - Evento del formulario
 */
function guardarCliente(event) {
    event.preventDefault();
    
    const id = document.getElementById('cliente-id').value;
    const cliente = {
        nombre: document.getElementById('cliente-nombre').value,
        email: document.getElementById('cliente-email').value,
        telefono: document.getElementById('cliente-telefono').value,
        empresa: document.getElementById('cliente-empresa').value,
        fechaRegistro: new Date().toISOString().split('T')[0],
        eventos: 0
    };

    let clientes = obtenerClientes();

    if (id) {
        // EDITAR cliente existente
        const index = clientes.findIndex(c => c.id === parseInt(id));
        if (index !== -1) {
            cliente.id = parseInt(id);
            cliente.eventos = clientes[index].eventos;
            cliente.fechaRegistro = clientes[index].fechaRegistro;
            clientes[index] = cliente;
            mostrarNotificacion('✅ Cliente actualizado exitosamente', 'success');
        }
    } else {
        // CREAR nuevo cliente
        const counter = parseInt(localStorage.getItem('clienteIdCounter'));
        cliente.id = counter;
        localStorage.setItem('clienteIdCounter', (counter + 1).toString());
        clientes.push(cliente);
        mostrarNotificacion('✅ Cliente agregado exitosamente', 'success');
    }

    // Guardar y actualizar vista
    guardarClientes(clientes);
    renderizarClientes();
    actualizarEstadisticas();
    cargarClientesEnSelect();
    cerrarModalCliente();
}

/**
 * Abre el modal para editar un cliente
 * @param {number} id - ID del cliente a editar
 */
function editarCliente(id) {
    const cliente = obtenerClientePorId(id);
    if (!cliente) return;

    // Cambiar título y llenar formulario
    document.getElementById('modal-cliente-titulo').textContent = 'Editar Cliente';
    document.getElementById('cliente-id').value = cliente.id;
    document.getElementById('cliente-nombre').value = cliente.nombre;
    document.getElementById('cliente-email').value = cliente.email;
    document.getElementById('cliente-telefono').value = cliente.telefono;
    document.getElementById('cliente-empresa').value = cliente.empresa || '';
    
    // Abrir modal
    document.getElementById('modal-cliente').style.display = 'block';
}

/**
 * Pide confirmación y elimina un cliente
 * @param {number} id - ID del cliente a eliminar
 */
function confirmarEliminarCliente(id) {
    const cliente = obtenerClientePorId(id);
    if (!cliente) return;

    if (confirm(`¿Estás seguro de eliminar al cliente "${cliente.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
        eliminarCliente(id);
    }
}

/**
 * Elimina un cliente y sus eventos asociados
 * @param {number} id - ID del cliente a eliminar
 */
function eliminarCliente(id) {
    let clientes = obtenerClientes();
    let eventos = obtenerEventos();
    
    // Eliminar eventos asociados al cliente
    eventos = eventos.filter(e => e.clienteId !== id);
    guardarEventos(eventos);
    
    // Eliminar cliente
    clientes = clientes.filter(c => c.id !== id);
    guardarClientes(clientes);
    
    // Actualizar vista
    renderizarClientes();
    renderizarEventos();
    actualizarEstadisticas();
    mostrarNotificacion('✅ Cliente eliminado exitosamente', 'success');
}

/**
 * Busca clientes por nombre, email, teléfono o empresa
 */
function buscarCliente() {
    const termino = document.getElementById('buscar-cliente').value.toLowerCase();
    const clientes = obtenerClientes();
    
    const clientesFiltrados = clientes.filter(c => 
        c.nombre.toLowerCase().includes(termino) ||
        c.email.toLowerCase().includes(termino) ||
        c.telefono.includes(termino) ||
        (c.empresa && c.empresa.toLowerCase().includes(termino))
    );
    
    renderizarClientes(clientesFiltrados);
}

// ============================================
// 5. CRUD - EVENTOS
// ============================================

/**
 * Abre el modal para agregar un nuevo evento
 */
function abrirModalEvento() {
    document.getElementById('modal-evento-titulo').textContent = 'Agregar Evento';
    document.getElementById('form-evento').reset();
    document.getElementById('evento-id').value = '';
    cargarClientesEnSelect();
    document.getElementById('modal-evento').style.display = 'block';
}

/**
 * Cierra el modal de eventos
 */
function cerrarModalEvento() {
    document.getElementById('modal-evento').style.display = 'none';
}

/**
 * Guarda un evento (nuevo o editado)
 * @param {Event} event - Evento del formulario
 */
function guardarEvento(event) {
    event.preventDefault();
    
    const id = document.getElementById('evento-id').value;
    const evento = {
        nombre: document.getElementById('evento-nombre').value,
        clienteId: parseInt(document.getElementById('evento-cliente').value),
        fecha: document.getElementById('evento-fecha').value,
        tipo: document.getElementById('evento-tipo').value,
        estado: document.getElementById('evento-estado').value
    };

    let eventos = obtenerEventos();

    if (id) {
        // EDITAR evento existente
        const index = eventos.findIndex(e => e.id === parseInt(id));
        if (index !== -1) {
            evento.id = parseInt(id);
            eventos[index] = evento;
            mostrarNotificacion('✅ Evento actualizado exitosamente', 'success');
        }
    } else {
        // CREAR nuevo evento
        const counter = parseInt(localStorage.getItem('eventoIdCounter'));
        evento.id = counter;
        localStorage.setItem('eventoIdCounter', (counter + 1).toString());
        eventos.push(evento);
        
        // Incrementar contador de eventos del cliente
        let clientes = obtenerClientes();
        const clienteIndex = clientes.findIndex(c => c.id === evento.clienteId);
        if (clienteIndex !== -1) {
            clientes[clienteIndex].eventos++;
            guardarClientes(clientes);
            renderizarClientes();
        }
        
        mostrarNotificacion('✅ Evento agregado exitosamente', 'success');
    }

    // Guardar y actualizar vista
    guardarEventos(eventos);
    renderizarEventos();
    actualizarEstadisticas();
    cerrarModalEvento();
}

/**
 * Abre el modal para editar un evento
 * @param {number} id - ID del evento a editar
 */
function editarEvento(id) {
    const eventos = obtenerEventos();
    const evento = eventos.find(e => e.id === id);
    if (!evento) return;

    // Cambiar título y llenar formulario
    document.getElementById('modal-evento-titulo').textContent = 'Editar Evento';
    document.getElementById('evento-id').value = evento.id;
    document.getElementById('evento-nombre').value = evento.nombre;
    cargarClientesEnSelect();
    document.getElementById('evento-cliente').value = evento.clienteId;
    document.getElementById('evento-fecha').value = evento.fecha;
    document.getElementById('evento-tipo').value = evento.tipo;
    document.getElementById('evento-estado').value = evento.estado;
    
    // Abrir modal
    document.getElementById('modal-evento').style.display = 'block';
}

/**
 * Pide confirmación y elimina un evento
 * @param {number} id - ID del evento a eliminar
 */
function confirmarEliminarEvento(id) {
    const eventos = obtenerEventos();
    const evento = eventos.find(e => e.id === id);
    if (!evento) return;

    if (confirm(`¿Estás seguro de eliminar el evento "${evento.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
        eliminarEvento(id);
    }
}

/**
 * Elimina un evento
 * @param {number} id - ID del evento a eliminar
 */
function eliminarEvento(id) {
    let eventos = obtenerEventos();
    const evento = eventos.find(e => e.id === id);
    
    if (evento) {
        // Decrementar contador de eventos del cliente
        let clientes = obtenerClientes();
        const clienteIndex = clientes.findIndex(c => c.id === evento.clienteId);
        if (clienteIndex !== -1 && clientes[clienteIndex].eventos > 0) {
            clientes[clienteIndex].eventos--;
            guardarClientes(clientes);
            renderizarClientes();
        }
    }
    
    // Eliminar evento
    eventos = eventos.filter(e => e.id !== id);
    guardarEventos(eventos);
    
    // Actualizar vista
    renderizarEventos();
    actualizarEstadisticas();
    mostrarNotificacion('✅ Evento eliminado exitosamente', 'success');
}

// ============================================
// 6. FUNCIONES AUXILIARES
// ============================================

/**
 * Formatea una fecha en formato legible en español
 * @param {string} fecha - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', opciones);
}

/**
 * Muestra una notificación temporal en la pantalla
 * @param {string} mensaje - Texto a mostrar
 * @param {string} tipo - Tipo de notificación ('success' o 'error')
 */
function mostrarNotificacion(mensaje, tipo) {
    const notif = document.createElement('div');
    notif.className = 'notificacion';
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background-color: ${tipo === 'success' ? '#4CAF50' : '#F44336'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        z-index: 3000;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    notif.textContent = mensaje;
    
    document.body.appendChild(notif);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

/**
 * Agrega event listeners a los botones de la tabla de clientes
 */
function agregarEventListenersClientes() {
    // Botones de editar
    document.querySelectorAll('[data-action="editar-cliente"]').forEach(btn => {
        btn.addEventListener('click', function() {
            editarCliente(parseInt(this.dataset.id));
        });
    });
    
    // Botones de eliminar
    document.querySelectorAll('[data-action="eliminar-cliente"]').forEach(btn => {
        btn.addEventListener('click', function() {
            confirmarEliminarCliente(parseInt(this.dataset.id));
        });
    });
}

/**
 * Agrega event listeners a los botones de la tabla de eventos
 */
function agregarEventListenersEventos() {
    // Botones de editar
    document.querySelectorAll('[data-action="editar-evento"]').forEach(btn => {
        btn.addEventListener('click', function() {
            editarEvento(parseInt(this.dataset.id));
        });
    });
    
    // Botones de eliminar
    document.querySelectorAll('[data-action="eliminar-evento"]').forEach(btn => {
        btn.addEventListener('click', function() {
            confirmarEliminarEvento(parseInt(this.dataset.id));
        });
    });
}

// ============================================
// 7. EVENT LISTENERS PRINCIPALES
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Botones principales
    document.getElementById('btn-agregar-cliente').addEventListener('click', abrirModalCliente);
    document.getElementById('btn-agregar-evento').addEventListener('click', abrirModalEvento);
    
    // Búsqueda
    document.getElementById('buscar-cliente').addEventListener('keyup', buscarCliente);
    
    // Cerrar modales
    document.getElementById('close-modal-cliente').addEventListener('click', cerrarModalCliente);
    document.getElementById('close-modal-evento').addEventListener('click', cerrarModalEvento);
    document.getElementById('btn-cancelar-cliente').addEventListener('click', cerrarModalCliente);
    document.getElementById('btn-cancelar-evento').addEventListener('click', cerrarModalEvento);
    
    // Formularios
    document.getElementById('form-cliente').addEventListener('submit', guardarCliente);
    document.getElementById('form-evento').addEventListener('submit', guardarEvento);
    
    // Navegación suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Actualizar navegación activa
                document.querySelectorAll('.nav a').forEach(link => link.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Cerrar modales al hacer clic fuera
    window.onclick = function(event) {
        const modalCliente = document.getElementById('modal-cliente');
        const modalEvento = document.getElementById('modal-evento');
        
        if (event.target === modalCliente) cerrarModalCliente();
        if (event.target === modalEvento) cerrarModalEvento();
    };
});

// ============================================
// 8. INICIALIZACIÓN AL CARGAR LA PÁGINA
// ============================================

window.onload = function() {
    // Inicializar datos de ejemplo
    inicializarDatos();
    
    // Renderizar todas las tablas
    renderizarClientes();
    renderizarEventos();
    
    // Actualizar estadísticas
    actualizarEstadisticas();
    
    // Cargar clientes en el select
    cargarClientesEnSelect();
    
    // Mensaje en consola
    console.log('🎉 Sistema Pink Rentals cargado exitosamente');
    console.log('📊 Datos almacenados en LocalStorage');
};

// Agregar animaciones CSS para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);