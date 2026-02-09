// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// Rotas CRUD para categorias
router.post("/categories", categoryController.create);
router.get("/categories", categoryController.getAll);
router.get("/categories/with-count", categoryController.getAllWithProductCount);
router.get("/categories/slug/:slug", categoryController.getBySlug);
router.get("/categories/:id", categoryController.getById);
router.get(
  "/categories/:id/products",
  categoryController.getProductsByCategory,
);
router.get(
  "/categories/:id/product-count",
  categoryController.getProductCountByCategory,
);
router.put("/categories/:id", categoryController.update);
router.delete("/categories/:id", categoryController.delete);

module.exports = router;
