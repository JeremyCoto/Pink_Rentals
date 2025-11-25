document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosIniciales();
    const form = document.getElementById('form-producto');
    if(form) form.addEventListener('submit', manejarGuardado);
});

let productosCache = [];
let categoriasCache = []; 
let editandoId = null;    

async function cargarDatosIniciales() {
    const tbody = document.getElementById('tabla-productos');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';

    try {
        const [productos, categorias] = await Promise.all([
            ApiService.getProductos(),
            ApiService.getCategoriasProducto()
        ]);
        productosCache = productos;
        categoriasCache = categorias;
        renderSelectCategorias(categorias);
        renderProductos(productos.filter(p => p.estados_id_estado_pk === 1));
    } catch (e) { console.error(e); }
}

function renderProductos(productos) {
    const tbody = document.getElementById('tabla-productos');
    tbody.innerHTML = '';

    if (productos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">Vacío</td></tr>`;
        return;
    }

    const userStr = localStorage.getItem('pinkUser');
    const user = userStr ? JSON.parse(userStr) : null;
    const rol = user ? user.rol : 0;

    productos.forEach(p => {
        const cat = categoriasCache.find(c => c.categoria_producto_id_categoria_pk === p.categoria_producto_id_categoria_pk);
        const row = tbody.insertRow();
        
        let acciones = '';
        
        // CASO 1: ADMIN (Botones Editar/Eliminar)
        if(rol == 10 || rol == 20) {
            acciones = `
                <td class="text-center">
                    <button class="btn-icon editar" onclick="abrirModalEditar(${p.producto_id_producto_pk})">✏️</button>
                    <button class="btn-icon eliminar" onclick="confirmarEliminar(${p.producto_id_producto_pk})">🗑️</button>
                </td>`;
        } 
        // CASO 2: CLIENTE (Botón Agregar a Reserva)
        else if (rol == 30) {
            const item = JSON.stringify({
                id: p.producto_id_producto_pk, 
                nombre: p.nombre, 
                precio: Number(p.precio_unitario), 
                tipo: 'producto'
            }).replace(/"/g, '&quot;');
            
            acciones = `
                <td class="text-center">
                    <button class="btn-reserva" style="font-size:0.75rem; padding:6px 12px;" onclick="CartSystem.add(${item})">
                        📅 Agregar
                    </button>
                </td>`;
        } 
        // CASO 3: INVITADO (Celda oculta por CSS)
        else {
            acciones = `<td style="display:none;"></td>`; 
        }

        row.innerHTML = `
            <td>${p.producto_id_producto_pk}</td>
            <td>${p.nombre}</td>
            <td>${cat ? cat.nombre : 'General'}</td>
            <td>₡ ${Number(p.precio_unitario).toLocaleString('es-CR')}</td>
            <td>${p.cantidad}</td>
            ${acciones}
        `;
    });
}

function renderSelectCategorias(categorias) {
    const s = document.getElementById('select-categoria');
    if(!s) return;
    s.innerHTML = '<option value="">Seleccione...</option>';
    categorias.forEach(c => {
        if(c.estados_id_estado_fk === 1) {
            const o = document.createElement('option');
            o.value = c.categoria_producto_id_categoria_pk; o.textContent = c.nombre;
            s.appendChild(o);
        }
    });
}

// Modal Admin
window.abrirModalCrear = function() {
    editandoId = null;
    document.getElementById('modal-titulo').textContent = "Nuevo Producto";
    document.getElementById('form-producto').reset();
    document.getElementById('group-estado').style.display = 'none';
    document.getElementById('modal-producto').style.display = 'flex';
};
window.abrirModalEditar = function(id) {
    const p = productosCache.find(x => x.producto_id_producto_pk == id);
    if(!p) return;
    editandoId = id;
    document.getElementById('modal-titulo').textContent = "Editar Producto";
    document.getElementById('nombre').value = p.nombre;
    document.getElementById('descripcion').value = p.descripcion;
    document.getElementById('select-categoria').value = p.categoria_producto_id_categoria_pk;
    document.getElementById('precio').value = p.precio_unitario;
    document.getElementById('cantidad').value = p.cantidad;
    document.getElementById('group-estado').style.display = 'flex';
    document.getElementById('select-estado').value = p.estados_id_estado_pk;
    document.getElementById('modal-producto').style.display = 'flex';
};
window.cerrarModal = function() { document.getElementById('modal-producto').style.display = 'none'; };

// Guardar
async function manejarGuardado(e) {
    e.preventDefault();
    const d = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        categoriaId: document.getElementById('select-categoria').value,
        precio: document.getElementById('precio').value,
        cantidad: document.getElementById('cantidad').value,
        estado: document.getElementById('select-estado').value
    };
    try {
        if(editandoId) await ApiService.actualizarProducto(editandoId, d);
        else await ApiService.crearProducto(d);
        cerrarModal(); cargarDatosIniciales();
    } catch(err) { alert(err.message); }
}

// Eliminar
window.confirmarEliminar = async function(id) {
    if(confirm("¿Eliminar?")) {
        try { await ApiService.eliminarProducto(id); cargarDatosIniciales(); }
        catch(err) { alert(err.message); }
    }
};