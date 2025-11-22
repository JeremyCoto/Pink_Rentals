document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosIniciales();
    // Solo agregar listener de form si existe (es decir, si es admin y el modal existe)
    const form = document.getElementById('form-producto');
    if(form) form.addEventListener('submit', manejarGuardado);
});

let productosCache = [];
let categoriasCache = []; 
let editandoId = null;    

async function cargarDatosIniciales() {
    const tbody = document.getElementById('tabla-productos');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando inventario...</td></tr>';

    try {
        const [productos, categorias] = await Promise.all([
            ApiService.getProductos(),
            ApiService.getCategoriasProducto()
        ]);

        productosCache = productos;
        categoriasCache = categorias;

        renderSelectCategorias(categorias);
        
        // Filtrar activos
        const activos = productos.filter(p => p.estados_id_estado_pk === 1);
        renderProductos(activos);

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error de conexión.</td></tr>';
    }
}

function renderProductos(productos) {
    const tbody = document.getElementById('tabla-productos');
    tbody.innerHTML = '';

    if (productos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;">No hay productos registrados.</td></tr>`;
        return;
    }

    // DETECCIÓN DE ROL PARA UI
    const userStr = localStorage.getItem('pinkUser');
    let isAdmin = false;
    if(userStr) {
        const user = JSON.parse(userStr);
        if(user.rol == 10 || user.rol == 20) isAdmin = true;
    }

    productos.forEach(p => {
        const cat = categoriasCache.find(c => c.categoria_producto_id_categoria_pk === p.categoria_producto_id_categoria_pk);
        const nombreCategoria = cat ? cat.nombre : 'General';

        const fila = tbody.insertRow();
        
        // Construcción condicional de la celda de acciones
        let accionesHTML = '';
        if(isAdmin) {
            accionesHTML = `
                <td style="text-align: center;">
                    <button class="btn-icon editar" onclick="abrirModalEditar(${p.producto_id_producto_pk})" title="Editar">✏️</button>
                    <button class="btn-icon eliminar" onclick="confirmarEliminar(${p.producto_id_producto_pk})" title="Eliminar">🗑️</button>
                </td>`;
        } else {
            // Si es invitado, dejamos la celda vacía o la ocultamos con CSS
            accionesHTML = `<td style="display:none;"></td>`; 
        }

        fila.innerHTML = `
            <td>${p.producto_id_producto_pk}</td>
            <td>${p.nombre}</td>
            <td>${nombreCategoria}</td>
            <td>₡ ${Number(p.precio_unitario).toLocaleString('es-CR')}</td>
            <td>${p.cantidad}</td>
            ${accionesHTML}
        `;
    });
}

function renderSelectCategorias(categorias) {
    const select = document.getElementById('select-categoria');
    if(!select) return; // Si no existe el modal (invitado), salir
    
    select.innerHTML = '<option value="">Seleccione...</option>';
    categorias.forEach(c => {
        if (c.estados_id_estado_fk === 1) {
            const option = document.createElement('option');
            option.value = c.categoria_producto_id_categoria_pk;
            option.textContent = c.nombre;
            select.appendChild(option);
        }
    });
}

// --- LÓGICA DEL MODAL (Solo funciona si eres Admin) ---
window.abrirModalCrear = function() {
    editandoId = null;
    document.getElementById('modal-titulo').textContent = "Nuevo Producto";
    document.getElementById('form-producto').reset();
    document.getElementById('group-estado').style.display = 'none'; 
    document.getElementById('modal-producto').style.display = 'flex';
};

window.abrirModalEditar = function(id) {
    const prod = productosCache.find(p => p.producto_id_producto_pk == id);
    if (!prod) return;

    editandoId = id;
    document.getElementById('modal-titulo').textContent = `Editar Producto #${id}`;
    document.getElementById('nombre').value = prod.nombre;
    document.getElementById('descripcion').value = prod.descripcion || '';
    document.getElementById('select-categoria').value = prod.categoria_producto_id_categoria_pk;
    document.getElementById('precio').value = prod.precio_unitario;
    document.getElementById('cantidad').value = prod.cantidad;
    document.getElementById('group-estado').style.display = 'flex';
    document.getElementById('select-estado').value = prod.estados_id_estado_pk;
    document.getElementById('modal-producto').style.display = 'flex';
};

window.cerrarModal = function() {
    const modal = document.getElementById('modal-producto');
    if(modal) modal.style.display = 'none';
};

async function manejarGuardado(e) {
    e.preventDefault();
    const datos = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        categoriaId: document.getElementById('select-categoria').value,
        precio: document.getElementById('precio').value,
        cantidad: document.getElementById('cantidad').value,
        estado: document.getElementById('select-estado').value
    };

    try {
        if (editandoId) {
            await ApiService.actualizarProducto(editandoId, datos);
            alert('Producto actualizado');
        } else {
            await ApiService.crearProducto(datos);
            alert('Producto creado con éxito');
        }
        cerrarModal();
        cargarDatosIniciales();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

window.confirmarEliminar = async function(id) {
    if (confirm(`¿Seguro de eliminar el producto #${id}?`)) {
        try {
            await ApiService.eliminarProducto(id);
            cargarDatosIniciales();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
};