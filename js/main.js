// main.js

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Sistema Iniciado');
    gestionarNavegacion();
    inicializarEventosGlobales();
});

function inicializarEventosGlobales() {
    document.addEventListener('click', function(e) {
        // Dropdown Navegación
        const isNavDropdown = e.target.matches('.nav-item-dropdown > a');
        if (isNavDropdown) {
            e.preventDefault();
            const dropdownContent = e.target.nextElementSibling;
            cerrarTodosDropdowns(dropdownContent);
            dropdownContent.classList.toggle('show');
            return;
        }

        // Menú Usuario
        const isUserMenu = e.target.closest('.user-menu-container');
        if (isUserMenu) {
            const userContent = isUserMenu.querySelector('.user-dropdown-content');
            if(userContent) userContent.style.display = (userContent.style.display === 'block') ? 'none' : 'block';
            return;
        }

        // Click fuera
        if (!e.target.closest('.dropdown-content') && !e.target.closest('.user-dropdown-content')) {
            cerrarTodosDropdowns(null);
            const userMenus = document.querySelectorAll('.user-dropdown-content');
            userMenus.forEach(m => m.style.display = 'none');
        }
    });
}

function cerrarTodosDropdowns(excepto) {
    document.querySelectorAll('.dropdown-content.show').forEach(d => {
        if (d !== excepto) d.classList.remove('show');
    });
}

function gestionarNavegacion() {
    const userStr = localStorage.getItem('pinkUser');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const navContainer = document.querySelector('.nav ul');
    const authContainer = document.getElementById('authButtonContainer');
    const userDisplay = document.getElementById('userDisplay');
    
    if (!navContainer) return;
    navContainer.innerHTML = ''; 

    const path = window.location.pathname.split("/").pop();
    const isActive = (p) => path === p ? 'active-link' : '';

    // A. ADMIN (Rol 10 o 20)
    if (user && (user.rol == 10 || user.rol == 20)) {
        navContainer.innerHTML = `
            <li><a href="index.html" class="${isActive('index.html')}">Panel</a></li>
            <li><a href="clientes.html" class="${isActive('clientes.html')}">Clientes</a></li>
            <li><a href="reservaciones.html" class="${isActive('reservaciones.html')}">Reservas</a></li>
            <li><a href="productos.html" class="${isActive('productos.html')}">Prod</a></li>
            <li><a href="servicios.html" class="${isActive('servicios.html')}">Serv</a></li>
            
            <li class="nav-item-dropdown">
                <a href="#" class="${['usuarios.html', 'paquetes.html', 'ubicaciones.html', 'facturacion.html'].includes(path) ? 'active-link' : ''}">Más Opciones ▾</a>
                <div class="dropdown-content">
                    <a href="usuarios.html">👥 Usuarios y Roles</a>
                    <a href="paquetes.html">📦 Paquetes</a>
                    <a href="ubicaciones.html">📍 Ubicaciones</a>
                    <a href="facturas.html">📄 Facturación</a>
                </div>
            </li>
        `;
        renderUserDropdown(user);
    } 
    // B. CLIENTE (Rol 30)
    else if (user && user.rol == 30) {
        navContainer.innerHTML = `
            <li><a href="index.html" class="${isActive('index.html')}">Inicio</a></li>
            <li><a href="servicios.html" class="${isActive('servicios.html')}">Servicios</a></li>
            <li><a href="productos.html" class="${isActive('productos.html')}">Productos</a></li>
            <li class="nav-item-dropdown">
                <a href="#" class="${path.includes('cliente_dashboard') ? 'active-link' : ''}">Mis Reservas</a>
                <div class="dropdown-content">
                    <a href="cliente_dashboard.html?view=checkout">📅 Nueva Reserva</a>
                    <a href="cliente_dashboard.html?view=history">📜 Historial</a>
                </div>
            </li>
        `;
        renderUserDropdown(user);
    } 
    // C. INVITADO
    else {
        navContainer.innerHTML = `
            <li><a href="index.html" class="${isActive('index.html')}">Inicio</a></li>
            <li><a href="servicios.html" class="${isActive('servicios.html')}">Servicios</a></li>
            <li><a href="productos.html" class="${isActive('productos.html')}">Productos</a></li>
        `;
        if(authContainer) authContainer.innerHTML = `<a href="login.html" class="btn btn-primary" style="padding: 5px 15px;">Ingresar</a>`;
    }
}

function renderUserDropdown(user) {
    const userDisplay = document.getElementById('userDisplay');
    if(!userDisplay) return;
    userDisplay.innerHTML = `
        <div class="user-menu-container">
            <span style="color:#fff; font-weight:500;">Hola, ${user.nombre.split(' ')[0]} ▾</span>
            <div class="user-dropdown-content">
                <button onclick="window.location.href='index.html'">🏠 Inicio</button>
                <button onclick="logout()">🔒 Salir</button>
            </div>
        </div>
    `;
}

function logout() {
    localStorage.removeItem('pinkUser');
    localStorage.removeItem('pinkCart');
    window.location.href = 'index.html'; 
}

const CartSystem = {
    add: (item) => {
        let cart = JSON.parse(localStorage.getItem('pinkCart') || '[]');
        cart.push(item);
        localStorage.setItem('pinkCart', JSON.stringify(cart));
        alert(`✅ "${item.nombre}" agregado.`);
        window.dispatchEvent(new Event('cartUpdated'));
    },
    get: () => JSON.parse(localStorage.getItem('pinkCart') || '[]'),
    remove: (idx) => {
        let cart = CartSystem.get();
        cart.splice(idx, 1);
        localStorage.setItem('pinkCart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated')); 
    },
    clear: () => {
        localStorage.removeItem('pinkCart');
        window.dispatchEvent(new Event('cartUpdated'));
    }
};