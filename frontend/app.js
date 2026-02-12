// Configuración de la API
const API_URL = window.location.origin + '/api';

// Utilidades
const showMessage = (elementId, message, type) => {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// ============ AUTENTICACIÓN ============

// Mostrar formulario de login
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.remove('active');
}

// Mostrar formulario de registro
function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
}

// Login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('username', data.data.username);
                localStorage.setItem('email', data.data.email);
                showMessage('loginMessage', '¡Login exitoso! Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = '/products';
                }, 1500);
            } else {
                showMessage('loginMessage', data.message, 'error');
            }
        } catch (error) {
            showMessage('loginMessage', 'Error al conectar con el servidor', 'error');
        }
    });
}

// Registro
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // Validar contraseñas
        if (password !== confirmPassword) {
            showMessage('registerMessage', 'Las contraseñas no coinciden', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('registerMessage', 'La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('username', data.data.username);
                localStorage.setItem('email', data.data.email);
                showMessage('registerMessage', '¡Registro exitoso! Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = '/products';
                }, 1500);
            } else {
                showMessage('registerMessage', data.message, 'error');
            }
        } catch (error) {
            showMessage('registerMessage', 'Error al conectar con el servidor', 'error');
        }
    });
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    window.location.href = '/';
}

// Mostrar información del usuario
function displayUserInfo() {
    const username = localStorage.getItem('username');
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl && username) {
        userInfoEl.textContent = `Bienvenido, ${username}`;
    }
}

// ============ GESTIÓN DE PRODUCTOS ============

let editingProductId = null;

// Cargar productos
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            displayProducts(data.data);
        } else {
            if (response.status === 401) {
                logout();
            }
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Mostrar productos
function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    const noProducts = document.getElementById('noProducts');

    if (!products || products.length === 0) {
        container.innerHTML = '';
        noProducts.style.display = 'block';
        return;
    }

    noProducts.style.display = 'none';
    container.innerHTML = products.map(product => `
        <div class="product-card" data-name="${product.name.toLowerCase()}" data-category="${product.category.toLowerCase()}">
            <div class="product-header">
                <h3 class="product-name">${product.name}</h3>
                <span class="product-category">${product.category}</span>
            </div>
            <p class="product-description">${product.description}</p>
            <div class="product-details">
                <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                <div class="product-stock">
                    <span class="stock-label">Stock</span>
                    <span class="stock-value">${product.stock}</span>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn btn-edit" onclick="editProduct('${product._id}')">Editar</button>
                <button class="btn btn-delete" onclick="deleteProduct('${product._id}')">Eliminar</button>
            </div>
        </div>
    `).join('');
}

// Agregar/Actualizar producto
if (document.getElementById('productForm')) {
    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const productData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            category: document.getElementById('productCategory').value,
            stock: parseInt(document.getElementById('productStock').value)
        };

        try {
            const url = editingProductId 
                ? `${API_URL}/products/${editingProductId}`
                : `${API_URL}/products`;
            
            const method = editingProductId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(productData)
            });

            const data = await response.json();

            if (data.success) {
                showMessage('formMessage', data.message, 'success');
                document.getElementById('productForm').reset();
                cancelEdit();
                loadProducts();
            } else {
                showMessage('formMessage', data.message, 'error');
            }
        } catch (error) {
            showMessage('formMessage', 'Error al guardar el producto', 'error');
        }
    });
}

// Editar producto
async function editProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            const product = data.data;
            
            document.getElementById('productId').value = product._id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productStock').value = product.stock;
            
            editingProductId = product._id;
            document.getElementById('formTitle').textContent = 'Editar Producto';
            document.getElementById('submitBtn').textContent = 'Actualizar Producto';
            document.getElementById('cancelBtn').style.display = 'block';
            
            // Scroll al formulario
            document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error al cargar producto:', error);
    }
}

// Cancelar edición
function cancelEdit() {
    editingProductId = null;
    document.getElementById('productForm').reset();
    document.getElementById('formTitle').textContent = 'Agregar Nuevo Producto';
    document.getElementById('submitBtn').textContent = 'Agregar Producto';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('productId').value = '';
}

// Eliminar producto
async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            loadProducts();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error al eliminar el producto');
    }
}

// Filtrar productos
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const name = card.getAttribute('data-name');
        const category = card.getAttribute('data-category');
        
        if (name.includes(searchTerm) || category.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}