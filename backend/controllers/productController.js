const Product = require('../models/Product');

// Crear producto
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    // Validar datos
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos (nombre, descripción, precio, categoría)'
      });
    }

    // Crear producto
    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock: stock || 0,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

// Obtener todos los productos
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

// Obtener un producto por ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
};

// Actualizar producto
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    // Buscar producto
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar que el usuario sea el creador del producto
    if (product.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar este producto'
      });
    }

    // Actualizar producto
    product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: name || product.name,
        description: description || product.description,
        price: price !== undefined ? price : product.price,
        category: category || product.category,
        stock: stock !== undefined ? stock : product.stock,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// Eliminar producto
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar que el usuario sea el creador del producto
    if (product.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este producto'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};

// Buscar productos por categoría
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category })
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al buscar productos por categoría',
      error: error.message
    });
  }
};