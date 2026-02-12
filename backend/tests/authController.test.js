const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Auth Controller Tests', () => {
  // Conectar a base de datos de prueba antes de las pruebas
  beforeAll(async () => {
    const testDbUri = 'mongodb://localhost:27017/gestor-productos-test';
    await mongoose.connect(testDbUri);
  });

  // Limpiar la base de datos antes de cada prueba
  beforeEach(async () => {
    await User.deleteMany({});
  });

  // Cerrar conexión después de todas las pruebas
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Tests de Registro
  describe('POST /api/auth/register', () => {
    test('Debe registrar un nuevo usuario exitosamente', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.username).toBe(userData.username);
      expect(response.body.data.email).toBe(userData.email);
    });

    test('Debe fallar si faltan campos requeridos', async () => {
      const userData = {
        email: 'test@example.com'
        // Falta username y password
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Debe fallar si el email ya está registrado', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Registrar usuario primero
      await request(app).post('/api/auth/register').send(userData);

      // Intentar registrar con el mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          email: 'test@example.com',
          password: 'password456'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ya está registrado');
    });

    test('Debe fallar si el username ya está registrado', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Registrar usuario primero
      await request(app).post('/api/auth/register').send(userData);

      // Intentar registrar con el mismo username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'other@example.com',
          password: 'password456'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // Tests de Login
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear un usuario para las pruebas de login
      await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    test('Debe hacer login exitosamente con credenciales correctas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.email).toBe('test@example.com');
    });

    test('Debe fallar con email incorrecto', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciales inválidas');
    });

    test('Debe fallar con contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciales inválidas');
    });

    test('Debe fallar si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Falta password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // Tests de Perfil
  describe('GET /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      // Registrar y obtener token
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      token = response.body.data.token;
    });

    test('Debe obtener el perfil con token válido', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    test('Debe fallar sin token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Debe fallar con token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer tokeninvalido')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});