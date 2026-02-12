process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');

describe('Product Controller Tests', () => {

  let token;
  let userId;

  beforeAll(async () => {
    const testDbUri = 'mongodb://127.0.0.1:27017/gestor-productos-test';
    await mongoose.connect(testDbUri);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});

    const response = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    token = response.body.data.token;
    userId = response.body.data.id;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('POST /api/products', () => {

    test('Debe crear un producto', async () => {

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
    });

    test('Debe fallar sin autenticación', async () => {

      const response = await request(app)
        .post('/api/products')
        .send({
          name: 'Laptop',
          description: 'Test',
          price: 100,
          category: 'Test',
          stock: 5
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

  });

});
