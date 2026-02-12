const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas las rutas de productos requieren autenticación
router.use(authMiddleware);

// CRUD de productos
router.post('/', productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Ruta adicional para buscar por categoría
router.get('/category/:category', productController.getProductsByCategory);

module.exports = router;