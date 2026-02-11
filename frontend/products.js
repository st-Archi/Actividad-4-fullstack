document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem('token');
    const productForm = document.getElementById('productForm');
    const productList = document.getElementById('product-list');
    const message = document.getElementById('message');
    const logoutBtn = document.getElementById('logoutBtn');
    const aldeanoSound = document.getElementById('aldeanoSound');
    const salirSound = document.getElementById('salirSound'); 

    
    message.style.display = 'none';

   
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            
            salirSound.currentTime = 0;
            await salirSound.play();

            
            document.body.style.transition = "all 1s ease";
            document.body.style.filter = "brightness(0.3) blur(4px)";

            
            setTimeout(() => {
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            }, 1000);
        });
    }

    
    async function fetchProducts() {
        try {
            const res = await fetch('http://localhost:5000/api/products', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'index.html';
                return;
            }

            const products = await res.json();
            productList.innerHTML = '';

            if (products.length === 0) {
                productList.innerHTML = '<li style="text-align: center; color: #888;">No hay productos aún</li>';
                return;
            }

            products.forEach(product => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="product-info">
                        <h4>${product.name}</h4>
                        <p><strong>Descripción:</strong> ${product.description || 'Sin descripción'}</p>
                        <p><strong>Precio:</strong> $${product.price}</p>
                    </div>
                    <div class="product-actions">
                        <button class="edit-btn" onclick="editProduct('${product._id}', '${product.name.replace(/'/g, "\\'")}', '${(product.description || '').replace(/'/g, "\\'")}', ${product.price})">Editar</button>
                        <button class="delete-btn" onclick="deleteProduct('${product._id}')">Eliminar</button>
                    </div>
                `;
                productList.appendChild(li);
            });

        } catch (err) {
            console.error('Error:', err);
            message.style.display = 'block';
            message.style.color = 'red';
            message.innerText = 'Error al cargar productos';
        }
    }

  
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const description = document.getElementById('description').value;
            const price = document.getElementById('price').value;

            try {
                const res = await fetch('http://localhost:5000/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, description, price: Number(price) })
                });

                const data = await res.json();

                message.style.display = 'block';

                if (res.ok) {
                    
                    aldeanoSound.currentTime = 0;
                    aldeanoSound.play();

                    message.style.color = 'green';
                    message.innerText = 'Producto agregado';
                    productForm.reset();
                    fetchProducts();
                } else {
                    message.style.color = 'red';
                    message.innerText = data.message || 'Error al agregar producto';
                }

            } catch (err) {
                message.style.display = 'block';
                message.style.color = 'red';
                message.innerText = 'Error en el servidor';
            }
        });
    }


    window.editProduct = async (id, name, description, price) => {
        const newName = prompt('Nombre:', name);
        if (newName === null) return;

        const newDescription = prompt('Descripción:', description);
        if (newDescription === null) return;

        const newPrice = prompt('Precio:', price);
        if (newPrice === null) return;

        try {
            const res = await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newName,
                    description: newDescription,
                    price: Number(newPrice)
                })
            });

            const data = await res.json();

            message.style.display = 'block';

            if (res.ok) {
                message.style.color = 'green';
                message.innerText = 'Producto actualizado';
                fetchProducts();
            } else {
                message.style.color = 'red';
                message.innerText = data.message || 'Error al actualizar';
            }

        } catch (err) {
            message.style.display = 'block';
            message.style.color = 'red';
            message.innerText = 'Error en el servidor';
        }
    };

    
    window.deleteProduct = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();

            message.style.display = 'block';

            if (res.ok) {
                message.style.color = 'green';
                message.innerText = 'Producto eliminado';
                fetchProducts();
            } else {
                message.style.color = 'red';
                message.innerText = data.message || 'Error al eliminar';
            }

        } catch (err) {
            message.style.display = 'block';
            message.style.color = 'red';
            message.innerText = 'Error en el servidor';
        }
    };

    
    fetchProducts();

});