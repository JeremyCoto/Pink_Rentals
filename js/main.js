// ============================================
// PINK RENTALS - CONTROLADOR PRINCIPAL (CORE)
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Sistema Iniciado');
    
    // 1. Gestionar Identidad y Menú
    gestionarNavegacion();

    // 2. Cargar contenido según el rol (Solo si estamos en el index)
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        cargarContenidoDashboard();
    }
});

// --- GESTIÓN DE NAVEGACIÓN Y ROLES ---
function gestionarNavegacion() {
    const userStr = localStorage.getItem('pinkUser');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const navContainer = document.querySelector('.nav ul');
    const userDisplay = document.getElementById('userDisplay'); // Crear este ID en el HTML
    const authButtonContainer = document.getElementById('authButtonContainer'); // Crear este ID

    if (!navContainer) return; // Protección si no hay nav

    navContainer.innerHTML = ''; // Limpiar menú actual

    // A. MENÚ PARA ADMINISTRADORES (Roles 10 y 20)
    if (user && (user.rol == 10 || user.rol == 20)) {
        navContainer.innerHTML = `
            <li><a href="index.html" class="active">Panel Admin</a></li>
            <li><a href="clientes.html">Clientes</a></li>
            <li><a href="reservaciones.html">Reservaciones</a></li>
            <li><a href="productos.html">Inventario</a></li>
            <li><a href="servicios.html">Servicios</a></li>
        `;
        if(userDisplay) userDisplay.textContent = `Hola, Admin ${user.nombre.split(' ')[0]}`;
        renderBotonLogout(authButtonContainer);
    } 
    // B. MENÚ PARA CLIENTES (Rol 30)
    else if (user && user.rol == 30) {
        navContainer.innerHTML = `
            <li><a href="index.html">Inicio</a></li>
            <li><a href="cliente_dashboard.html">🛒 Nueva Reserva</a></li>
            <li><a href="#">Mis Eventos</a></li> <!-- Futura implementación -->
        `;
        if(userDisplay) userDisplay.textContent = `Hola, ${user.nombre.split(' ')[0]}`;
        renderBotonLogout(authButtonContainer);
    } 
    // C. MENÚ PARA INVITADOS (Sin Login)
    else {
        navContainer.innerHTML = `
            <li><a href="index.html">Inicio</a></li>
            <li><a href="servicios.html">Nuestros Servicios</a></li>
            <li><a href="productos.html">Catálogo</a></li>
            <li><a href="#contacto">Contacto</a></li>
        `;
        if(userDisplay) userDisplay.textContent = 'Invitado';
        renderBotonLogin(authButtonContainer);
    }
}

function renderBotonLogin(container) {
    if(container) {
        container.innerHTML = `<a href="login.html" class="btn-nav-login">Iniciar Sesión</a>`;
    }
}

function renderBotonLogout(container) {
    if(container) {
        container.innerHTML = `<button onclick="logout()" class="btn-nav-logout">Cerrar Sesión</button>`;
    }
}

function logout() {
    localStorage.removeItem('pinkUser');
    window.location.href = 'index.html'; // Recargar como invitado
}

// --- LÓGICA DE CONTENIDO DEL HOME (INDEX) ---
async function cargarContenidoDashboard() {
    const userStr = localStorage.getItem('pinkUser');
    const user = userStr ? JSON.parse(userStr) : null;

    const adminSection = document.getElementById('admin-dashboard-section');
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-desc');

    // Ocultar todo por defecto
    if(adminSection) adminSection.style.display = 'none';

    // CASO 1: ADMIN
    if (user && (user.rol == 10 || user.rol == 20)) {
        if(adminSection) adminSection.style.display = 'block'; // Mostrar Stats
        heroTitle.innerHTML = `Panel de <span class="hero-highlight">Control</span>`;
        heroDesc.textContent = "Gestión operativa y control total del sistema.";
        
        // Cargar Stats Reales (Tu código anterior)
        mostrarEstadoConexion();
        cargarEstadisticasReales();
        cargarActividadRecienteReales();
    }
    // CASO 2: CLIENTE
    else if (user && user.rol == 30) {
        heroTitle.innerHTML = `Bienvenido a <span class="pink-text">Pink Rentals</span>`;
        heroDesc.textContent = "Estamos listos para hacer tu evento inolvidable.";
        // Aquí podrías inyectar un botón gigante de "Crear Reserva" en el Hero
        const heroContent = document.querySelector('.hero-content');
        if(heroContent && !document.getElementById('btn-hero-action')) {
            const btn = document.createElement('a');
            btn.id = 'btn-hero-action';
            btn.href = 'cliente_dashboard.html';
            btn.className = 'btn btn-primary';
            btn.style.marginTop = '20px';
            btn.textContent = '📅 Reservar Ahora';
            heroContent.appendChild(btn);
        }
    }
    // CASO 3: INVITADO
    else {
        heroTitle.innerHTML = `Experiencias <span class="hero-highlight">Inolvidables</span>`;
        heroDesc.textContent = "Photobooths, Pistas LED y la mejor tecnología para tus fiestas.";
    }
}

// --- TUS FUNCIONES DE API/STATS (Conservadas) ---
async function cargarEstadisticasReales() {
    try {
        const [clientes, reservaciones, productos, servicios] = await Promise.all([
            ApiService.getClientes(),
            ApiService.getReservaciones(),
            ApiService.getProductos(),
            ApiService.getServicios()
        ]);
        animarContador('total-clientes', clientes.length);
        animarContador('total-reservaciones', reservaciones.length);
        animarContador('total-productos', productos.length);
        animarContador('total-servicios', servicios.length);
    } catch (error) { console.error('❌ Error stats:', error); }
}

async function cargarActividadRecienteReales() {
    /* ... Tu código de actividad reciente existente ... */
    /* Asegúrate de copiar tu función cargarActividadRecienteReales aquí */
    /* Por brevedad, asumo que la mantienes del archivo anterior */
    const tbody = document.getElementById('tabla-actividad-reciente');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
    try {
        const reservaciones = await ApiService.getReservaciones();
        const clientes = await ApiService.getClientes();
        tbody.innerHTML = '';
        if (reservaciones.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">No hay actividad reciente</td></tr>`;
            return;
        }
        const ordenadas = reservaciones.sort((a, b) => new Date(b.fecha_reservacion) - new Date(a.fecha_reservacion)).slice(0, 5);
        ordenadas.forEach(r => {
            const cliente = clientes.find(c => c.usuarios_id_cedula_pk === r.usuarios_id_cedula_pk);
            const nombreCliente = cliente ? `${cliente.nombre} ${cliente.primer_apellido}` : 'Cliente desconocido';
            // Mapeo simple de estado para demo
            const estadoMap = {3:'Pendiente', 4:'Completada', 5:'Cancelada'};
            const fila = tbody.insertRow();
            fila.innerHTML = `<td><strong>#${r.reservaciones_id_reservacion_pk}</strong></td><td>Evento General</td><td>${nombreCliente}</td><td>${new Date(r.fecha_reservacion).toLocaleDateString()}</td><td>${estadoMap[r.estados_id_estado_pk] || 'Info'}</td>`;
        });
    } catch(e) { tbody.innerHTML = ''; }
}

function animarContador(id, val) {
    const el = document.getElementById(id);
    if(el) el.textContent = val;
}

function mostrarEstadoConexion() {
    const el = document.getElementById('db-status');
    if(el) { el.textContent = "Online"; el.style.color = "#4caf50"; }
}