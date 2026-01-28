const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");

// Rotas CRUD para produtos
router.post("/products", productController.create);
router.get("/products", productController.getAll);
router.get("/products/featured", productController.getFeatured);
router.get("/products/category/:category", productController.getByCategory);
router.get("/products/:id", productController.getById);
router.put("/products/:id", productController.update);
router.delete("/products/:id", productController.delete);

module.exports = router;
