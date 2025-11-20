// Utilidades generales para Pink Rentals
// - Manejo de tema oscuro/claro
// - Helpers de fecha y notificaciones

(function () {
    const THEME_KEY = 'pinkrentals_theme';

    function applyTheme(theme) {
        const body = document.body;
        if (!body) return;

        body.classList.remove('theme-dark', 'theme-light');
        body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');

        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.setAttribute('data-theme', theme);
        }
    }

    function initTheme() {
        const saved = localStorage.getItem(THEME_KEY) || 'dark';
        applyTheme(saved);
    }

    function toggleTheme() {
        const current = localStorage.getItem(THEME_KEY) || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    }

    function formatearFechaES(fechaISO) {
        if (!fechaISO) return 'Sin fecha';
        try {
            const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(fechaISO + 'T00:00:00').toLocaleDateString('es-ES', opciones);
        } catch {
            return fechaISO;
        }
    }

    function mostrarToast(mensaje, tipo = 'info') {
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion notificacion-${tipo}`;
        notificacion.textContent = mensaje;
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background-color: ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            z-index: 3000;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(notificacion);
        setTimeout(() => {
            notificacion.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notificacion.remove(), 300);
        }, 3000);
    }

    window.PinkUtils = {
        initTheme,
        toggleTheme,
        formatearFechaES,
        mostrarToast
    };

    document.addEventListener('DOMContentLoaded', initTheme);
})();