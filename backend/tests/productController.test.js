const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');

describe('Product Controller Tests', () => {
  let token;
  let userId;

  // Conectar a base de datos de prueba
  beforeAll(async () => {
    const testDbUri = 'mongodb://localhost:27017/gestor-productos-test';
    await mongoose.connect(testDbUri);
  });

  // Limpiar base de datos y crear usuario de prueba
  beforeEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});

    // Registrar usuario y obtener token
    const response = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    token = response.body.data.token;
    userId = response.body.data.id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Tests de Crear Producto
  describe('POST /api/products', () => {
    test('Debe crear un producto exitosamente', async () => {
      const productData = {
        name: 'Laptop HP',
        description: 'Laptop de alta gama',
        price: 15000,
        category: 'Electrónica',
        stock: 10
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(productData.name);
      expect(response.body.data.price).toBe(productData.price);
    });

    test('Debe fallar si faltan campos requeridos', async () => {
      const productData = {
        name: 'Laptop HP'
        // Faltan description, price, category
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Debe fallar sin autenticación', async () => {
      const productData = {
        name: 'Laptop HP',
        description: 'Laptop de alta gama',
        price: 15000,
        category: 'Electrónica'
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // Tests de Obtener Productos
  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Crear algunos productos de prueba
      await Product.create([
        {
          name: 'Producto 1',
          description: 'Descripción 1',
          price: 100,
          category: 'Categoría A',
          stock: 5,
          createdBy: userId
        },
        {
          name: 'Producto 2',
          description: 'Descripción 2',
          price: 200,
          category: 'Categoría B',
          stock: 10,
          createdBy: userId
        }
      ]);
    });

    test('Debe obtener todos los productos', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    test('Debe fallar sin autenticación', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // Tests de Obtener Producto por ID
  describe('GET /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({
        name: 'Producto Test',
        description: 'Descripción Test',
        price: 100,
        category: 'Test',
        stock: 5,
        createdBy: userId
      });
      productId = product._id;
    });

    test('Debe obtener un producto por ID', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Producto Test');
    });

    test('Debe fallar con ID inválido', async () => {
      const response = await request(app)
        .get('/api/products/123456789012345678901234')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  // Tests de Actualizar Producto
  describe('PUT /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({
        name: 'Producto Original',
        description: 'Descripción Original',
        price: 100,
        category: 'Original',
        stock: 5,
        createdBy: userId
      });
      productId = product._id;
    });

    test('Debe actualizar un producto exitosamente', async () => {
      const updatedData = {
        name: 'Producto Actualizado',
        price: 150
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Producto Actualizado');
      expect(response.body.data.price).toBe(150);
    });

    test('Debe fallar si el usuario no es el creador', async () => {
      // Crear otro usuario
      const otherUserResponse = await request(app).post('/api/auth/register').send({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${otherUserResponse.body.data.token}`)
        .send({ name: 'Intento de actualización' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  // Tests de Eliminar Producto
  describe('DELETE /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({
        name: 'Producto a Eliminar',
        description: 'Descripción',
        price: 100,
        category: 'Test',
        stock: 5,
        createdBy: userId
      });
      productId = product._id;
    });

    test('Debe eliminar un producto exitosamente', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminado exitosamente');

      // Verificar que el producto fue eliminado
      const product = await Product.findById(productId);
      expect(product).toBeNull();
    });

    test('Debe fallar si el usuario no es el creador', async () => {
      // Crear otro usuario
      const otherUserResponse = await request(app).post('/api/auth/register').send({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${otherUserResponse.body.data.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('Debe fallar con ID que no existe', async () => {
      const response = await request(app)
        .delete('/api/products/123456789012345678901234')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});